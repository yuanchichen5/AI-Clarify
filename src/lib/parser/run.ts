import { llm } from "@/lib/llm/client";
import {
  NOTE_EXTRACT_SYSTEM,
  SUBJECT_INFER_SYSTEM,
  CHATLOG_PREFIX,
  subjectRefinePrompt,
} from "@/lib/llm/prompts";
import {
  safeParseJson,
  validateParseResult,
  validateSubjectInference,
  type ParseResult,
} from "@/lib/llm/schema";
import type { ChatMessage } from "@/lib/llm/types";
import { isAiConfigured } from "@/lib/llm/providers";
import type { ExtractedFile } from "./extract";

export interface ParseInput {
  mode: "camera" | "screenshot" | "text" | "chatlog" | "ppt" | "pdf" | "video";
  /** 文本/对话录入内容 */
  text?: string;
  /** 已抽取文件内容（服务端） */
  files?: ExtractedFile[];
  /** 用户指定学科（兜底/改选后重新提取） */
  subject?: string;
}

export interface ParseOutcome {
  result: ParseResult;
  /** 是否使用了演示 Mock（未配置 AI key 时） */
  mocked: boolean;
  /** 学科置信度低于阈值时前端需展示手动选择 */
  needsSubjectConfirm: boolean;
}

/** 演示模式 Mock：明确标注，仅当启用 MOCK_AI 且未配置真实 key 时使用 */
function mockParse(input: ParseInput): ParseResult {
  const source = input.text
    ? input.text.slice(0, 200)
    : (input.files ?? [])
        .map((f) => f.text.slice(0, 300))
        .join(" ")
        .slice(0, 500);
  return {
    subject: input.subject ?? "数学",
    confidence: 0.6,
    knowledgePoints: [
      {
        title: "知识点提炼（演示数据）",
        definition: `AI 演示模式已读取材料片段：「${source || "（无文本内容）"}」。配置 DASHSCOPE_API_KEY 或 DEEPSEEK_API_KEY 后可获得真实解析。`,
        kind: "focus",
        important: true,
      },
      {
        title: "重点与难点标记（演示数据）",
        definition: "演示模式下知识点可全量编辑，左边框颜色标识重点（紫）/ 难点（琥珀）/ 段子（灰）。",
        kind: "difficulty",
        important: false,
      },
    ],
    difficulties: [
      {
        title: "AI 服务未配置（演示模式）",
        summary: "当前返回为演示数据，请在 .env.local 配置模型密钥后获得真实 AI 解析。",
        suggestion: "配置 DASHSCOPE_API_KEY（Qwen3-Max / Qwen-VL）或 DEEPSEEK_API_KEY",
      },
    ],
    supplements: ["演示模式：结构化笔记模板已就绪，可编辑后归档。"],
  };
}

/**
 * 解析编排（M1-3 / M1-4）：
 * 1. 学科推断（置信度 < 0.6 → needsSubjectConfirm 由前端兜底）
 * 2. 知识点/难点提取（JSON Schema 校验，失败重试一次，再失败抛错）
 */
export async function runParse(input: ParseInput): Promise<ParseOutcome> {
  // 演示模式：显式启用 MOCK_AI 且无真实 key
  const mockEnabled = process.env.MOCK_AI === "true";
  if (mockEnabled && !isAiConfigured()) {
    return { result: mockParse(input), mocked: true, needsSubjectConfirm: false };
  }

  // 组装用户消息
  const contentParts: string[] = [];
  if (input.text) contentParts.push(`材料内容：\n${input.text}`);
  for (const f of input.files ?? []) {
    if (f.kind === "image") {
      contentParts.push(`图片文件「${f.name}」已作为视觉输入处理`);
    } else if (f.text) {
      contentParts.push(`文件「${f.name}」内容：\n${f.text.slice(0, 12000)}`);
    }
  }
  const userContent =
    contentParts.join("\n\n").slice(0, 20000) || "（材料内容为空）";

  const messages: ChatMessage[] = [
    { role: "user", content: userContent },
  ];

  // 1. 学科推断（未指定学科时）
  let subject = input.subject ?? "";
  let confidence = 0;
  if (!subject) {
    const infer = await llm.chat({
      model: "qwen3-max",
      system: SUBJECT_INFER_SYSTEM,
      messages,
      jsonMode: true,
      temperature: 0.1,
    });
    const parsed = validateSubjectInference(safeParseJson(infer.content));
    if (parsed) {
      subject = parsed.subject;
      confidence = parsed.confidence;
    }
  } else {
    confidence = 1;
  }

  // 2. 知识点/难点提取（含一次 Schema 失败重试）
  const system = input.mode === "chatlog" ? NOTE_EXTRACT_SYSTEM + "\n\n" + CHATLOG_PREFIX : NOTE_EXTRACT_SYSTEM;
  const extractMessages: ChatMessage[] = [
    ...messages,
    ...(subject ? [{ role: "user" as const, content: subjectRefinePrompt(subject) }] : []),
  ];

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await llm.chat({
        model: "qwen3-max",
        system,
        messages: extractMessages,
        jsonMode: true,
        temperature: 0.3,
      });
      const validated = validateParseResult(safeParseJson(res.content));
      if (validated) {
        // 以最终学科为准（用户改选或推断结果）
        validated.subject = subject || validated.subject || "其他";
        validated.confidence = confidence || validated.confidence || 0;
        return {
          result: validated,
          mocked: false,
          needsSubjectConfirm: confidence > 0 && confidence < 0.6,
        };
      }
      lastError = "AI 输出格式不符合 Schema，已重试";
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(lastError ?? "解析失败");
}

/** 视觉解析（Qwen-VL，图片路径；M1-3） */
export async function runVisionParse(
  images: { name: string; base64: string; mime: string }[]
): Promise<ParseOutcome> {
  const parts: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = images.map((img) => ({
    type: "image_url",
    image_url: { url: `data:${img.mime};base64,${img.base64}` },
  }));
  parts.push({ type: "text" as const, text: "请解析这张学习材料图片，并按规则提取知识点与难点。只输出 JSON。" });

  // 图片路径也走统一抽象（qwen-vl 提供商）
  const { llm } = await import("@/lib/llm/client");
  const res = await llm.chat({
    model: "qwen-vl",
    system: NOTE_EXTRACT_SYSTEM,
    messages: [{ role: "user", content: "", parts }],
    jsonMode: true,
    temperature: 0.2,
  });
  const validated = validateParseResult(safeParseJson(res.content));
  if (!validated) throw new Error("视觉解析输出格式不符合 Schema");
  return { result: validated, mocked: false, needsSubjectConfirm: validated.confidence < 0.6 };
}

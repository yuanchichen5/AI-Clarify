import { z } from "zod";

/**
 * AI 结构化输出 Schema（zod）· 校验失败重试一次，二次失败走降级路径
 * 对应 API 契约示例 4.4 的 ParseResult
 */

export const KpKindSchema = z.enum(["focus", "difficulty", "redun"]);

export const SubjectInferenceSchema = z.object({
  subject: z.string().min(1).max(20),
  confidence: z.number().min(0).max(1),
  reason: z.string().optional(),
});

export const ParseResultSchema = z.object({
  subject: z.string().min(1).max(20),
  confidence: z.number().min(0).max(1),
  knowledgePoints: z
    .array(
      z.object({
        title: z.string().min(1),
        definition: z.string().default(""),
        kind: KpKindSchema.default("focus"),
        important: z.boolean().default(false),
      })
    )
    .min(1, "至少包含 1 个知识点"),
  difficulties: z
    .array(
      z.object({
        title: z.string().min(1),
        summary: z.string().default(""),
        suggestion: z.string().optional(),
      })
    )
    .default([]),
  supplements: z.array(z.string()).default([]),
});

export type ParseResult = z.infer<typeof ParseResultSchema>;
export type SubjectInference = z.infer<typeof SubjectInferenceSchema>;

/** 安全解析：剥离 Markdown 代码块包裹后解析，失败返回 null */
export function safeParseJson(text: string): unknown | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/^```(?:json)?\s*/g, "")
      .replace(/\s*```$/g, "")
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

/** 校验 + 规范化（zod 兜底默认值） */
export function validateParseResult(raw: unknown): ParseResult | null {
  const result = ParseResultSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function validateSubjectInference(raw: unknown): SubjectInference | null {
  const result = SubjectInferenceSchema.safeParse(raw);
  return result.success ? result.data : null;
}

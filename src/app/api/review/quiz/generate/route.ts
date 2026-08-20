import { NextResponse } from "next/server";
import { llm } from "@/lib/llm/client";
import { isAiConfigured } from "@/lib/llm/providers";

/**
 * POST /api/review/quiz/generate — 变体题生成（走降本模型 deepseek-v4-flash）
 * 请求：{ title, definition, kind }
 * 未配置 AI key → 503（前端使用演示模板变体）
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body?.title) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "缺少知识点标题" } }, { status: 400 });
    }
    if (!isAiConfigured()) {
      return NextResponse.json(
        { error: { code: "UNCONFIGURED", message: "AI 未配置，前端使用演示模板变体" } },
        { status: 503 }
      );
    }
    const res = await llm.chat({
      model: "deepseek-v4-flash",
      system:
        "你是命题专家。根据给定知识点，生成一道变体题（同知识点、不同数据/表述），输出 JSON：{question, answer, explanation}",
      messages: [
        {
          role: "user",
          content: `知识点：${body.title}
定义：${body.definition ?? ""}
类型：${body.kind ?? "focus"}`,
        },
      ],
      jsonMode: true,
      temperature: 0.6,
    });
    return NextResponse.json({ data: { kpId: body.kpId ?? null, ...(res.json ?? {}) } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "生成失败" } },
      { status: 500 }
    );
  }
}

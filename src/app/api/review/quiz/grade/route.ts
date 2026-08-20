import { NextResponse } from "next/server";
import { llm } from "@/lib/llm/client";
import { isAiConfigured } from "@/lib/llm/providers";

interface GradeInput {
  quizId: string;
  question: string;
  answerPoints: string[];
  userAnswer: string;
}

/**
 * POST /api/review/quiz/grade — 批改判分（对错 + 解析 + 未作答剔除）
 * 请求：{ results: GradeInput[] }
 * 未配置 AI → 503（前端关键词判分降级）
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const inputs: GradeInput[] = Array.isArray(body?.results) ? body.results : [];
    if (!inputs.length) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "results 不能为空" } }, { status: 400 });
    }

    if (!isAiConfigured()) {
      return NextResponse.json(
        { error: { code: "UNCONFIGURED", message: "AI 未配置，前端使用关键词判分" } },
        { status: 503 }
      );
    }

    const answered = inputs.filter((i) => i.userAnswer.trim());

    const res = await llm.chat({
      model: "deepseek-v4-flash",
      system:
        "你是批改老师。根据题目、参考答案要点与学生作答，逐题判定对错并给出解析。输出 JSON：{items:[{quizId,isCorrect,explanation}]}。未作答项跳过。",
      messages: [
        {
          role: "user",
          content: JSON.stringify(answered.map((i) => ({ quizId: i.quizId, question: i.question, answerPoints: i.answerPoints, userAnswer: i.userAnswer }))),
        },
      ],
      jsonMode: true,
      temperature: 0.2,
    });

    const graded = (res.json as { items?: { quizId: string; isCorrect: boolean; explanation: string }[] })?.items ?? [];
    const byId = new Map(graded.map((g) => [g.quizId, g]));

    const results = inputs.map((i) => {
      if (!i.userAnswer.trim()) {
        return {
          quizId: i.quizId,
          status: "skipped" as const,
          isCorrect: false,
          correctAnswer: i.answerPoints.join("；"),
          explanation: "未作答，本次不计入正确率。",
        };
      }
      const g = byId.get(i.quizId);
      return {
        quizId: i.quizId,
        status: "answered" as const,
        isCorrect: g?.isCorrect ?? false,
        correctAnswer: i.answerPoints.join("；"),
        explanation: g?.explanation ?? "AI 未能完成判分，请人工核对。",
      };
    });

    return NextResponse.json({ data: { results } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "批改失败" } },
      { status: 500 }
    );
  }
}

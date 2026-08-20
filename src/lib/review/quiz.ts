import type { PlanItem } from "./generator";

export interface QuizQuestion {
  quizId: string;
  kpId: string;
  question: string;
  /** 参考答案要点 */
  answerPoints: string[];
  kind: string;
  title: string;
}

const QUESTION_TEMPLATES = [
  (title: string) => `请用自己的话解释「${title}」的核心含义，并给出一个典型例子。`,
  (title: string) => `「${title}」通常考查什么？写出你记忆中的关键要点（至少 2 点）。`,
  (title: string) => `围绕「${title}」，出一道你认为最可能考到的变体题，并给出你的答案。`,
];

const ANSWER_POINT_TEMPLATES = [
  (title: string, def: string) => [`${title} 的定义与内涵`, def],
  (title: string) => [`${title} 的适用前提或常见误区`],
  (title: string) => [`围绕 ${title} 的典型例题或应用场景`],
];

/**
 * 变体题生成（M3-2）
 * - 演示模式：基于知识点标题/定义的模板变体（明确标注）
 * - 真实模式：走降本模型（deepseek）生成同知识点不同数据的题目
 */
export function generateQuizFromKp(item: PlanItem, index: number): QuizQuestion {
  const tpl = QUESTION_TEMPLATES[index % QUESTION_TEMPLATES.length];
  return {
    quizId: "quiz_" + (index + 1),
    kpId: item.kpId,
    question: tpl(item.title),
    answerPoints: ANSWER_POINT_TEMPLATES[index % ANSWER_POINT_TEMPLATES.length](item.title, item.definition),
    kind: item.kind,
    title: item.title,
  };
}

export interface GradeResult {
  quizId: string;
  status: "answered" | "skipped";
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

/**
 * 批改判分（M3-3）
 * - 未作答（空答案）→ status=skipped，不计入正确率分母
 * - 演示模式：关键词匹配判分；真实模式：AI 语义判分
 */
export function gradeAnswer(
  quiz: QuizQuestion,
  userAnswer: string
): GradeResult {
  const skipped = !userAnswer.trim();
  if (skipped) {
    return {
      quizId: quiz.quizId,
      status: "skipped",
      isCorrect: false,
      correctAnswer: quiz.answerPoints.join("；"),
      explanation: "未作答，本次不计入正确率。",
    };
  }

  // 关键词命中率 ≥ 40% 视为正确（演示判分，真实模式走 AI）
  const points = quiz.answerPoints.map((p) => p.replace(quiz.title, "").trim()).filter(Boolean);
  const hits = points.filter((p) => {
    const chars = p.replace(/[，。、；：（）]/g, "").slice(0, 6);
    return chars.length > 1 && userAnswer.includes(chars.slice(0, 2));
  }).length;
  const isCorrect = points.length > 0 && hits / points.length >= 0.4;

  return {
    quizId: quiz.quizId,
    status: "answered",
    isCorrect,
    correctAnswer: quiz.answerPoints.join("；"),
    explanation: isCorrect
      ? `回答正确 ✓ 覆盖了「${quiz.title}」的核心要点。`
      : `回答不完整。参考答案要点：${quiz.answerPoints.join("；")}。建议回到笔记复习「${quiz.title}」。`,
  };
}

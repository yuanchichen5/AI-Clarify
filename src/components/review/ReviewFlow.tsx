"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Textarea } from "@/components/ui/Textarea";
import { generatePlan, type PlanItem } from "@/lib/review/generator";
import { generateQuizFromKp, gradeAnswer, type GradeResult, type QuizQuestion } from "@/lib/review/quiz";
import { loadDemoNotes } from "@/lib/store/demo-notes";
import { recordAttempts } from "@/lib/store/demo-attempts";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { ReviewPlanType } from "@/types";

const MODES: { key: ReviewPlanType; title: string; desc: string; icon: string }[] = [
  { key: "daily", title: "每日复习", desc: "每天 10~15 分钟，滚动回顾薄弱知识点", icon: "clipboard" },
  { key: "weekly", title: "周度复盘", desc: "本周知识点系统梳理，变体题巩固", icon: "chart" },
  { key: "exam", title: "考前突击", desc: "按考试日期倒推计划，高频考点优先", icon: "user" },
];

type Stage = "mode" | "quiz" | "result";

/**
 * 复习中心三阶段流程（设计文档 §四-4）
 * 阶段一：模式选择 → 阶段二：逐题作答（进度条 + 未作答标记）→ 阶段三：批改结果
 */
export function ReviewFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("mode");
  const [mode, setMode] = useState<ReviewPlanType>("daily");
  const [subject, setSubject] = useState("全部学科");
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<GradeResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const subjects = useMemo(() => {
    const set = new Set(loadDemoNotes().map((n) => n.subject));
    return ["全部学科", ...Array.from(set)];
  }, []);

  function startReview() {
    setError(null);
    const notes = loadDemoNotes();
    if (notes.length === 0) {
      setError("知识库还没有笔记，请先录入并归档几篇笔记再来复习");
      return;
    }
    const items = generatePlan(notes, mode, subject);
    if (items.length === 0) {
      setError("当前学科下没有知识点，请切换学科");
      return;
    }
    const qs = items.map((item, i) => generateQuizFromKp(item, i));
    setPlanItems(items);
    setQuizzes(qs);
    setAnswers({});
    setCurrent(0);
    setResults([]);
    setStage("quiz");
  }

  function submitQuiz() {
    const graded = quizzes.map((q) => gradeAnswer(q, answers[q.quizId] ?? ""));
    // 记录作答（看板数据源）
    recordAttempts(
      quizzes.map((q, i) => ({
        title: q.title,
        subject: planItemSubject(q.kpId),
        noteId: planItemNoteId(q.kpId),
        isCorrect: graded[i].isCorrect,
        answered: graded[i].status === "answered",
      }))
    );
    track("review_submit", { total: quizzes.length, mode });
    setResults(graded);
    setStage("result");
  }

  function planItemSubject(kpId: string): string {
    const item = planItems.find((p) => p.kpId === kpId);
    return item?.subject ?? "未分类";
  }
  function planItemNoteId(kpId: string): string {
    const item = planItems.find((p) => p.kpId === kpId);
    return item?.noteId ?? "";
  }

  // ---- 批改结果统计 ----
  const stats = useMemo(() => {
    if (!results.length) return null;
    const answeredResults = results.filter((r) => r.status === "answered");
    const skipped = results.length - answeredResults.length;
    const correct = answeredResults.filter((r) => r.isCorrect).length;
    const accuracy = answeredResults.length ? Math.round((correct / answeredResults.length) * 100) : 0;
    const weak = results.filter((r) => r.status === "answered" && !r.isCorrect).length;
    const mastery = accuracy >= 90 ? "优秀" : accuracy >= 70 ? "良好" : accuracy >= 50 ? "及格" : "待加强";
    return { accuracy, mastery, weak, skipped, answered: answeredResults.length, correct, total: results.length };
  }, [results]);

  // ================= 阶段一：模式选择 =================
  if (stage === "mode") {
    return (
      <div>
        <div className="mb-6 grid grid-cols-3 gap-4 max-md:grid-cols-1">
          {MODES.map((m) => (
            <Card
              key={m.key}
              padded={false}
              className={cn(
                "cursor-pointer p-5 transition-colors hover:border-primary",
                mode === m.key && "border-primary bg-primary-soft"
              )}
              onClick={() => setMode(m.key)}
            >
              <Icon name={m.icon} className="mb-3 h-7 w-7 text-primary" />
              <div className="text-base font-medium">{m.title}</div>
              <div className="mt-1.5 text-xs text-ink-3">{m.desc}</div>
            </Card>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-btn border border-error bg-error-soft px-3.5 py-2.5 text-[13px] text-error">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-[42px] rounded-btn border border-border bg-card px-3 text-sm text-ink-1 outline-none focus:border-primary"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button size="lg" onClick={startReview}>
            <Icon name="spark" className="h-3.5 w-3.5" />
            开始复习
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-ink-3">
          演示模式基于本地笔记生成计划 · 配置 AI 密钥后可生成真实变体题
        </p>
      </div>
    );
  }

  // ================= 阶段二：逐题作答 =================
  if (stage === "quiz") {
    const quiz = quizzes[current];
    const total = quizzes.length;
    const answeredCount = Object.values(answers).filter((a) => a.trim()).length;
    return (
      <div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-ink-2">
            第 <b>{current + 1}</b> / {total} 题
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((current + 1) / total) * 100}%` }}
            />
          </div>
          <button
            onClick={() => setStage("mode")}
            className="rounded-btn px-2 py-1 text-xs text-ink-3 hover:text-ink-1"
          >
            退出
          </button>
        </div>

        <Card className="mt-4">
          <div className="mb-2 text-xs text-primary">
            变体题 · 考查知识点：{quiz.title}
            {quiz.kind === "difficulty" && <span className="ml-2 text-warning-ink">【难点】</span>}
          </div>
          <h2 className="mb-4 text-base font-medium">{quiz.question}</h2>
          <Textarea
            rows={4}
            value={answers[quiz.quizId] ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [quiz.quizId]: e.target.value }))}
            placeholder="输入你的答案（留空交卷将标记为未作答，不计入正确率）"
          />
        </Card>

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            上一题
          </Button>
          <Button variant="soft" onClick={submitQuiz} disabled={!answeredCount && total > 0 && false}>
            提交交卷（已答 {answeredCount}/{total}）
          </Button>
          <Button
            variant="ghost"
            onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            disabled={current === total - 1}
          >
            下一题
          </Button>
        </div>
      </div>
    );
  }

  // ================= 阶段三：批改结果 =================
  const s = stats;
  return (
    <div>
      <div className="mb-6 grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <Card padded={false} className="p-4 text-center">
          <div className="text-[28px] font-semibold text-primary">{s?.accuracy ?? 0}%</div>
          <div className="mt-1 text-xs text-ink-3">
            正确率（{s?.answered ?? 0} 题作答，{s?.skipped ?? 0} 题未答剔除）
          </div>
        </Card>
        <Card padded={false} className="p-4 text-center">
          <div className={cn("text-[28px] font-semibold", (s?.accuracy ?? 0) >= 70 ? "text-success" : "text-warning")}>
            {s?.mastery ?? "—"}
          </div>
          <div className="mt-1 text-xs text-ink-3">掌握度评级</div>
        </Card>
        <Card padded={false} className="p-4 text-center">
          <div className="text-[28px] font-semibold text-error">{s?.weak ?? 0}</div>
          <div className="mt-1 text-xs text-ink-3">薄弱知识点（答错）</div>
        </Card>
      </div>

      {results.map((r, i) => (
        <div
          key={r.quizId}
          className={cn(
            "mb-3 overflow-hidden rounded-card border bg-card",
            r.status === "skipped" ? "border-border" : r.isCorrect ? "border-success" : "border-error"
          )}
        >
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-medium">
            {r.status === "skipped" ? (
              <span className="text-ink-3">
                <Icon name="help" className="mr-1 h-4 w-4" />
                第 {i + 1} 题 · 未作答
              </span>
            ) : r.isCorrect ? (
              <span className="text-success">
                <Icon name="check" className="mr-1 h-4 w-4" />
                第 {i + 1} 题 · 答对
              </span>
            ) : (
              <span className="text-error">
                <Icon name="x" className="mr-1 h-4 w-4" />
                第 {i + 1} 题 · 答错
              </span>
            )}
          </div>
          <div className="px-4 py-3">
            <div className="text-sm text-ink-1">{quizzes[i].question}</div>
            <div className="mt-2 text-[13px] text-ink-2">
              <span className="mr-1.5 text-ink-3">你的答案：</span>
              {answers[r.quizId]?.trim() || "（未作答）"}
            </div>
            <div
              className={cn(
                "mt-2.5 rounded-r-btn border-l-[3px] px-3.5 py-2.5 text-[13px]",
                r.isCorrect || r.status === "skipped"
                  ? "border-l-success bg-success-soft text-ink-2"
                  : "border-l-error bg-error-soft text-ink-2"
              )}
            >
              <b className="text-ink-1">解析：</b>
              {r.explanation}
              {!r.isCorrect && r.status === "answered" && (
                <div className="mt-1.5">
                  <b className="text-ink-1">参考答案：</b>
                  {r.correctAnswer}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={startReview}>
          <Icon name="refresh" className="h-3.5 w-3.5" />
          重新练习
        </Button>
        <Button variant="ghost" onClick={() => setStage("mode")}>
          返回复习中心
        </Button>
        <Button variant="soft" onClick={() => router.push("/dashboard")}>
          查看薄弱知识点
        </Button>
      </div>
    </div>
  );
}

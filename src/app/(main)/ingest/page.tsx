"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Textarea } from "@/components/ui/Textarea";
import { IngestUploader, type QueueItem } from "@/components/ingest/IngestUploader";
import { cn } from "@/lib/utils";
import type { IngestMode } from "@/types";
import { track } from "@/lib/analytics";

const MODES: { key: IngestMode; label: string; icon: string }[] = [
  { key: "camera", label: "拍照", icon: "camera" },
  { key: "screenshot", label: "截图", icon: "image" },
  { key: "text", label: "文本", icon: "text" },
  { key: "chatlog", label: "对话", icon: "chat" },
  { key: "ppt", label: "PPT", icon: "slides" },
  { key: "pdf", label: "PDF", icon: "file" },
  { key: "video", label: "视频", icon: "video" },
];

interface ParseResultShape {
  subject: string;
  confidence: number;
  knowledgePoints: { title: string; definition: string; kind: string; important?: boolean }[];
  difficulties: { title: string; summary: string; suggestion?: string }[];
  supplements: string[];
}

const SUBJECTS = ["数学", "物理", "化学", "语文", "英语", "生物", "历史", "地理", "政治", "计算机", "其他"];

export default function IngestPage() {
  const router = useRouter();
  const [mode, setMode] = useState<IngestMode>("camera");
  const [text, setText] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [formats, setFormats] = useState<string[]>(["note"]);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSubject, setConfirmSubject] = useState<string | null>(null);
  const [subjectCandidates, setSubjectCandidates] = useState<{ subject: string; confidence: number } | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);

  // 上次使用方式记忆
  useEffect(() => {
    const saved = localStorage.getItem("clarify:last-ingest-mode") as IngestMode | null;
    if (saved && MODES.some((m) => m.key === saved)) setMode(saved);
  }, []);

  function selectMode(key: IngestMode) {
    setMode(key);
    localStorage.setItem("clarify:last-ingest-mode", key);
    setError(null);
  }

  function toggleFormat(fmt: string) {
    setFormats((prev) => {
      if (prev.includes(fmt)) {
        return prev.length > 1 ? prev.filter((f) => f !== fmt) : prev;
      }
      return [...prev, fmt];
    });
  }

  // 提交解析
  async function submitParse(payload: Record<string, unknown>) {
    track("ingest_start", { mode: payload.mode });
    setParsing(true);
    setError(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "解析服务异常");
      const jobId: string = json.data.jobId;

      // 轮询（每 2s，最多 90s）
      for (let i = 0; i < 45; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const jobRes = await fetch(`/api/jobs/${jobId}`);
        const jobJson = await jobRes.json();
        const job = jobJson.data;
        if (job.status === "done") {
          track("parse_done", { mode: payload.mode });
          handleParseResult(job.result);
          return;
        }
        if (job.status === "failed") {
          throw new Error(job.error ?? "解析失败");
        }
      }
      throw new Error("解析超时，请稍后重试");
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析失败");
    } finally {
      setParsing(false);
    }
  }

  function handleParseResult(outcome: {
    result: ParseResultShape;
    mocked: boolean;
    needsSubjectConfirm: boolean;
  }) {
    const { result } = outcome;
    if (outcome.needsSubjectConfirm || result.confidence < 0.6) {
      setSubjectCandidates({ subject: result.subject, confidence: result.confidence });
      setPendingPayload((prev) => prev ?? buildPayload());
      setConfirmSubject(result.subject);
      return;
    }
    gotoNote(result);
  }

  function buildPayload(): Record<string, unknown> {
    const isTextMode = mode === "text" || mode === "chatlog";
    if (isTextMode) {
      return { mode, text: text.slice(0, 100000) };
    }
    return { mode, files: queue.filter((q) => q.status !== "failed").map((q) => ({ name: q.name, mime: q.mime, base64: q.base64 ?? "" })) };
  }

  function gotoNote(result: ParseResultShape) {
    const id = "note_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const title =
      (result.knowledgePoints[0]?.title ?? "课堂笔记") +
      (result.knowledgePoints.length > 1 ? ` 等 ${result.knowledgePoints.length} 个知识点` : "");
    const draft = {
      id,
      title: title.slice(0, 50),
      subject: result.subject,
      content: {
        knowledgePoints: result.knowledgePoints.map((k) => ({
          t: k.title,
          d: k.definition,
          kinds: [k.kind === "redun" ? "redun" : k.kind === "difficulty" ? "difficulty" : "focus"],
        })),
        difficulties: result.difficulties.map((d) => ({ t: d.title, d: d.summary, suggestion: d.suggestion })),
        supplements: result.supplements,
        important: result.knowledgePoints.some((k) => k.important),
      },
      savedAt: Date.now(),
    };
    localStorage.setItem(`clarify:draft:${id}`, JSON.stringify(draft));
    router.push(`/notes/${id}`);
  }

  // 学科兜底确认
  function confirmAndReparse() {
    if (!confirmSubject || !pendingPayload) return;
    setConfirmSubject(null);
    setSubjectCandidates(null);
    submitParse({ ...pendingPayload, subject: confirmSubject });
  }

  async function startParse() {
    setError(null);
    const isTextMode = mode === "text" || mode === "chatlog";
    if (isTextMode && !text.trim()) {
      setError("请输入文本内容后再解析");
      return;
    }
    if (!isTextMode && queue.filter((q) => q.status !== "failed").length === 0) {
      setError("请先添加文件（点击上传区或拖拽 / Ctrl+V 粘贴）");
      return;
    }
    submitParse(buildPayload());
  }

  const isTextMode = mode === "text" || mode === "chatlog";
  const readyFiles = queue.filter((q) => q.status !== "failed").length;
  const canParse = isTextMode ? text.trim().length > 0 : readyFiles > 0;

  return (
    <div className="mx-auto max-w-[880px]">
      <div className="pb-4 pt-6">
        <h1 className="text-[28px] font-semibold tracking-tight">新建录入</h1>
      </div>

      {/* 7 种录入方式 Tab */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => selectMode(m.key)}
            className={cn(
              "relative flex items-center whitespace-nowrap px-4 py-2.5 text-sm text-ink-2 transition-colors hover:text-ink-1",
              mode === m.key && "font-medium text-primary"
            )}
          >
            <Icon name={m.icon} className="mr-1.5 h-4 w-4" />
            {m.label}
            {mode === m.key && (
              <span className="absolute bottom-[-1px] left-3 right-3 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {isTextMode ? (
        <Card>
          <Textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === "chatlog"
                ? "粘贴对话记录，AI 将自动识别发言方与顺序并提炼知识点..."
                : "粘贴或输入课堂内容，AI 将自动提炼重点、难点与考试重点..."
            }
            className="min-h-[180px]"
          />
          <p className="mt-1.5 text-xs text-ink-3">
            {text.length.toLocaleString()} / 100,000 字符 · 支持 Ctrl+V 快捷粘贴
          </p>
        </Card>
      ) : (
        <IngestUploader mode={mode} onQueueChange={setQueue} />
      )}

      {/* 解析输出格式 */}
      <div className="mt-5 rounded-card border border-border bg-card p-4">
        <div className="mb-2.5 flex items-center gap-1.5 text-[13px] font-medium text-ink-1">
          <Icon name="spark" className="h-4 w-4 text-primary" />
          AI 解析输出格式（可多选）
        </div>
        <div className="flex flex-wrap gap-2.5">
          {[
            { key: "note", label: "笔记", icon: "book" },
            { key: "mindmap", label: "思维导图", icon: "clipboard" },
            { key: "transcript", label: "音视频转文字", icon: "text" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => toggleFormat(f.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-btn border border-border bg-card px-4 py-2.5 text-sm text-ink-2 transition-colors hover:border-primary",
                formats.includes(f.key) && "border-primary bg-primary-soft font-medium text-primary"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-[4px] border-[1.5px] border-border-hover bg-card",
                  formats.includes(f.key) && "border-primary bg-primary"
                )}
              >
                {formats.includes(f.key) && <Icon name="check" className="h-3 w-3 text-white" />}
              </span>
              <Icon name={f.icon} className="h-4 w-4" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 队列标题 */}
      <div className="mb-2 mt-5 text-[13px] text-ink-3">上传队列</div>
      {!isTextMode && <IngestUploader mode={mode} onQueueChange={setQueue} />}

      {error && (
        <div className="mt-4 rounded-btn border border-error bg-error-soft px-3.5 py-2.5 text-[13px] text-error">
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Button size="lg" onClick={startParse} disabled={parsing || !canParse}>
          <Icon name="spark" className="h-3.5 w-3.5" />
          {parsing ? "AI 解析中..." : "开始解析"}
        </Button>
        <span className="text-xs text-ink-3">
          {isTextMode
            ? "AI 将自动推断学科，识别失败时可手动选择"
            : `已就绪 ${readyFiles} 个文件 · AI 将自动推断学科`}
        </span>
      </div>

      {/* 学科兜底弹窗 */}
      {confirmSubject && subjectCandidates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-1/40 p-4">
          <div className="w-full max-w-[420px] rounded-modal border border-border bg-card p-6">
            <h2 className="text-[15px] font-semibold">确认学科</h2>
            <p className="mt-2 text-[13px] text-ink-2">
              AI 推断学科为「{subjectCandidates.subject}」（置信度
              {(subjectCandidates.confidence * 100).toFixed(0)}%）。置信度较低，请手动确认：
            </p>
            <select
              value={confirmSubject}
              onChange={(e) => setConfirmSubject(e.target.value)}
              className="mt-3 h-10 w-full rounded-btn border border-border bg-card px-3 text-sm text-ink-1 outline-none focus:border-primary"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setConfirmSubject(null); setSubjectCandidates(null); }}>
                取消
              </Button>
              <Button onClick={confirmAndReparse} disabled={parsing}>
                {parsing ? "重新解析中..." : "确认并继续"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

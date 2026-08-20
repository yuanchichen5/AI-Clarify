"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { KpEditorBlock, type EditableKp } from "./KpEditorBlock";
import { DiffEditorBlock, type EditableDiff } from "./DiffEditorBlock";
import { clearDraft, loadDraft, saveDraft } from "@/lib/store/draft";
import { getDemoNote, saveDemoNote, type DemoNote } from "@/lib/store/demo-notes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ExportNoteButton } from "@/components/export/ExportNoteButton";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export interface NoteEditorProps {
  noteId: string;
}

const FOLDERS = ["我的笔记", "数学", "物理", "英语"];

/**
 * 笔记编辑整理页（M1-5 / M1-6）
 * - 结构化笔记渲染：重点紫色左边框 / 难点琥珀色 / 段子灰色，支持折叠
 * - 全量可编辑（标题、学科、知识点、难点、补充材料，增删改）
 * - 自动保存草稿（防抖 800ms，7 天留存）
 * - 归档：Supabase 入库（embedding 失败降级）/ 演示模式 localStorage
 */
export function NoteEditor({ noteId }: NoteEditorProps) {
  const router = useRouter();

  const [title, setTitle] = useState("未命名笔记");
  const [subject, setSubject] = useState("未分类");
  const [kps, setKps] = useState<EditableKp[]>([]);
  const [diffs, setDiffs] = useState<EditableDiff[]>([]);
  const [supps, setSupps] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");
  const [loaded, setLoaded] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载草稿（来自解析结果或历史草稿）
  useEffect(() => {
    const draft = loadDraft(noteId);
    if (draft) {
      const content = draft.content as {
        knowledgePoints?: EditableKp[];
        difficulties?: EditableDiff[];
        supplements?: string[];
        important?: boolean;
      };
      setTitle(draft.title || "未命名笔记");
      setSubject(draft.subject || "未分类");
      setKps(content?.knowledgePoints ?? []);
      setDiffs(content?.difficulties ?? []);
      setSupps(content?.supplements ?? []);
    } else {
      // 已归档的演示模式笔记
      const archived = getDemoNote(noteId);
      if (archived) {
        setTitle(archived.title);
        setSubject(archived.subject);
        setKps(archived.kps);
        setDiffs(archived.diffs);
        setSupps(archived.supps);
      }
    }
    setLoaded(true);
  }, [noteId]);

  // 自动保存（防抖）
  const dirtyRef = useRef(false);
  useEffect(() => {
    if (!loaded || !dirtyRef.current) return;
    setSaveState("saving");
    const timer = setTimeout(() => {
      saveDraft({
        id: noteId,
        title,
        subject,
        content: { knowledgePoints: kps, difficulties: diffs, supplements: supps },
        savedAt: Date.now(),
      });
      setSaveState("saved");
      dirtyRef.current = false;
    }, 800);
    return () => clearTimeout(timer);
  }, [title, subject, kps, diffs, supps, loaded, noteId]);

  const markDirty = () => {
    dirtyRef.current = true;
    setSaveState("dirty");
  };

  // ---- 知识点操作 ----
  const updateKp = (i: number, patch: Partial<EditableKp>) => {
    setKps((prev) => prev.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
    markDirty();
  };
  const addKp = () => {
    setKps((prev) => [...prev, { t: "新知识点", d: "", kinds: ["focus"] }]);
    markDirty();
  };
  const removeKp = (i: number) => {
    setKps((prev) => prev.filter((_, idx) => idx !== i));
    markDirty();
  };

  // ---- 难点操作 ----
  const updateDiff = (i: number, patch: Partial<EditableDiff>) => {
    setDiffs((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
    markDirty();
  };
  const addDiff = () => {
    setDiffs((prev) => [...prev, { t: "新难点", d: "", suggestion: "" }]);
    markDirty();
  };
  const removeDiff = (i: number) => {
    setDiffs((prev) => prev.filter((_, idx) => idx !== i));
    markDirty();
  };

  // ---- 补充材料 ----
  const updateSupp = (i: number, v: string) => {
    setSupps((prev) => prev.map((s, idx) => (idx === i ? v : s)));
    markDirty();
  };
  const addSupp = () => {
    setSupps((prev) => [...prev, ""]);
    markDirty();
  };
  const removeSupp = (i: number) => {
    setSupps((prev) => prev.filter((_, idx) => idx !== i));
    markDirty();
  };

  // ---- 归档 ----
  async function doArchive(folder: string) {
    setArchiving(true);
    setError(null);
    const payload = {
      title,
      subject,
      folderId: null,
      content: {
        knowledgePoints: kps.map((k) => ({
          title: k.t,
          definition: k.d,
          kind: k.kinds[0] ?? "focus",
          kinds: k.kinds,
        })),
        difficulties: diffs.map((d) => ({ title: d.t, summary: d.d, suggestion: d.suggestion })),
        supplements: supps,
        important: kps.some((k) => k.kinds.includes("focus")),
      },
    };

    try {
      if (isSupabaseConfigured) {
        const res = await fetch("/api/notes/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message ?? "归档失败");
      } else {
        // 演示模式：本地存储
        const note: DemoNote = {
          id: noteId,
          title,
          subject,
          folder: folder === "我的笔记" ? "all" : folder,
          tags: [subject, "重点"].filter(Boolean),
          kps,
          diffs,
          supps,
          time: new Date().toLocaleString("zh-CN", { hour12: false }).slice(0, 16),
          archivedAt: Date.now(),
        };
        saveDemoNote(note);
      }
      track("note_archived", { title, subject, kpCount: kps.length });
      clearDraft(noteId);
      router.push("/library");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "归档失败");
      setArchiving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink-3">
        加载中...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[920px] pb-16 pt-6">
      {/* 标题 */}
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          markDirty();
        }}
        placeholder="笔记标题"
        className="w-full border-none bg-transparent pb-3 text-[30px] font-semibold tracking-tight text-ink-1 outline-none focus:bg-bg focus:rounded-btn focus:px-2"
      />

      {/* 元信息 */}
      <div className="mb-6 flex flex-wrap items-center gap-2.5 border-b border-border pb-4 text-xs text-ink-3">
        <span className="inline-flex h-[22px] items-center rounded-tag bg-primary-soft px-2 text-xs text-primary">
          {subject}
        </span>
        <span>·</span>
        <span>结构化笔记 · AI 生成后可全量编辑</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              saveState === "saved" ? "bg-success" : saveState === "saving" ? "bg-warning" : "bg-warning"
            )}
          />
          {saveState === "saved" ? "已自动保存" : saveState === "saving" ? "保存中..." : "内容已修改（未保存）"}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-btn border border-error bg-error-soft px-3.5 py-2.5 text-[13px] text-error">
          {error}
        </div>
      )}

      {/* 重点知识点 */}
      <Card className="mb-4">
        <h3 className="mb-3.5 flex items-center gap-2 text-base font-semibold">
          <Icon name="spark" className="h-4 w-4 text-primary" />
          重点知识点
        </h3>
        {kps.length === 0 && (
          <p className="mb-3 text-[13px] text-ink-3">暂无知识点，点击下方按钮添加。</p>
        )}
        {kps.map((kp, i) => (
          <KpEditorBlock
            key={i}
            kp={kp}
            onChange={(patch) => updateKp(i, patch)}
            onRemove={() => removeKp(i)}
          />
        ))}
        <button
          onClick={addKp}
          className="mt-2 w-full rounded-btn border border-dashed border-border-hover py-2 text-[13px] text-primary transition-colors hover:border-primary hover:bg-primary-soft"
        >
          + 添加知识点
        </button>
      </Card>

      {/* 难点标注 */}
      <Card className="mb-4">
        <h3 className="mb-3.5 flex items-center gap-2 text-base font-semibold text-warning-ink">
          <Icon name="help" className="h-4 w-4" />
          难点标注
        </h3>
        {diffs.map((diff, i) => (
          <DiffEditorBlock
            key={i}
            diff={diff}
            onChange={(patch) => updateDiff(i, patch)}
            onRemove={() => removeDiff(i)}
          />
        ))}
        <button
          onClick={addDiff}
          className="mt-2 w-full rounded-btn border border-dashed border-border-hover py-2 text-[13px] text-primary transition-colors hover:border-primary hover:bg-primary-soft"
        >
          + 添加难点
        </button>
      </Card>

      {/* 补充材料 */}
      <Card>
        <h3 className="mb-3.5 flex items-center gap-2 text-base font-semibold">
          <Icon name="text" className="h-4 w-4 text-primary" />
          补充材料
        </h3>
        <ul className="space-y-1.5">
          {supps.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ink-2">
              <span className="text-ink-3">•</span>
              <input
                value={s}
                onChange={(e) => updateSupp(i, e.target.value)}
                placeholder="补充材料内容"
                className="flex-1 border-none bg-transparent text-sm text-ink-2 outline-none"
              />
              <button
                onClick={() => removeSupp(i)}
                className="text-ink-3 transition-colors hover:text-error"
                aria-label="删除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={addSupp}
          className="mt-2 w-full rounded-btn border border-dashed border-border-hover py-2 text-[13px] text-primary transition-colors hover:border-primary hover:bg-primary-soft"
        >
          + 添加补充条目
        </button>
      </Card>

      {/* 底部归档栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[920px] items-center gap-3 px-6 py-3">
          <span className="text-xs text-ink-3">
            {kps.length} 个知识点 · {diffs.length} 个难点 · 自动保存已开启
          </span>
          <span className="flex-1" />
          <ExportNoteButton
            note={{ title, subject, kps, diffs, supps }}
            className="mr-1"
          />
          <Button variant="ghost" onClick={() => router.push("/library")}>
            放弃并返回
          </Button>
          <Button
            onClick={() => setArchiveOpen(true)}
            disabled={archiving || kps.length === 0}
            title={kps.length === 0 ? "至少包含 1 个知识点才能归档" : undefined}
          >
            <Icon name="archive" className="h-3.5 w-3.5" />
            {archiving ? "归档中..." : "归档"}
          </Button>
        </div>
      </div>

      {/* 归档目录弹窗 */}
      {archiveOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-1/40 p-4"
          onClick={() => setArchiveOpen(false)}
        >
          <div
            className="w-full max-w-[380px] rounded-modal border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">归档到目录</h2>
              <button
                onClick={() => setArchiveOpen(false)}
                className="text-ink-3 hover:text-ink-1"
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {FOLDERS.map((f) => (
                <button
                  key={f}
                  onClick={() => doArchive(f)}
                  disabled={archiving}
                  className="flex w-full items-center gap-2.5 rounded-btn border border-border bg-card px-3.5 py-2.5 text-left text-sm text-ink-2 transition-colors hover:border-primary hover:bg-bg"
                >
                  <Icon name="folder" className="h-4 w-4 text-primary" />
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

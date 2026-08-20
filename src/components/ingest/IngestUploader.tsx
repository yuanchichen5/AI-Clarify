"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { IngestMode } from "@/types";

/** 队列条目状态（PRD §5.1 状态变化） */
type ItemStatus = "ready" | "uploading" | "parsing" | "success" | "failed";

export interface QueueItem {
  id: string;
  name: string;
  size: number;
  mime: string;
  status: ItemStatus;
  error?: string;
  base64?: string;
}

const SIZE_LIMITS: Record<string, { max: number; label: string }> = {
  image: { max: 10 * 1024 * 1024, label: "图片 ≤ 10MB" },
  pdf: { max: 50 * 1024 * 1024, label: "PDF ≤ 50MB" },
  pptx: { max: 50 * 1024 * 1024, label: "PPT ≤ 50MB" },
  video: { max: 500 * 1024 * 1024, label: "视频 ≤ 500MB" },
  audio: { max: 500 * 1024 * 1024, label: "音频 ≤ 500MB" },
};

function detectKind(mime: string, name: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf" || name.toLowerCase().endsWith(".pdf")) return "pdf";
  if (name.toLowerCase().endsWith(".pptx") || name.toLowerCase().endsWith(".ppt")) return "pptx";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("text/") || /\.(txt|md)$/i.test(name)) return "text";
  return "unknown";
}

function validateFile(f: File): string | null {
  const kind = detectKind(f.type, f.name);
  if (kind === "unknown") return "不支持的格式，仅支持图片 / PDF / PPT / 音视频 / 文本";
  if (kind === "image" && f.size > SIZE_LIMITS.image.max)
    return `图片大小超限（${SIZE_LIMITS.image.label}）`;
  if ((kind === "pdf" || kind === "pptx") && f.size > SIZE_LIMITS.pdf.max)
    return `文档大小超限（${SIZE_LIMITS.pdf.label}）`;
  if ((kind === "video" || kind === "audio") && f.size > SIZE_LIMITS.video.max)
    return `音视频大小超限（${SIZE_LIMITS.video.label}）`;
  return null;
}

export interface IngestUploaderProps {
  mode: IngestMode;
  onQueueChange: (items: QueueItem[]) => void;
}

/** M1-2 上传热区 + 队列（校验、失败重试、删除） */
export function IngestUploader({ mode, onQueueChange }: IngestUploaderProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(0);

  const emit = useCallback(
    (next: QueueItem[]) => {
      setItems(next);
      onQueueChange(next);
    },
    [onQueueChange]
  );

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const next: QueueItem[] = files.map((f) => {
        idRef.current += 1;
        const err = validateFile(f);
        return {
          id: "q" + idRef.current,
          name: f.name,
          size: f.size,
          mime: f.type,
          status: err ? "failed" : "ready",
          error: err ?? undefined,
        };
      });
      emit([...items, ...next]);
    },
    [emit, items]
  );

  // Ctrl+V 快捷粘贴（截图/文本自动识别）
  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        addFiles(files);
      }
    },
    [addFiles]
  );

  // 全局粘贴监听（录入页挂载期间）
  const pasteBoundRef = useRef(false);
  if (!pasteBoundRef.current && typeof window !== "undefined") {
    window.addEventListener("paste", onPaste);
    pasteBoundRef.current = true;
  }

  function remove(id: string) {
    emit(items.filter((i) => i.id !== id));
  }

  function retry(id: string) {
    emit(
      items.map((i) =>
        i.id === id ? { ...i, status: "ready", error: undefined } : i
      )
    );
  }

  const isTextMode = mode === "text" || mode === "chatlog";

  return (
    <div>
      {!isTextMode && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "cursor-pointer rounded-modal border-[1.5px] border-dashed border-border-hover bg-card py-12 text-center transition-colors",
            "hover:border-primary",
            dragging && "border-solid border-primary bg-primary-soft"
          )}
        >
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center text-primary">
            <Icon name="upload" className="h-10 w-10" />
          </div>
          <div className="text-[15px] font-medium text-ink-1">
            点击上传或拖拽文件到此处
          </div>
          <p className="mt-2 text-xs text-ink-3">
            支持 JPG / PNG / PPTX / PDF / MP4 · 图片 ≤10MB，文档 ≤50MB，音视频 ≤500MB
          </p>
          <p className="mt-1 text-xs text-ink-3">
            支持 <span className="rounded-tag border border-border bg-bg px-1.5 py-0.5">Ctrl+V</span>{" "}
            快捷粘贴截图 / 文本
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-2 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-btn border border-border bg-card px-3.5 py-2.5"
            >
              <Icon name="file" className="h-4 w-4 text-ink-2" />
              <span className="flex-1 truncate text-sm text-ink-1">{item.name}</span>
              <span className="text-xs text-ink-3">
                {(item.size / 1024 / 1024).toFixed(1)}MB
              </span>
              {item.status === "failed" && item.error && (
                <span className="text-xs text-error">{item.error}</span>
              )}
              {item.status === "success" && (
                <span className="text-xs text-success">就绪</span>
              )}
              {item.status === "failed" ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => retry(item.id)}>
                    重试
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => remove(item.id)}>
                    删除
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => remove(item.id)}>
                  移除
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="mt-2 rounded-card border border-border bg-card px-4 py-3 text-center text-[13px] text-ink-3">
          暂无文件 · 文件在解析前完成格式与大小校验，失败项单独标红可重试
        </div>
      )}
    </div>
  );
}

export { validateFile, detectKind, SIZE_LIMITS };

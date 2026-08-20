"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import type { IngestMode } from "@/types";

const MODES: { key: IngestMode; label: string; icon: string }[] = [
  { key: "camera", label: "拍照", icon: "camera" },
  { key: "screenshot", label: "截图", icon: "image" },
  { key: "text", label: "文本", icon: "text" },
  { key: "chatlog", label: "对话", icon: "chat" },
  { key: "ppt", label: "PPT", icon: "slides" },
  { key: "pdf", label: "PDF", icon: "file" },
  { key: "video", label: "视频", icon: "video" },
];

const MODE_HINT: Record<IngestMode, string> = {
  camera: "支持 JPG / PNG，单个文件不超过 10MB",
  screenshot: "支持 JPG / PNG，可 Ctrl+V 快捷粘贴剪贴板截图",
  text: "接受普通文本与 Markdown，1 ~ 100,000 字符",
  chatlog: "支持粘贴对话片段，自动识别发言方与顺序",
  ppt: "支持 PPTX / PPT，≤ 50MB 且页数 ≤ 200 页",
  pdf: "支持 PDF，≤ 50MB 且页数 ≤ 200 页",
  video: "支持 MP4 / MOV，≤ 500MB 且时长 ≤ 120 分钟",
};

/**
 * 多模态录入页（设计文档 §四-2）· 单栏居中 max-w-4xl
 * M0：交互骨架 + 7 种录入方式 Tab（默认上次使用方式）
 * M1：文件校验 / 上传队列 / 解析流程接入
 */
export default function IngestPage() {
  // M0 默认拍照；M1 起从 localStorage 读取最近一次使用方式
  const [mode, setMode] = useState<IngestMode>("camera");

  useEffect(() => {
    const saved = localStorage.getItem("clarify:last-ingest-mode") as IngestMode | null;
    if (saved && MODES.some((m) => m.key === saved)) setMode(saved);
  }, []);

  function selectMode(key: IngestMode) {
    setMode(key);
    localStorage.setItem("clarify:last-ingest-mode", key);
  }

  const isText = mode === "text" || mode === "chatlog";

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

      {/* 文件上传热区（文本模式替换为多行输入框） */}
      {isText ? (
        <Card>
          <Textarea
            rows={8}
            placeholder={
              mode === "chatlog"
                ? "粘贴对话记录，AI 将自动识别发言方与顺序并提炼知识点..."
                : "粘贴或输入课堂内容，AI 将自动提炼重点、难点与考试重点..."
            }
            className="min-h-[180px]"
          />
          <p className="mt-1.5 text-xs text-ink-3">
            支持 Ctrl+V 快捷粘贴截图 / 文本（M1 里程碑接入）
          </p>
        </Card>
      ) : (
        <Card
          padded={false}
          className="border-[1.5px] border-dashed border-border-hover py-12 text-center transition-colors hover:border-primary"
        >
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center text-primary">
            <Icon name="upload" className="h-10 w-10" />
          </div>
          <div className="text-[15px] font-medium text-ink-1">点击上传或拖拽文件到此处</div>
          <p className="mt-2 text-xs text-ink-3">{MODE_HINT[mode]}</p>
        </Card>
      )}

      {/* 上传队列（M1 接入） */}
      <div className="mb-2 mt-5 text-[13px] text-ink-3">上传队列</div>
      <Card padded={false} className="px-4 py-3 text-center text-[13px] text-ink-3">
        暂无文件（M1 里程碑接入文件校验与上传队列）
      </Card>

      {/* 底部操作 */}
      <div className="mt-5 flex items-center gap-3">
        <Button size="lg" disabled title="M1 里程碑接入解析流程">
          <Icon name="spark" className="h-3.5 w-3.5" />
          开始解析
        </Button>
        <span className="text-xs text-ink-3">AI 将自动推断学科，识别失败时可手动选择</span>
      </div>
    </div>
  );
}

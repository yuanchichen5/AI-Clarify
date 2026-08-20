"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const MODES = [
  {
    key: "daily",
    title: "每日复习",
    desc: "每天 10~15 分钟，滚动回顾薄弱知识点",
    icon: "clipboard",
  },
  { key: "weekly", title: "周度复盘", desc: "本周知识点系统梳理，变体题巩固", icon: "chart" },
  { key: "exam", title: "考前突击", desc: "按考试日期倒推计划，高频考点优先", icon: "user" },
] as const;

/**
 * 复习中心页（设计文档 §四-4）· 单栏流程式 max-w-3xl
 * M0：阶段一「选择复习模式」骨架
 * M3：阶段二逐题作答 / 阶段三批改结果接入
 */
export default function ReviewPage() {
  const [mode, setMode] = useState<string>("daily");

  return (
    <div className="mx-auto max-w-[720px] pt-6">
      <div className="pb-4">
        <h1 className="text-[28px] font-semibold tracking-tight">复习中心</h1>
      </div>

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

      <div className="flex items-center justify-center gap-3">
        <select className="h-[42px] rounded-btn border border-border bg-card px-3 text-sm text-ink-2 outline-none">
          <option>全部学科</option>
        </select>
        <Button size="lg" disabled title="M3 里程碑接入复习流程">
          开始复习
        </Button>
      </div>
      <p className="mt-4 text-center text-xs text-ink-3">
        阶段二（逐题作答）与阶段三（批改结果）将在 M3 里程碑开放
      </p>
    </div>
  );
}

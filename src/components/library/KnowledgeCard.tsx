"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { KpKind } from "@/types";

export interface KnowledgeCardProps {
  name: string;
  definition: string;
  /** 关联难点标题 */
  linkedDifficulties?: string[];
  /** 关联历史笔记数 */
  linkedNotes?: number;
  kind?: KpKind;
  collapsible?: boolean;
}

const KIND_TAG: Record<KpKind, string> = {
  focus: "bg-primary-soft text-primary",
  difficulty: "bg-warning-soft text-warning-ink",
  redun: "bg-tag-7-soft text-ink-3",
};

/**
 * 知识卡片（M2-5）：知识点名称 + 一句话定义 + 关联难点 + 关联历史笔记
 */
export function KnowledgeCard({
  name,
  definition,
  linkedDifficulties = [],
  linkedNotes = 0,
  kind = "focus",
  collapsible = true,
}: KnowledgeCardProps) {
  const [open, setOpen] = useState(!collapsible);

  return (
    <div className="rounded-card border border-border bg-card">
      <button
        onClick={() => collapsible && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 px-4 py-3 text-left",
          collapsible && "cursor-pointer hover:bg-bg"
        )}
      >
        <Icon name="spark" className="h-4 w-4 text-primary" />
        <span className="flex-1 truncate text-sm font-medium text-ink-1">{name}</span>
        <span className={cn("rounded-tag px-2 py-0.5 text-[11px]", KIND_TAG[kind])}>
          {kind === "focus" ? "重点" : kind === "difficulty" ? "难点" : "段子"}
        </span>
        {collapsible && (
          <Icon
            name="chevron"
            className={cn("h-3.5 w-3.5 text-ink-3 transition-transform", open && "rotate-180")}
          />
        )}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 text-[13px] text-ink-2">
          <p className="leading-relaxed">{definition || "（暂无定义）"}</p>
          {linkedDifficulties.length > 0 && (
            <p className="mt-2">
              <span className="mr-1.5 text-ink-3">关联难点：</span>
              {linkedDifficulties.map((d, i) => (
                <span key={i} className="mr-2 text-warning-ink">
                  {d}
                </span>
              ))}
            </p>
          )}
          {linkedNotes > 0 && (
            <p className="mt-1.5 text-xs text-ink-3">关联历史笔记 {linkedNotes} 篇</p>
          )}
        </div>
      )}
    </div>
  );
}

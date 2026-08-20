"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export interface VersionEntry {
  label: string;
  time: string;
  kpCount: number;
}

export interface VersionHistoryProps {
  open: boolean;
  onClose: () => void;
  versions: VersionEntry[];
  onRestore?: (index: number) => void;
}

/** 版本历史抽屉（M2-6）：展示自动保存快照，支持回滚 */
export function VersionHistory({ open, onClose, versions, onRestore }: VersionHistoryProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink-1/40"
      onClick={onClose}
    >
      <div
        className="flex h-full w-[340px] flex-col border-l border-border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">版本历史</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink-1" aria-label="关闭">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {versions.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink-3">暂无版本记录（保存后自动生成）</p>
          ) : (
            <div className="space-y-2.5">
              {versions.map((v, i) => (
                <div
                  key={i}
                  className="rounded-btn border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-2">
                    <Icon name="clipboard" className="h-3.5 w-3.5 text-primary" />
                    <span className="flex-1 truncate text-[13px] font-medium text-ink-1">
                      {v.label}
                    </span>
                    {i === 0 && (
                      <span className="rounded-tag bg-primary-soft px-1.5 text-[11px] text-primary">当前</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-ink-3">
                    {v.time} · {v.kpCount} 个知识点
                  </div>
                  {i > 0 && onRestore && (
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => onRestore(i)}>
                      恢复此版本
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import type { KpKind } from "@/types";

export interface EditableKp {
  t: string;
  d: string;
  kinds: KpKind[];
}

const KIND_META: Record<KpKind, { label: string; border: string; chip: string }> = {
  focus: {
    label: "重点",
    border: "border-l-primary",
    chip: "border-primary bg-primary-soft text-primary",
  },
  difficulty: {
    label: "难点",
    border: "border-l-warning",
    chip: "border-warning bg-warning-soft text-warning-ink",
  },
  redun: {
    label: "段子",
    border: "border-l-ink-3",
    chip: "border-ink-3 bg-tag-7-soft text-ink-2",
  },
};

export interface KpEditorBlockProps {
  kp: EditableKp;
  onChange: (patch: Partial<EditableKp>) => void;
  onRemove: () => void;
}

/** 知识点编辑块：左边框标识重点/难点/段子，支持多选类型 */
export function KpEditorBlock({ kp, onChange, onRemove }: KpEditorBlockProps) {
  const mainKind = kp.kinds[0] ?? "focus";

  function toggleKind(kind: KpKind) {
    const next = kp.kinds.includes(kind)
      ? kp.kinds.filter((k) => k !== kind)
      : [...kp.kinds, kind];
    onChange({ kinds: next.length ? next : ["focus"] });
  }

  return (
    <div className={cn("mb-2.5 rounded-card border border-border border-l-[3px] bg-card p-3.5", KIND_META[mainKind].border)}>
      <div className="mb-2 flex items-center gap-2">
        <input
          value={kp.t}
          onChange={(e) => onChange({ t: e.target.value })}
          placeholder="知识点标题"
          className="h-9 flex-1 rounded-btn border border-border px-2.5 text-[15px] font-medium text-ink-1 outline-none focus:border-primary"
        />
        <button
          onClick={onRemove}
          className="px-1.5 text-lg text-ink-3 transition-colors hover:text-error"
          aria-label="删除知识点"
        >
          ×
        </button>
      </div>
      <textarea
        value={kp.d}
        onChange={(e) => onChange({ d: e.target.value })}
        placeholder="知识点详细描述..."
        rows={2}
        className="w-full resize-y rounded-btn border border-border px-2.5 py-2 text-sm text-ink-2 outline-none focus:border-primary"
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {(Object.keys(KIND_META) as KpKind[]).map((kind) => (
          <button
            key={kind}
            onClick={() => toggleKind(kind)}
            className={cn(
              "rounded-tag border px-2.5 py-1 text-xs transition-colors",
              kp.kinds.includes(kind)
                ? KIND_META[kind].chip
                : "border-border text-ink-2 hover:border-border-hover"
            )}
          >
            {KIND_META[kind].label}
          </button>
        ))}
      </div>
    </div>
  );
}

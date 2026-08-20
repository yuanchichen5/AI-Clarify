"use client";

export interface EditableDiff {
  t: string;
  d: string;
  suggestion?: string;
}

export interface DiffEditorBlockProps {
  diff: EditableDiff;
  onChange: (patch: Partial<EditableDiff>) => void;
  onRemove: () => void;
}

/** 难点编辑块：琥珀色左边框 */
export function DiffEditorBlock({ diff, onChange, onRemove }: DiffEditorBlockProps) {
  return (
    <div className="mb-2.5 rounded-card border border-border border-l-[3px] border-l-warning bg-card p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <input
          value={diff.t}
          onChange={(e) => onChange({ t: e.target.value })}
          placeholder="难点标题"
          className="h-9 flex-1 rounded-btn border border-border px-2.5 text-[15px] font-medium text-ink-1 outline-none focus:border-primary"
        />
        <button
          onClick={onRemove}
          className="px-1.5 text-lg text-ink-3 transition-colors hover:text-error"
          aria-label="删除难点"
        >
          ×
        </button>
      </div>
      <textarea
        value={diff.d}
        onChange={(e) => onChange({ d: e.target.value })}
        placeholder="难点详细解析..."
        rows={2}
        className="w-full resize-y rounded-btn border border-border px-2.5 py-2 text-sm text-ink-2 outline-none focus:border-primary"
      />
      <input
        value={diff.suggestion ?? ""}
        onChange={(e) => onChange({ suggestion: e.target.value })}
        placeholder="突破建议（可选）"
        className="mt-2 h-9 w-full rounded-btn border border-border px-2.5 text-sm text-ink-2 outline-none focus:border-primary"
      />
    </div>
  );
}

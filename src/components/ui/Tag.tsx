import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Semantic = "purple" | "amber" | "green" | "grey" | "red";
type TagColor = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const semanticCls: Record<Semantic, string> = {
  purple: "bg-primary-soft text-primary",
  amber: "bg-warning-soft text-warning-ink",
  green: "bg-success-soft text-success-ink",
  grey: "bg-tag-7-soft text-ink-3",
  red: "bg-error-soft text-error",
};

const colorCls = (c: TagColor) => `bg-tag-${c}-soft text-tag-${c}`;

export interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  /** 语义标签（重点/难点/段子等） */
  semantic?: Semantic;
  /** 目录/自定义标签 8 色 */
  color?: TagColor;
  /** 可移除（右侧 ×） */
  onRemove?: () => void;
}

export function Tag({ semantic, color, onRemove, className, children, ...rest }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 rounded-tag px-2 text-xs leading-none",
        semantic ? semanticCls[semantic] : colorCls((color ?? 0) as TagColor),
        className
      )}
      {...rest}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="移除标签"
          className="ml-0.5 font-semibold opacity-55 transition-opacity hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}

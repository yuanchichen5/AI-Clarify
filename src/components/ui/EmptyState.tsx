import type { ReactNode } from "react";
import { Icon } from "./Icon";

export interface EmptyStateProps {
  /** 图标名（icons 库） */
  icon?: string;
  title: string;
  description?: string;
  /** 操作按钮区 */
  children?: ReactNode;
  className?: string;
}

/** 全局空状态组件（设计文档 §七 空状态规范） */
export function EmptyState({
  icon = "book",
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center px-6 py-16 text-center " + (className ?? "")
      }
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon name={icon} className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-semibold text-ink-1">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm text-ink-2">{description}</p>}
      {children && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>
      )}
    </div>
  );
}

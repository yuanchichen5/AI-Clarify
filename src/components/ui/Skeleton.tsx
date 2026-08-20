import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** 骨架屏占位（设计文档：加载态与真实条目高度一致） */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-btn bg-border/80", className)} {...rest} />;
}

/** 列表骨架屏：每行标题占位条 + 次要信息占位条 */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-card border border-border bg-card p-3.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

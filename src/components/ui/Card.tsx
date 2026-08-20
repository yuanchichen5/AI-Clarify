import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 是否应用内容内边距（默认 20px，对应设计文档 card-pad） */
  padded?: boolean;
}

export function Card({ padded = true, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn("rounded-card border border-border bg-card", padded && "p-5", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-btn border border-border bg-card px-3 text-sm text-ink-1",
        "outline-none transition-colors placeholder:text-ink-3 focus:border-primary",
        className
      )}
      {...rest}
    />
  );
}

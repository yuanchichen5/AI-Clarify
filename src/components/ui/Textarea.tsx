import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-card border border-border bg-card px-3.5 py-3.5 text-sm text-ink-1",
        "outline-none transition-colors placeholder:text-ink-3 focus:border-primary",
        className
      )}
      {...rest}
    />
  );
}

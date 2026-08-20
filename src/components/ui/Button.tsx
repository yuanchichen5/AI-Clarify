import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "soft" | "danger";
type Size = "sm" | "md" | "lg";

const variantCls: Record<Variant, string> = {
  primary: "border-transparent bg-primary text-white hover:bg-primary-hover",
  ghost: "border-border bg-card text-ink-2 hover:border-border-hover hover:bg-bg hover:text-ink-1",
  soft: "border-transparent bg-primary-soft text-primary hover:bg-[#E7E2FB]",
  danger: "border-border bg-card text-error hover:border-error",
};

const sizeCls: Record<Size, string> = {
  sm: "h-[30px] gap-1.5 px-3 text-xs",
  md: "h-9 gap-1.5 px-4 text-sm",
  lg: "h-11 gap-1.5 px-6 text-[15px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** 传入 href 时渲染为链接按钮 */
  href?: string;
  block?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  block,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(
    "press-feedback inline-flex items-center justify-center rounded-btn border font-normal",
    "transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50",
    variantCls[variant],
    sizeCls[size],
    block && "w-full",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

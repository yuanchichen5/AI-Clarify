"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/library", label: "知识库", icon: "book" },
  { href: "/ingest", label: "录入", icon: "upload" },
  { href: "/review", label: "复习", icon: "clipboard" },
  { href: "/dashboard", label: "我的", icon: "user" },
] as const;

/** 移动端底部 Tab 栏（设计文档 §九：<768px 单栏，底部 Tab 替代部分顶部导航） */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card lg:hidden">
      <div className="mx-auto flex max-w-[1440px] items-stretch">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors",
                active ? "text-primary" : "text-ink-3"
              )}
            >
              <Icon name={tab.icon} className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

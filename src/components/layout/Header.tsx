"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/library", label: "知识库", icon: "book" },
  { href: "/chat", label: "AI 对话", icon: "chat" },
  { href: "/review", label: "复习中心", icon: "clipboard" },
  { href: "/dashboard", label: "数据看板", icon: "chart" },
  { href: "/help", label: "帮助中心", icon: "help" },
] as const;

/**
 * 通用 Header（设计文档 §四-通用组件）
 * 左：Logo + 名称；中：全局搜索框；右：新建笔记主按钮 + 用户头像
 * 下方：子导航（6 个页面入口，当前项主紫高亮 + 下划线）
 */
export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-6">
        <Link
          href="/library"
          className="flex shrink-0 items-center gap-2.5 text-lg font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-btn bg-primary text-white">
            <Icon name="spark" className="h-4.5 w-4.5" />
          </span>
          Clarify
        </Link>

        <form
          action="/library"
          className="hidden flex-1 items-center gap-2 rounded-btn border border-border bg-bg px-3 py-2 text-ink-3 transition-colors focus-within:border-primary md:flex md:max-w-[520px]"
        >
          <Icon name="search" className="h-4 w-4" />
          <input
            type="text"
            name="keyword"
            placeholder="搜索笔记、知识点、学科...（回车搜索）"
            className="w-full bg-transparent text-sm text-ink-1 outline-none"
          />
        </form>

        <div className="ml-auto flex items-center gap-3">
          <Button href="/ingest" size="md">
            <Icon name="plus" className="h-3.5 w-3.5" />
            新建笔记
          </Button>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-primary-soft text-sm font-semibold text-primary"
            title="用户"
          >
            李
          </span>
        </div>
      </div>

      <nav className="mx-auto flex h-[46px] max-w-[1440px] items-center gap-1 overflow-x-auto px-6">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center whitespace-nowrap rounded-btn px-4 py-2.5 text-sm transition-colors hover:bg-bg",
                active ? "font-medium text-primary" : "text-ink-2 hover:text-ink-1"
              )}
            >
              <Icon name={item.icon} className="mr-1 h-4 w-4" />
              {item.label}
              {active && (
                <span className="absolute bottom-[-4px] left-4 right-4 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

import Link from "next/link";

/**
 * 通用 Footer（设计文档 §四-通用组件）
 * 左：版权信息；右：帮助中心 / 反馈 入口
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-6 py-4 text-xs text-ink-3">
        <span>© 2026 Clarify · AI 智能笔记整理师</span>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/help" className="transition-colors hover:text-primary">
            帮助中心
          </Link>
          <a href="mailto:support@clarify.ai" className="transition-colors hover:text-primary">
            意见反馈
          </a>
        </div>
      </div>
    </footer>
  );
}

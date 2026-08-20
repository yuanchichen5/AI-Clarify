import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Clarify · AI 智能笔记整理师",
    template: "%s · Clarify",
  },
  description:
    "多模态 AI 笔记整理工具：拍照 / 截图 / 文本 / PPT / PDF / 视频一键录入，自动提炼重点难点，生成结构化笔记与复习计划。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-bg font-sans text-ink-1 antialiased">{children}</body>
    </html>
  );
}

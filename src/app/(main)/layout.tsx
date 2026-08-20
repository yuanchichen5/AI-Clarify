import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * 主应用布局：Header → 主体内容区 → Footer
 * 页面内容最大宽度 1440px，左右 24px 内边距，底部 48px
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pb-12">{children}</main>
      <Footer />
    </div>
  );
}

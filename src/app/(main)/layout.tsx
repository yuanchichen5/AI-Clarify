import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { NetworkBanner } from "@/components/layout/NetworkBanner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

/**
 * 主应用布局：Header → 主体内容区 → Footer
 * 移动端（<768px）：底部 Tab 栏替代部分顶部导航，主体内容预留底部空间
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NetworkBanner />
      <Header />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-16 pt-2 sm:px-6 lg:pb-12">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}

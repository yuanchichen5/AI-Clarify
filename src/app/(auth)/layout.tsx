import { Icon } from "@/components/ui/Icon";

/**
 * 认证布局：居中单卡片（max-w 420px），无 Header/Footer
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex items-center justify-center gap-2.5 text-lg font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-primary text-white">
            <Icon name="spark" className="h-4.5 w-4.5" />
          </span>
          Clarify
        </div>
        {children}
      </div>
    </div>
  );
}

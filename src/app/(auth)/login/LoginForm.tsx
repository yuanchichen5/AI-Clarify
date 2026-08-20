"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function LoginForm({ next = "/library" }: { next?: string }) {
  const router = useRouter();

  const [email, setEmail] = useState("student@clarify.ai");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("请输入有效的邮箱地址");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { shouldCreateUser: false },
      });
      if (authError) {
        setError(
          authError.message === "Invalid login credentials" ? "邮箱或密码错误" : authError.message
        );
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("登录服务暂不可用，请确认 Supabase 配置后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-modal border border-border bg-card p-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-primary text-white">
          <Icon name="spark" className="h-4.5 w-4.5" />
        </span>
        <span className="text-lg font-semibold">Clarify</span>
      </div>

      <div className="mt-6 flex border-b border-border">
        <Link
          href="/login"
          className="flex-1 border-b-2 border-primary pb-3 text-center text-[15px] font-semibold text-ink-1"
        >
          登录
        </Link>
        <Link
          href="/register"
          className="flex-1 pb-3 text-center text-[15px] text-ink-3 transition-colors hover:text-ink-1"
        >
          注册
        </Link>
      </div>

      <h1 className="mt-6 text-2xl font-semibold">欢迎回来 👋</h1>
      <p className="mb-6 mt-1 text-[13px] text-ink-3">登录后继续整理你的学习笔记与思维导图。</p>

      {!isSupabaseConfigured && (
        <div className="mb-5 rounded-btn border border-warning bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning-ink">
          Supabase 尚未配置：请在项目根目录创建 <code className="font-mono">.env.local</code> 并填写{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> 与{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 后重试。
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-btn border border-error bg-error-soft px-3.5 py-2.5 text-[13px] text-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-[13px] text-ink-2">
            邮箱
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">
              <Icon name="mail" className="h-4 w-4" />
            </span>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-pwd" className="mb-1.5 block text-[13px] text-ink-2">
            密码
          </label>
          <div className="relative">
            <Input
              id="login-pwd"
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "隐藏密码" : "显示密码"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-3 transition-colors hover:text-ink-1"
            >
              <Icon name={showPwd ? "eye-off" : "eye"} className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[13px] text-ink-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            记住我
          </label>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-primary">
            忘记密码？
          </a>
        </div>

        <Button type="submit" size="lg" block disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-3">
        还没有账号？{" "}
        <Link href="/register" className="font-medium text-primary">
          立即注册
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-ink-3">
        登录即代表同意{" "}
        <a href="#" onClick={(e) => e.preventDefault()} className="text-ink-2">
          《用户协议》
        </a>{" "}
        与{" "}
        <a href="#" onClick={(e) => e.preventDefault()} className="text-ink-2">
          《隐私政策》
        </a>
      </p>
    </div>
  );
}

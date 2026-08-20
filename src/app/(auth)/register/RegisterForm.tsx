"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function RegisterForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!nickname.trim()) return setError("请填写昵称");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("请输入有效的邮箱地址");
    if (password.length < 8) return setError("密码至少 8 位，建议包含字母与数字");
    if (password !== confirm) return setError("两次输入的密码不一致");
    if (!agree) return setError("请先同意用户协议与隐私政策");

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nickname } },
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      if (data.session) {
        router.push("/library");
        router.refresh();
      } else {
        // 邮箱确认开启时：提示查收确认邮件
        setInfo("注册成功！请前往邮箱查收确认链接，确认后即可登录。");
      }
    } catch {
      setError("注册服务暂不可用，请确认 Supabase 配置后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-modal border border-border bg-card p-8">
      <h1 className="text-2xl font-semibold">开启你的智能笔记 ✨</h1>
      <p className="mb-6 mt-1 text-[13px] text-ink-3">
        30 秒创建账号，体验 AI 整理课堂录音与课件。
      </p>

      {!isSupabaseConfigured && (
        <div className="mb-5 rounded-btn border border-warning bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning-ink">
          Supabase 尚未配置：请在 <code className="font-mono">.env.local</code> 填写{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> 与{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 后重试。
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-btn border border-error bg-error-soft px-3.5 py-2.5 text-[13px] text-error">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-5 rounded-btn border border-success bg-success-soft px-3.5 py-2.5 text-[13px] text-success-ink">
          {info}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="reg-nick" className="mb-1.5 block text-[13px] text-ink-2">
            昵称
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">
              <Icon name="user" className="h-4 w-4" />
            </span>
            <Input
              id="reg-nick"
              placeholder="例如：李同学"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-[13px] text-ink-2">
            邮箱
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">
              <Icon name="mail" className="h-4 w-4" />
            </span>
            <Input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="reg-pwd" className="mb-1.5 block text-[13px] text-ink-2">
              设置密码
            </label>
            <Input
              id="reg-pwd"
              type="password"
              placeholder="至少 8 位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>
          <div>
            <label htmlFor="reg-pwd2" className="mb-1.5 block text-[13px] text-ink-2">
              确认密码
            </label>
            <Input
              id="reg-pwd2"
              type="password"
              placeholder="再次输入"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-ink-2">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="h-3.5 w-3.5 accent-primary"
          />
          我已阅读并同意《用户协议》与《隐私政策》
        </label>

        <Button type="submit" size="lg" block disabled={loading}>
          {loading ? "创建中..." : "创建账号"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-3">
        已有账号？{" "}
        <Link href="/login" className="font-medium text-primary">
          直接登录
        </Link>
      </p>
    </div>
  );
}

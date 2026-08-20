"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * 浏览器端 Supabase 客户端（单例）
 * 仅限客户端组件使用；服务端组件一律走 server.ts
 */
export function createClient() {
  if (browserClient) return browserClient;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase 未配置：请在 .env.local 中设置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return browserClient;
}

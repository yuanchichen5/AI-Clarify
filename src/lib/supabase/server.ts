import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * 服务端 Supabase 客户端（每个请求独立创建，读取请求 Cookie）
 * 仅限服务端组件 / Route Handler / Server Action 使用
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 服务端组件中调用 set 会抛错（只读上下文），由中间件负责刷新会话
        }
      },
    },
  });
}

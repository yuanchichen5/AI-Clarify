/**
 * Supabase 环境配置（M0-4）
 * 环境变量缺失时应用优雅降级：页面可渲染，业务功能提示配置缺失
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** 是否已完成 Supabase 配置 */
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith("http")
);

/** AI 模型密钥（M1 起使用，先统一在此声明） */
export const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY ?? "";
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? "";

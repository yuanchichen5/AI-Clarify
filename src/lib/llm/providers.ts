import type { ProviderConfig } from "./types";
import { DASHSCOPE_API_KEY, DEEPSEEK_API_KEY } from "@/lib/supabase/config";

/**
 * 提供商配置（模型切换只改配置不改业务代码）
 * - DashScope 兼容模式：https://dashscope.aliyuncs.com/compatible-mode/v1
 * - DeepSeek：https://api.deepseek.com/v1
 */
export const PROVIDERS: ProviderConfig[] = [
  {
    id: "dashscope",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKey: DASHSCOPE_API_KEY,
    models: {
      "qwen3-max": "qwen-max",
      "qwen-vl": "qwen-vl-max",
    },
    embeddingModel: "text-embedding-v3",
  },
  {
    id: "deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: DEEPSEEK_API_KEY,
    models: {
      "deepseek-v4-flash": "deepseek-chat",
    },
  },
];

/** 当前可用的提供商（有 key 的） */
export function availableProviders(): ProviderConfig[] {
  return PROVIDERS.filter((p) => Boolean(p.apiKey));
}

/** 是否有任何 AI 能力可用 */
export function isAiConfigured(): boolean {
  return availableProviders().length > 0;
}

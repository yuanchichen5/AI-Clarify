import { availableProviders, isAiConfigured } from "./providers";
import type {
  ChatChunk,
  ChatMessage,
  ChatResult,
  LLMCallParams,
  LLMClient,
  ProviderConfig,
} from "./types";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI 服务未配置：请在 .env.local 设置 DASHSCOPE_API_KEY 或 DEEPSEEK_API_KEY");
    this.name = "AiNotConfiguredError";
  }
}

export class AiRateLimitedError extends Error {
  constructor(message = "AI 服务繁忙，请稍后重试") {
    super(message);
    this.name = "AiRateLimitedError";
  }
}

const RETRYABLE_STATUS = [429, 500, 502, 503, 504];

/** 指数退避：1s → 2s → 4s */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3
): Promise<Response> {
  let lastErr: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (RETRYABLE_STATUS.includes(res.status) && i < attempts - 1) {
        await sleep(1000 * 2 ** i);
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (i < attempts - 1) await sleep(1000 * 2 ** i);
    }
  }
  throw lastErr ?? new Error("网络请求失败");
}

/**
 * OpenAI 兼容统一客户端（lib/llm 是唯一 AI 调用入口，业务模块不得绕过）
 */
class OpenAiCompatClient implements LLMClient {
  private providerFor(model: string): ProviderConfig {
    for (const p of availableProviders()) {
      if (p.models[model]) return p;
    }
    throw new AiNotConfiguredError();
  }

  private toWireParams(params: LLMCallParams, provider: ProviderConfig) {
    const messages = params.messages.map((m) => {
      if (m.parts?.length) {
        return {
          role: m.role,
          content: m.parts.map((part) =>
            part.type === "image_url"
              ? { type: "image_url", image_url: { url: part.image_url.url } }
              : { type: "text", text: part.text }
          ),
        };
      }
      return { role: m.role, content: m.content };
    });
    const body: Record<string, unknown> = {
      model: provider.models[params.model],
      messages,
      temperature: params.temperature ?? 0.4,
      stream: Boolean(params.stream),
    };
    if (params.maxTokens) body.max_tokens = params.maxTokens;
    if (params.jsonMode) body.response_format = { type: "json_object" };
    return body;
  }

  async chat(params: LLMCallParams): Promise<ChatResult> {
    if (!isAiConfigured()) throw new AiNotConfiguredError();
    const provider = this.providerFor(params.model);

    const res = await fetchWithRetry(
      `${provider.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(this.toWireParams(params, provider)),
      }
    );

    if (!res.ok) {
      if (res.status === 429) throw new AiRateLimitedError();
      const body = await res.text().catch(() => "");
      throw new Error(`AI 调用失败 (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    let json: unknown = undefined;
    if (params.jsonMode) {
      try {
        json = JSON.parse(content);
      } catch {
        // 模型偶发输出 Markdown 包裹的 JSON，尝试剥离
        const cleaned = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
        json = JSON.parse(cleaned);
      }
    }

    return {
      content,
      json,
      usage: {
        promptTokens: data?.usage?.prompt_tokens,
        completionTokens: data?.usage?.completion_tokens,
      },
    };
  }

  async *chatStream(params: LLMCallParams): AsyncIterable<ChatChunk> {
    if (!isAiConfigured()) throw new AiNotConfiguredError();
    const provider = this.providerFor(params.model);

    const res = await fetchWithRetry(
      `${provider.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({ ...this.toWireParams(params, provider), stream: true }),
      }
    );

    if (!res.ok || !res.body) {
      if (res.status === 429) throw new AiRateLimitedError();
      throw new Error(`AI 流式调用失败 (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE 按行解析
        let idx: number;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") {
            yield { content: "", done: true };
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content ?? "";
            if (delta) yield { content: delta, done: false };
          } catch {
            // 忽略无法解析的心跳行
          }
        }
      }
      yield { content: "", done: true };
    } finally {
      reader.releaseLock();
    }
  }

  async embed(text: string): Promise<number[] | null> {
    if (!isAiConfigured()) return null;
    const provider = availableProviders()[0];
    const model = provider.embeddingModel;
    if (!model) return null;
    try {
      const res = await fetchWithRetry(
        `${provider.baseUrl}/embeddings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify({ model, input: text }),
        },
        2
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data?.data?.[0]?.embedding ?? null;
    } catch {
      return null;
    }
  }
}

/** 全局单例 */
export const llm: LLMClient = new OpenAiCompatClient();

/** 便捷方法：JSON 模式调用并返回解析结果 */
export async function llmJson<T>(
  model: LLMCallParams["model"],
  system: string,
  messages: ChatMessage[],
  fallback: () => T
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const result = await llm.chat({ model, system, messages, jsonMode: true, temperature: 0.2 });
    return { ok: true, data: (result.json ?? fallback()) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

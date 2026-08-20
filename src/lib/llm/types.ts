/**
 * AI 统一抽象层 · 类型定义（开发规划文档 §5.4）
 * 所有模型（Qwen3-Max / DeepSeek-V4-Flash / Qwen-VL）走同一 OpenAI 兼容接口
 */

export type ModelName = "qwen3-max" | "deepseek-v4-flash" | "qwen-vl";

export type MessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
  /** 多模态内容（Qwen-VL）：[{ type: "text", text }, { type: "image_url", image_url: { url } }] */
  parts?: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
}

export interface LLMCallParams {
  model: ModelName;
  system?: string;
  messages: ChatMessage[];
  /** 是否流式（SSE） */
  stream?: boolean;
  /** 结构化输出（JSON mode） */
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatChunk {
  /** 增量文本 */
  content: string;
  /** 是否结束 */
  done: boolean;
  /** 流结束时的用量/会话信息 */
  meta?: { conversationId?: string; messageId?: string };
}

export interface ChatResult {
  content: string;
  /** JSON mode 时解析后的对象 */
  json?: unknown;
  usage?: { promptTokens?: number; completionTokens?: number };
}

export interface LLMClient {
  chat(params: LLMCallParams): Promise<ChatResult>;
  /** 流式对话，逐块 yield */
  chatStream(params: LLMCallParams): AsyncIterable<ChatChunk>;
  /** 文本向量化（走统一 embedding 端点），失败返回 null 由调用方降级 */
  embed(text: string): Promise<number[] | null>;
}

/** 提供商配置 */
export interface ProviderConfig {
  id: string;
  baseUrl: string;
  apiKey: string;
  models: Record<string, string>; // 逻辑模型名 → 提供商模型名
  embeddingModel?: string;
}

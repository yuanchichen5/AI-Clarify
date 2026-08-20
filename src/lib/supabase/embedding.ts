import { llm } from "@/lib/llm/client";

/**
 * 归档时写入 embedding（M1-7）
 * - 向量写入失败 → 归档降级为仅存正文（设计文档异常矩阵）
 * - 返回 null 表示不可用，调用方走降级路径
 */
export async function embedForNote(text: string): Promise<number[] | null> {
  const cleaned = text.trim().slice(0, 2000);
  if (!cleaned) return null;
  return llm.embed(cleaned);
}

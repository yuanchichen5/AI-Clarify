import { Buffer } from "buffer";

/**
 * 演示模式文件暂存（未配置 Supabase 时，服务端内存持有上传内容）
 * 仅用于 /api/parse 的 base64 直传路径；配置 Supabase 后走 Storage 预签名直传
 */
interface BufferedFile {
  name: string;
  mime: string;
  buf: Buffer;
  createdAt: number;
}

const buffer = new Map<string, BufferedFile>();
const TTL = 30 * 60 * 1000;

export function bufferFile(key: string, name: string, mime: string, data: string): void {
  buffer.set(key, { name, mime, buf: Buffer.from(data, "base64"), createdAt: Date.now() });
  // 顺手清理过期项
  const now = Date.now();
  for (const [k, v] of buffer) {
    if (now - v.createdAt > TTL) buffer.delete(k);
  }
}

export function takeFile(key: string): BufferedFile | null {
  const f = buffer.get(key);
  if (f) buffer.delete(key);
  return f ?? null;
}

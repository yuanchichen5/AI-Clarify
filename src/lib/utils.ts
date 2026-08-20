/**
 * 通用工具函数
 */
export type ClassValue = string | number | null | undefined | false;

/** 轻量 className 合并（等价 clsx 核心功能，避免额外依赖） */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}

/** 生成短 ID（前端临时对象用，服务端由数据库生成） */
export function genId(prefix = ""): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${rand}` : rand;
}

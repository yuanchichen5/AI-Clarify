"use client";

/**
 * 轻量埋点（M4-5，P2）：本地日志 + 控制台
 * 核心指标（PRD §1.2）：笔记整理步数 / AI 采纳率 / 30 天留存
 * 事件类型：
 *   - ingest_start     录入开始
 *   - parse_done       解析完成
 *   - note_archived    笔记归档
 *   - note_edited      编辑修改
 *   - review_submit    复习交卷
 *   - export_done      导出
 *   - chat_message     对话消息
 */
export type TrackEvent =
  | "ingest_start"
  | "parse_done"
  | "note_archived"
  | "note_edited"
  | "review_submit"
  | "export_done"
  | "chat_message";

const KEY = "clarify:analytics";

interface AnalyticsEntry {
  event: TrackEvent;
  data: Record<string, unknown>;
  ts: number;
}

export function track(event: TrackEvent, data: Record<string, unknown> = {}): void {
  const entry: AnalyticsEntry = { event, data, ts: Date.now() };
  try {
    const raw = localStorage.getItem(KEY);
    const list: AnalyticsEntry[] = raw ? JSON.parse(raw) : [];
    list.push(entry);
    // 最多保留 2000 条
    localStorage.setItem(KEY, JSON.stringify(list.slice(-2000)));
  } catch {
    /* ignore */
  }
  if (process.env.NODE_ENV !== "production") {
    console.info(`[clarify:track] ${event}`, data);
  }
}

export function getAnalytics(): AnalyticsEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

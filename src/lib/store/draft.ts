"use client";

/** 草稿自动保存（PRD §5.4：编辑中断自动保存草稿，留存 7 天） */
export interface NoteDraft {
  id: string;
  title: string;
  subject: string;
  content: unknown;
  savedAt: number;
}

const PREFIX = "clarify:draft:";
const TTL = 7 * 24 * 3600 * 1000;

export function saveDraft(draft: NoteDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + draft.id, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    /* 忽略容量错误 */
  }
}

export function loadDraft(id: string): NoteDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + id);
    if (!raw) return null;
    const draft = JSON.parse(raw) as NoteDraft;
    if (Date.now() - draft.savedAt > TTL) {
      localStorage.removeItem(PREFIX + id);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function clearDraft(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + id);
}

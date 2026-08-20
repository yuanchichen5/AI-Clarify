"use client";

/** 复习作答记录（演示模式看板数据源：掌握度 / 薄弱知识点） */
export interface DemoAttempt {
  kpTitle: string;
  subject: string;
  noteId: string;
  correct: number;
  wrong: number;
  lastAt: number;
}

const KEY = "clarify:demo-attempts";

export function loadDemoAttempts(): DemoAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoAttempt[]) : [];
  } catch {
    return [];
  }
}

export function recordAttempts(
  results: { title: string; subject: string; noteId: string; isCorrect: boolean; answered: boolean }[]
): void {
  const list = loadDemoAttempts();
  for (const r of results) {
    if (!r.answered) continue; // 未作答不计入掌握度
    const idx = list.findIndex((a) => a.kpTitle === r.title);
    if (idx >= 0) {
      if (r.isCorrect) list[idx].correct += 1;
      else list[idx].wrong += 1;
      list[idx].lastAt = Date.now();
    } else {
      list.push({
        kpTitle: r.title,
        subject: r.subject,
        noteId: r.noteId,
        correct: r.isCorrect ? 1 : 0,
        wrong: r.isCorrect ? 0 : 1,
        lastAt: Date.now(),
      });
    }
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function clearDemoAttempts(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

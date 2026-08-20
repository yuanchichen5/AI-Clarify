"use client";

import type { KpKind } from "@/types";

/**
 * 演示模式笔记存储（Supabase 未配置时，归档落 localStorage）
 * 结构对齐 API 契约的 Note 数据模型；配置 Supabase 后由服务端接管
 */
export interface DemoNote {
  id: string;
  title: string;
  subject: string;
  folder: string;
  tags: string[];
  kps: { t: string; d: string; kinds: KpKind[] }[];
  diffs: { t: string; d: string }[];
  supps: string[];
  time: string;
  archivedAt: number;
  /** 版本快照（M2-6，最多保留 10 条） */
  versions?: { label: string; time: string; kpCount: number; kps: { t: string; d: string; kinds: KpKind[] }[] }[];
}

const KEY = "clarify:demo-notes";
const TTL_DAYS = 7;

export function loadDemoNotes(): DemoNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as DemoNote[];
    // 7 天 TTL 清理
    const cutoff = Date.now() - TTL_DAYS * 24 * 3600 * 1000;
    const fresh = list.filter((n) => n.archivedAt > cutoff);
    if (fresh.length !== list.length) saveDemoNotes(fresh);
    return fresh;
  } catch {
    return [];
  }
}

export function saveDemoNotes(list: DemoNote[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 容量满时忽略（演示模式）
  }
}

export function saveDemoNote(note: DemoNote): void {
  const list = loadDemoNotes();
  const idx = list.findIndex((n) => n.id === note.id);
  if (idx >= 0) {
    const prev = list[idx];
    // 内容有变化才生成快照
    if (JSON.stringify(prev.kps) !== JSON.stringify(note.kps) || prev.title !== note.title) {
      const snapshot = {
        label: "版本 " + ((prev.versions?.length ?? 0) + 1),
        time: new Date().toLocaleString("zh-CN", { hour12: false }),
        kpCount: prev.kps.length,
        kps: prev.kps,
      };
      note.versions = [snapshot, ...(prev.versions ?? [])].slice(0, 10);
    } else {
      note.versions = prev.versions;
    }
    list[idx] = note;
  } else {
    list.unshift(note);
  }
  saveDemoNotes(list);
}

export function deleteDemoNote(id: string): void {
  saveDemoNotes(loadDemoNotes().filter((n) => n.id !== id));
}

export function getDemoNote(id: string): DemoNote | null {
  return loadDemoNotes().find((n) => n.id === id) ?? null;
}

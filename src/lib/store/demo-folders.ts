"use client";

import type { TagColor } from "@/types";
import { genId } from "@/lib/utils";

/** 演示模式目录（8 色标签；Supabase 配置后由 /api/folders 接管） */
export interface DemoFolder {
  id: string;
  name: string;
  color: TagColor;
  parentId: string | null;
  createdAt: number;
}

const KEY = "clarify:demo-folders";

export function loadDemoFolders(): DemoFolder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoFolder[]) : [];
  } catch {
    return [];
  }
}

function saveFolders(list: DemoFolder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* 忽略 */
  }
}

export function createDemoFolder(name: string, color: TagColor, parentId: string | null = null): DemoFolder {
  const folder: DemoFolder = {
    id: "f_" + genId(),
    name,
    color,
    parentId,
    createdAt: Date.now(),
  };
  saveFolders([...loadDemoFolders(), folder]);
  return folder;
}

export function renameDemoFolder(id: string, name: string): void {
  saveFolders(loadDemoFolders().map((f) => (f.id === id ? { ...f, name } : f)));
}

export function recolorDemoFolder(id: string, color: TagColor): void {
  saveFolders(loadDemoFolders().map((f) => (f.id === id ? { ...f, color } : f)));
}

export function deleteDemoFolder(id: string): void {
  // 软删除：同时删除其子目录引用（笔记 folder 置为 all）
  const all = loadDemoFolders();
  const dead = new Set<string>([id]);
  for (const f of all) {
    let p = f.parentId;
    while (p) {
      if (dead.has(p)) {
        dead.add(f.id);
        break;
      }
      p = all.find((x) => x.id === p)?.parentId ?? null;
    }
  }
  saveFolders(all.filter((f) => !dead.has(f.id)));
}

/** 目录树构建（含笔记计数由调用方注入） */
export function buildFolderTree(folders: DemoFolder[]): DemoFolder[] {
  return folders.filter((f) => f.parentId === null);
}

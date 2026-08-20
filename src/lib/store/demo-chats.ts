"use client";

import { genId } from "@/lib/utils";

export interface DemoChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  demo?: boolean;
}

export interface DemoChat {
  id: string;
  title: string;
  messages: DemoChatMessage[];
  updatedAt: number;
}

const KEY = "clarify:demo-chats";

export function loadDemoChats(): DemoChat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoChat[]) : [];
  } catch {
    return [];
  }
}

function saveChats(list: DemoChat[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getDemoChat(id: string): DemoChat | null {
  return loadDemoChats().find((c) => c.id === id) ?? null;
}

export function saveDemoChat(chat: DemoChat): void {
  const list = loadDemoChats();
  const idx = list.findIndex((c) => c.id === chat.id);
  if (idx >= 0) list[idx] = chat;
  else list.unshift(chat);
  saveChats(list);
}

export function createDemoChat(title: string): DemoChat {
  const chat: DemoChat = { id: "conv_" + genId(), title, messages: [], updatedAt: Date.now() };
  saveDemoChat(chat);
  return chat;
}

export function clearDemoChats(): void {
  saveChats([]);
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  loadDemoChats,
  createDemoChat,
  saveDemoChat,
  clearDemoChats,
  getDemoChat,
  type DemoChat,
  type DemoChatMessage,
} from "@/lib/store/demo-chats";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * AI 对话助手面板（设计文档 §四-3）
 * 左栏：会话列表 + 清空历史；右栏：消息流（流式输出 + 闪烁光标）+ 输入区
 * 一键转笔记：生成草稿并跳转 /notes/:id
 */
export function ChatPanel() {
  const router = useRouter();
  const [chats, setChats] = useState<DemoChat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChats(loadDemoChats());
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [chats, activeId]);

  const active = chats.find((c) => c.id === activeId) ?? null;

  function openChat(id: string) {
    setActiveId(id);
  }

  function newChat() {
    const chat = createDemoChat("新对话");
    setChats(loadDemoChats());
    setActiveId(chat.id);
  }

  function clearHistory() {
    if (!window.confirm("确定要清空全部历史会话吗？")) return;
    clearDemoChats();
    setChats([]);
    setActiveId(null);
  }

  function patchMessages(chatId: string, messages: DemoChatMessage[], title?: string) {
    const chat = getDemoChat(chatId);
    if (!chat) return;
    saveDemoChat({ ...chat, title: title ?? chat.title, messages, updatedAt: Date.now() });
    setChats(loadDemoChats());
  }

  // SSE 流式发送
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const chat = active ?? createDemoChat(text.slice(0, 20));
    if (!active) {
      setChats(loadDemoChats());
      setActiveId(chat.id);
    }

    const userMsg: DemoChatMessage = { id: "m" + Date.now(), role: "user", content: text };
    const newMessages = [...(chat.messages ?? []), userMsg];
    patchMessages(chat.id, newMessages, chat.title === "新对话" ? text.slice(0, 20) : chat.title);
    setInput("");
    setStreaming(true);

    const aiMsg: DemoChatMessage = { id: "m" + Date.now() + "a", role: "assistant", content: "" };
    patchMessages(chat.id, [...newMessages, aiMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: chat.id, message: text }),
      });

      if (!res.body) throw new Error("流式响应不可用");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.content) {
              full += evt.content;
              patchMessages(chat.id, [...newMessages, { ...aiMsg, content: full }]);
            }
          } catch {
            /* 心跳 */
          }
        }
      }
      // 最终落盘
      const finalMsg = { ...aiMsg, content: full || "（无回复）" };
      patchMessages(chat.id, [...newMessages, finalMsg]);
    } catch (e) {
      patchMessages(chat.id, [
        ...newMessages,
        { ...aiMsg, content: "对话失败：" + (e instanceof Error ? e.message : "未知错误") },
      ]);
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, active]);

  function noteFromChat() {
    if (!active) return;
    const assistantText = active.messages
      .filter((m) => m.role === "assistant" && !m.demo)
      .map((m) => m.content)
      .join("\n\n");
    const id = "note_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const draft = {
      id,
      title: (active.title !== "新对话" ? active.title : "AI 对话整理").slice(0, 50),
      subject: "未分类",
      content: {
        knowledgePoints: [
          { t: "对话要点", d: assistantText.slice(0, 200) || "（对话内容为空）", kinds: ["focus"] },
        ],
        difficulties: [],
        supplements: [],
        important: false,
      },
      savedAt: Date.now(),
    };
    localStorage.setItem(`clarify:draft:${id}`, JSON.stringify(draft));
    router.push(`/notes/${id}`);
  }

  return (
    <div className="flex items-start gap-6">
      {/* ===== 左栏 260px ===== */}
      <aside className="flex w-[260px] shrink-0 flex-col gap-4">
        <Button block onClick={newChat}>
          <Icon name="plus" className="h-3.5 w-3.5" />
          新建对话
        </Button>
        <Card padded={false} className="overflow-hidden p-0">
          {chats.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-ink-3">暂无历史会话</div>
          ) : (
            chats.map((c) => (
              <button
                key={c.id}
                onClick={() => openChat(c.id)}
                className={cn(
                  "block w-full border-b border-border px-3.5 py-2.5 text-left transition-colors last:border-b-0 hover:bg-bg",
                  activeId === c.id && "bg-primary-soft"
                )}
              >
                <div className="truncate text-sm font-medium text-ink-1">{c.title}</div>
                <div className="mt-0.5 text-xs text-ink-3">
                  {c.messages.length} 条消息 · {new Date(c.updatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </button>
            ))
          )}
        </Card>
        <Button variant="ghost" size="sm" onClick={clearHistory} disabled={chats.length === 0}>
          清空历史
        </Button>
      </aside>

      {/* ===== 右栏 ===== */}
      <Card padded={false} className="flex min-h-[70vh] flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="text-base font-medium">{active?.title ?? "AI 对话助手"}</div>
          <span className="flex-1" />
          <Button variant="soft" size="sm" onClick={noteFromChat} disabled={!active || active.messages.length === 0}>
            <Icon name="book" className="h-3.5 w-3.5" />
            整理为笔记
          </Button>
        </div>

        <div ref={bodyRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4" style={{ minHeight: "40vh", maxHeight: "60vh" }}>
          {!active || active.messages.length === 0 ? (
            <EmptyState
              icon="chat"
              title="开启一次新对话"
              description="向 AI 提问或要求整理笔记内容，优质回答可一键归档至知识库。"
            />
          ) : (
            active.messages.map((m) => (
              <div key={m.id} className={cn("flex max-w-[78%] gap-2.5", m.role === "user" ? "ml-auto flex-row-reverse" : "")}>
                {m.role === "assistant" && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-btn bg-primary text-white">
                    <Icon name="spark" className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-card border px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "border-transparent bg-primary-soft text-ink-1"
                      : "border-border bg-card text-ink-1"
                  )}
                >
                  {m.content}
                  {streaming && m === active.messages[active.messages.length - 1] && m.role === "assistant" && (
                    <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-primary align-middle" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-end gap-2.5 border-t border-border px-5 py-3.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
            placeholder="输入问题，Ctrl+Enter 快捷发送..."
            className="max-h-[140px] min-h-11 flex-1 resize-y rounded-btn border border-border bg-card px-3 py-2.5 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-3 focus:border-primary"
          />
          <Button onClick={sendMessage} disabled={streaming || !input.trim()}>
            <Icon name="send" className="h-3.5 w-3.5" />
            {streaming ? "回答中..." : "发送"}
          </Button>
        </div>
        {!isSupabaseConfigured && (
          <p className="border-t border-border px-5 py-2 text-center text-[11px] text-ink-3">
            演示模式：会话保存在本地，AI 回复为演示内容（配置模型密钥后获得真实回答）
          </p>
        )}
      </Card>
    </div>
  );
}

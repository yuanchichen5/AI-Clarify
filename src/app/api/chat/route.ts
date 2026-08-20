import { llm } from "@/lib/llm/client";
import { isAiConfigured } from "@/lib/llm/providers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * POST /api/chat — 流式对话（SSE）
 * 请求：{ conversationId?, message }
 * 响应：text/event-stream，事件：delta / done / error
 * 未配置 AI → 单条演示回复（标注演示）
 */
export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const body = await request.json().catch(() => null);
        const message = (body?.message ?? "").toString().slice(0, 4000);
        if (!message.trim()) {
          send("error", { message: "消息不能为空" });
          controller.close();
          return;
        }

        // 会话持久化（Supabase 路径）
        if (isSupabaseConfigured) {
          try {
            const supabase = await createClient();
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              let convId = body?.conversationId ?? null;
              if (!convId) {
                const { data: conv } = await supabase
                  .from("conversations")
                  .insert({ user_id: user.id, title: message.slice(0, 20) })
                  .select("id")
                  .single();
                convId = conv?.id ?? null;
              }
              if (convId) {
                await supabase.from("messages").insert({ conversation_id: convId, role: "user", content: message });
              }
            }
          } catch {
            /* 会话持久化失败不阻塞对话 */
          }
        }

        if (!isAiConfigured()) {
          // 演示回复（明确标注）
          const demo = `【演示回复】我是 Clarify AI 助手（当前未配置模型密钥）。\n\n关于「${message.slice(0, 50)}」，建议从以下角度展开：\n1. 先明确概念定义与适用前提\n2. 结合你知识库中的笔记与思维导图对照复习\n3. 生成变体题检验掌握度\n\n配置 DASHSCOPE_API_KEY 或 DEEPSEEK_API_KEY 后，我将基于你的笔记给出针对性回答。`;
          for (const chunk of demo.match(/[\s\S]{1,12}/g) ?? []) {
            send("delta", { content: chunk });
            await new Promise((r) => setTimeout(r, 30));
          }
          send("done", { conversationId: body?.conversationId ?? null, demo: true });
          controller.close();
          return;
        }

        // 真实流式回答
        let full = "";
        for await (const chunk of llm.chatStream({
          model: "deepseek-v4-flash",
          system:
            "你是 Clarify AI 笔记整理助手。回答要结构化、精炼，优先结合学习场景：概念定义、易错点、例题。可引用 Markdown 列表与公式。",
          messages: [{ role: "user", content: message }],
        })) {
          if (chunk.done) break;
          full += chunk.content;
          send("delta", { content: chunk.content });
        }

        // 持久化 AI 回复
        if (isSupabaseConfigured) {
          try {
            const supabase = await createClient();
            const convId = body?.conversationId ?? null;
            if (convId) {
              await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: full });
            }
          } catch {
            /* ignore */
          }
        }

        send("done", { conversationId: body?.conversationId ?? null });
        controller.close();
      } catch (e) {
        send("error", { message: e instanceof Error ? e.message : "对话服务异常" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

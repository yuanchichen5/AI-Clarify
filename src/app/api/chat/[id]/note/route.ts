import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * POST /api/chat/:id/note — 对话一键转笔记
 * 请求：{ title?, folderId? }
 * 未配置 Supabase → 503（前端本地生成草稿）
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: { code: "UNCONFIGURED", message: "Supabase 未配置，前端本地生成草稿" } },
      { status: 503 }
    );
  }
  try {
    const supabase = await createClient();
    const { data: msgs } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(100);

    const body = await request.json().catch(() => ({}));
    const kps = (msgs ?? [])
      .filter((m: { role: string }) => m.role === "assistant")
      .slice(-5)
      .map((m: { content: string }, i: number) => ({
        title: `AI 回答要点 ${i + 1}`,
        definition: m.content.slice(0, 200),
        kind: "focus",
      }));

    const { data: note } = await supabase
      .from("notes")
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        title: body?.title ?? "AI 对话整理",
        subject: "未分类",
        content: { knowledgePoints: kps, difficulties: [], supplements: [] },
        status: "draft",
      })
      .select("id")
      .single();

    return NextResponse.json({ data: { noteId: note?.id ?? null } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

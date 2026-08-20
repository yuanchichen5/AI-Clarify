import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** GET /api/notes/:id — 笔记详情（含知识点、难点） */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "未配置 Supabase" } }, { status: 404 });
  }
  try {
    const supabase = await createClient();
    const { data: note, error } = await supabase.from("notes").select("*").eq("id", id).single();
    if (error || !note) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "笔记不存在" } }, { status: 404 });
    }
    const { data: kps } = await supabase
      .from("knowledge_points")
      .select("*")
      .eq("note_id", id)
      .eq("is_deleted", false)
      .order("order", { ascending: true });
    return NextResponse.json({ data: { ...note, knowledgePoints: kps ?? [] } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

/** PATCH /api/notes/:id — 编辑更新 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: { code: "UNCONFIGURED", message: "Supabase 未配置" } }, { status: 503 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notes")
      .update({
        title: body.title,
        subject: body.subject,
        content: body.content,
        folder_id: body.folderId,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: { code: "INTERNAL", message: error.message } }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

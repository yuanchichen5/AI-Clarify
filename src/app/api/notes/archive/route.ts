import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { embedForNote } from "@/lib/supabase/embedding";

/**
 * POST /api/notes/archive — 归档（写入笔记 + 知识点 + embedding，失败降级仅存正文）
 * 请求：{ title, subject, folderId?, content }
 * 响应：{ data: { noteId, embedding: "written" | "degraded" } }
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: { code: "UNCONFIGURED", message: "Supabase 未配置，归档走本地演示存储" } },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body?.title || !body?.content) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "标题与内容不能为空" } },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "请先登录" } },
        { status: 401 }
      );
    }

    // 1. 写笔记主记录
    const { data: note, error: noteErr } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        folder_id: body.folderId ?? null,
        title: body.title,
        subject: body.subject ?? "未分类",
        content: body.content,
        status: "archived",
      })
      .select("id")
      .single();
    if (noteErr || !note) {
      return NextResponse.json(
        { error: { code: "INTERNAL", message: noteErr?.message ?? "笔记写入失败" } },
        { status: 500 }
      );
    }

    // 2. 写知识点/难点（content 中抽取）
    const kps = body.content?.knowledgePoints ?? [];
    for (let i = 0; i < kps.length; i++) {
      await supabase.from("knowledge_points").insert({
        note_id: note.id,
        title: kps[i].title,
        definition: kps[i].definition ?? "",
        kind: (kps[i].kinds?.[0] ?? kps[i].kind) ?? "focus",
        kinds: kps[i].kinds ?? [kps[i].kind ?? "focus"],
        important: Boolean(kps[i].important),
        order: i,
      });
    }

    // 3. embedding 写入（失败降级，不影响归档成功）
    let embedding: "written" | "degraded" = "degraded";
    const embedText = body.title + "\n" + (kps.map((k: { title?: string }) => k.title ?? "").join("\n") ?? "");
    const vec = await embedForNote(embedText);
    if (vec) {
      const { error: embErr } = await supabase.from("note_embeddings").insert({
        note_id: note.id,
        content: embedText,
        embedding: vec,
      });
      if (!embErr) embedding = "written";
    }

    return NextResponse.json({ data: { noteId: note.id, embedding } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "归档异常" } },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * POST /api/notes — 新建/保存笔记草稿
 * GET  /api/notes — 笔记列表（分页游标，M2 扩展无限滚动）
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: { code: "UNCONFIGURED", message: "Supabase 未配置" } },
      { status: 503 }
    );
  }
  try {
    const body = await request.json().catch(() => null);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "请先登录" } }, { status: 401 });
    }
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: body?.title ?? "未命名笔记",
        subject: body?.subject ?? "未分类",
        content: body?.content ?? {},
        status: body?.status ?? "draft",
      })
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

export async function GET(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ data: { notes: [], nextCursor: null } });
  }
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const subject = searchParams.get("subject");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    const supabase = await createClient();
    let query = supabase
      .from("notes")
      .select("id, title, subject, folder_id, updated_at")
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (folderId) query = query.eq("folder_id", folderId);
    if (subject && subject !== "全部学科") query = query.eq("subject", subject);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: { code: "INTERNAL", message: error.message } }, { status: 500 });
    }
    return NextResponse.json({ data: { notes: data ?? [], nextCursor: null } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

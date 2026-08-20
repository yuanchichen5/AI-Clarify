import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** GET /api/folders — 目录树 */
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ data: { folders: [], nextCursor: null } });
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("folders")
      .select("id, name, color, parent_id, created_at")
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) {
      return NextResponse.json({ error: { code: "INTERNAL", message: error.message } }, { status: 500 });
    }
    return NextResponse.json({ data: { folders: data ?? [] } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

/** POST /api/folders — 新建目录 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: { code: "UNCONFIGURED", message: "Supabase 未配置" } }, { status: 503 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "目录名不能为空" } }, { status: 400 });
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "请先登录" } }, { status: 401 });
    }
    const { data, error } = await supabase
      .from("folders")
      .insert({
        user_id: user.id,
        name: body.name.trim().slice(0, 40),
        color: Math.min(Math.max(Number(body.color ?? 0), 0), 7),
        parent_id: body.parentId ?? null,
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

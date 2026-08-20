import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** GET /api/chat/conversations — 会话列表 */
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ data: { conversations: [], nextCursor: null } });
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) {
      return NextResponse.json({ error: { code: "INTERNAL", message: error.message } }, { status: 500 });
    }
    return NextResponse.json({ data: { conversations: data ?? [] } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

/** DELETE /api/chat/conversations — 清空历史 */
export async function DELETE() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: { code: "UNCONFIGURED", message: "Supabase 未配置" } }, { status: 503 });
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "请先登录" } }, { status: 401 });
    }
    await supabase.from("conversations").update({ is_deleted: true }).eq("user_id", user.id);
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

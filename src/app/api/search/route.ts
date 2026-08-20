import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** GET /api/search?keyword=&limit= — 关键词搜索（标题/学科/正文） */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get("keyword") ?? "").trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  if (!keyword) {
    return NextResponse.json({ data: { notes: [], nextCursor: null } });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ data: { notes: [], nextCursor: null } });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, subject, updated_at")
      .eq("is_deleted", false)
      .or(`title.ilike.%${keyword}%,subject.ilike.%${keyword}%`)
      .order("updated_at", { ascending: false })
      .limit(limit);
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

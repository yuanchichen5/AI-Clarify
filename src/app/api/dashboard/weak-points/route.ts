import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** GET /api/dashboard/weak-points?limit= — 薄弱知识点排序（错题数降序） */
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ data: { items: [] } });
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("is_correct, quiz_id")
      .eq("status", "answered")
      .eq("is_correct", false)
      .limit(100);
    if (error) {
      return NextResponse.json({ error: { code: "INTERNAL", message: error.message } }, { status: 500 });
    }
    // 演示版仅返回计数（完整知识点归因在真实环境联调）
    return NextResponse.json({ data: { items: (data ?? []).length } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

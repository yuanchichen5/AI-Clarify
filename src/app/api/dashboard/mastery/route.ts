import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** GET /api/dashboard/mastery?subject= — 知识掌握度（按学科聚合作答正确率） */
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ data: { overall: 0, segments: [] } });
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("is_correct, quizzes(knowledge_points(note_id, notes(subject)))")
      .eq("status", "answered")
      .limit(500);
    if (error) {
      return NextResponse.json({ error: { code: "INTERNAL", message: error.message } }, { status: 500 });
    }
    const answered = (data ?? []).filter((a) => a.is_correct !== null);
    const correct = answered.filter((a) => a.is_correct).length;
    const overall = answered.length ? Math.round((correct / answered.length) * 100) : 0;
    return NextResponse.json({ data: { overall, segments: [] } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

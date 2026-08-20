import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** GET /api/dashboard/trend?range=7d|30d|all&subject= — 学习趋势（笔记数/复习完成率） */
export async function GET(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ data: { points: [], summary: { notes: 0, rate: 0 } } });
  }
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30d";
    const subject = searchParams.get("subject");
    const days = range === "7d" ? 7 : range === "all" ? 90 : 30;

    const supabase = await createClient();
    let query = supabase
      .from("notes")
      .select("created_at, subject")
      .eq("is_deleted", false)
      .gte("created_at", new Date(Date.now() - days * 864e5).toISOString());
    if (subject && subject !== "全部学科") query = query.eq("subject", subject);
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: { code: "INTERNAL", message: error.message } }, { status: 500 });
    }

    // 按日聚合
    const byDay = new Map<string, number>();
    for (const n of data ?? []) {
      const day = (n.created_at as string).slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    const points = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, count]) => ({ day, count }));

    return NextResponse.json({
      data: { points, summary: { notes: (data ?? []).length, rate: 0 } },
    });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

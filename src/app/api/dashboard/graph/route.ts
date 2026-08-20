import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** GET /api/dashboard/graph?subject= — 知识图谱（知识点节点 + 关联边） */
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ data: { nodes: [], edges: [] } });
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("knowledge_points")
      .select("id, title, note_id, notes(subject)")
      .eq("is_deleted", false)
      .limit(200);
    if (error) {
      return NextResponse.json({ error: { code: "INTERNAL", message: error.message } }, { status: 500 });
    }
    const nodes = (data ?? []).map((k: { id: string; title: string; note_id: string }) => ({
      id: k.id,
      label: k.title,
      noteId: k.note_id,
    }));
    // 同笔记知识点间建边（同源共现）
    const byNote = new Map<string, string[]>();
    for (const k of data ?? []) {
      const arr = byNote.get((k as { note_id: string }).note_id) ?? [];
      arr.push((k as { id: string }).id);
      byNote.set((k as { note_id: string }).note_id, arr);
    }
    const edges: { source: string; target: string }[] = [];
    for (const ids of byNote.values()) {
      for (let i = 1; i < ids.length; i++) {
        edges.push({ source: ids[0], target: ids[i] });
      }
    }
    return NextResponse.json({ data: { nodes, edges } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

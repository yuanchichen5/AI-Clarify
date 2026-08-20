import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { llm } from "@/lib/llm/client";

/**
 * GET /api/search/semantic?query=&limit= — 语义检索（pgvector 余弦相似度）
 * 未配置 Supabase 或 embedding 失败 → 返回空 + 前端本地降级（标签/学科重叠评分）
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? "").trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? 8), 20);

  if (!query || !isSupabaseConfigured) {
    return NextResponse.json({ data: { notes: [], matched: 0 } });
  }

  try {
    const vec = await llm.embed(query.slice(0, 1000));
    if (!vec) {
      return NextResponse.json({ data: { notes: [], matched: 0, degraded: true } });
    }

    const supabase = await createClient();
    // 调用 RPC：需要 Supabase 端创建 match_notes 函数（迁移脚本 0002 提供）
    const { data, error } = await supabase.rpc("match_notes", {
      query_embedding: vec,
      match_count: limit,
    });
    if (error) {
      return NextResponse.json({ data: { notes: [], matched: 0, degraded: true } });
    }
    return NextResponse.json({
      data: {
        notes: (data ?? []).map((r: { note_id: string; title?: string; similarity: number }) => ({
          id: r.note_id,
          title: r.title ?? "",
          similarity: r.similarity,
        })),
        matched: (data ?? []).length,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

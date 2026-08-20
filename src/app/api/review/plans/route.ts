import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * POST /api/review/plans — 生成复习计划
 * 请求：{ type: "daily"|"weekly"|"exam", subject?, targetDate? }
 * Supabase 配置后从 knowledge_points 拉取真实知识点；未配置返回 503（前端演示模式生成）
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: { code: "UNCONFIGURED", message: "Supabase 未配置，前端使用本地演示计划" } },
      { status: 503 }
    );
  }
  try {
    const body = await request.json().catch(() => ({}));
    const type = body?.type;
    if (!["daily", "weekly", "exam"].includes(type)) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "type 仅支持 daily/weekly/exam" } }, { status: 400 });
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "请先登录" } }, { status: 401 });
    }

    // 拉取知识点（含所属笔记标题/学科）
    const { data: kps, error } = await supabase
      .from("knowledge_points")
      .select("id, title, definition, kind, note_id, notes(title, subject)")
      .eq("is_deleted", false)
      .order("order", { ascending: true })
      .limit(200);
    if (error) {
      return NextResponse.json({ error: { code: "INTERNAL", message: error.message } }, { status: 500 });
    }

    // Supabase 嵌入式关联可能推断为数组或对象，统一兼容
    const rawKps = (kps ?? []) as Array<{
      id: string;
      title: string;
      definition: string;
      kind: string;
      note_id: string;
      notes: { title: string; subject: string } | { title: string; subject: string }[] | null;
    }>;
    const items = rawKps
      .filter((k) => {
        const subj = Array.isArray(k.notes) ? k.notes[0]?.subject : k.notes?.subject;
        return !body.subject || body.subject === "全部学科" || subj === body.subject;
      })
      .map((k) => {
        const note = Array.isArray(k.notes) ? k.notes[0] : k.notes;
        return {
          kpId: k.id,
          noteId: k.note_id,
          title: k.title,
          definition: k.definition,
          kind: k.kind,
          noteTitle: note?.title ?? "",
          subject: note?.subject ?? "未分类",
        };
      });

    const { data: plan, error: planErr } = await supabase
      .from("review_plans")
      .insert({
        user_id: user.id,
        type,
        subject: body.subject ?? "全部",
        target_date: body.targetDate ?? null,
        items: items.slice(0, type === "daily" ? 5 : 50),
      })
      .select()
      .single();

    if (planErr) {
      return NextResponse.json({ error: { code: "INTERNAL", message: planErr.message } }, { status: 500 });
    }
    return NextResponse.json({ data: plan });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

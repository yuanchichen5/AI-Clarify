import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * POST /api/notes/batch — 批量操作（action: archive / move / export）
 * 请求：{ ids: string[], action: "archive" | "move", folderId?: string }
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: { code: "UNCONFIGURED", message: "Supabase 未配置" } }, { status: 503 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "ids 不能为空" } }, { status: 400 });
    }
    const action = body.action;
    if (action !== "archive" && action !== "move") {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "action 仅支持 archive / move" } }, { status: 400 });
    }

    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (action === "archive") patch.status = "archived";
    if (action === "move") {
      if (!body.folderId) {
        return NextResponse.json({ error: { code: "BAD_REQUEST", message: "move 需要 folderId" } }, { status: 400 });
      }
      patch.folder_id = body.folderId;
    }

    const { error } = await supabase
      .from("notes")
      .update(patch)
      .in("id", ids)
      .eq("is_deleted", false);
    if (error) {
      return NextResponse.json({ error: { code: "INTERNAL", message: error.message } }, { status: 500 });
    }
    return NextResponse.json({ data: { updated: ids.length } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

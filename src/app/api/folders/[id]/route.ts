import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** PATCH /api/folders/:id — 重命名 / 改色 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: { code: "UNCONFIGURED", message: "Supabase 未配置" } }, { status: 503 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 40);
    if (typeof body.color === "number") patch.color = Math.min(Math.max(body.color, 0), 7);
    const { data, error } = await supabase
      .from("folders")
      .update(patch)
      .eq("id", id)
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

/** DELETE /api/folders/:id — 软删除 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: { code: "UNCONFIGURED", message: "Supabase 未配置" } }, { status: 503 });
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("folders").update({ is_deleted: true }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: { code: "INTERNAL", message: error.message } }, { status: 500 });
    }
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "服务异常" } },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { genId } from "@/lib/utils";

/**
 * POST /api/upload — 生成预签名上传地址（Supabase Storage 直传）
 * 请求：{ fileName, fileType, size }
 * 响应：{ data: { uploadUrl, fileKey } }
 * Supabase 未配置时返回 503 UNCONFIGURED，前端自动切换演示模式（base64 直传 /api/parse）
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: { code: "UNCONFIGURED", message: "Supabase 未配置，请使用演示模式（base64 直传）" } },
      { status: 503 }
    );
  }

  try {
    const { fileName } = await request.json().catch(() => ({}));
    if (!fileName) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "缺少 fileName" } },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "请先登录" } },
        { status: 401 }
      );
    }

    const fileKey = `${user.id}/${genId()}/${fileName}`;
    const { data, error } = await supabase.storage
      .from("uploads")
      .createSignedUploadUrl(fileKey, { upsert: false });

    if (error) {
      return NextResponse.json(
        { error: { code: "INTERNAL", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { uploadUrl: data.signedUrl, fileKey: data.path },
    });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "上传服务异常" } },
      { status: 500 }
    );
  }
}

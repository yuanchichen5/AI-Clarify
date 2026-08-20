import { NextResponse } from "next/server";
import { createJob, runJob } from "@/lib/jobs/store";
import { extractFileText } from "@/lib/parser/extract";
import { runParse, runVisionParse } from "@/lib/parser/run";
import { bufferFile, takeFile } from "@/lib/server/upload-buffer";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { genId } from "@/lib/utils";

/**
 * POST /api/parse — 提交解析任务（异步）
 * 请求体：
 *   { mode, text?, subject?, fileKeys?: string[] }          ← Supabase 直传路径
 *   { mode, text?, subject?, files?: [{ name, mime, base64 }] } ← 演示模式路径
 * 响应：{ data: { jobId } }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.mode) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "缺少 mode 参数" } },
        { status: 400 }
      );
    }

    const jobId = createJob("parse");
    runJob(jobId, async () => {
      // 1. 还原文件（两种路径）
      const extracted: Awaited<ReturnType<typeof extractFileText>>[] = [];

      if (Array.isArray(body.files) && body.files.length) {
        for (const f of body.files) {
          const key = genId();
          bufferFile(key, f.name, f.mime ?? "application/octet-stream", f.base64 ?? "");
          const held = takeFile(key);
          if (!held) continue;
          extracted.push(await extractFileText(held.name, held.buf, held.mime));
        }
      }

      if (Array.isArray(body.fileKeys) && body.fileKeys.length) {
        for (const key of body.fileKeys) {
          const held = takeFile(key);
          if (!held) continue;
          extracted.push(await extractFileText(held.name, held.buf, held.mime));
        }
      }

      // 2. 图片走视觉解析，其余走统一编排
      const images = (body.files ?? []).filter(
        (f: { mime?: string }) => f.mime?.startsWith("image/")
      );

      if (images.length > 0) {
        const outcome = await runVisionParse(images);
        return outcome;
      }

      return await runParse({
        mode: body.mode,
        text: typeof body.text === "string" ? body.text : undefined,
        subject: typeof body.subject === "string" ? body.subject : undefined,
        files: extracted,
      });
    });

    return NextResponse.json({ data: { jobId } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: e instanceof Error ? e.message : "解析服务异常" } },
      { status: 500 }
    );
  }
}

/** GET /api/parse — 健康检查（前端判断可用性） */
export async function GET() {
  return NextResponse.json({
    data: {
      online: true,
      supabase: isSupabaseConfigured,
      mockAi: process.env.MOCK_AI === "true",
    },
  });
}

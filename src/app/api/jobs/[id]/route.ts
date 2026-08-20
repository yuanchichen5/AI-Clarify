import { NextResponse } from "next/server";
import { getJob, cleanupExpiredJobs } from "@/lib/jobs/store";

/**
 * GET /api/jobs/:jobId — 查询异步任务状态（每 2s 轮询，终态后停止）
 * 响应：{ data: { jobId, status, progress?, result?, error? } }
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  cleanupExpiredJobs();
  const job = getJob(id);
  if (!job) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "任务不存在或已过期" } },
      { status: 404 }
    );
  }
  return NextResponse.json({
    data: {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
    },
  });
}

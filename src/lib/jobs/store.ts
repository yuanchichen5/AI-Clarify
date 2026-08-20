import type { Job, JobStatus } from "@/types";
import { genId } from "@/lib/utils";

/**
 * 异步任务存储（开发规划文档 §5.5 异步长任务规范）
 * - Supabase 配置后迁移为 jobs 表存储；当前实现为进程内存 Map（单实例足够）
 * - 前端 POST 提交 → 拿 jobId → 每 2s 轮询 /api/jobs/:jobId → 终态停止
 */
interface StoredJob {
  id: string;
  userId: string;
  type: string;
  status: JobStatus;
  progress: { current: number; total: number } | null;
  result: unknown;
  error: string | null;
  createdAt: number;
}

const jobs = new Map<string, StoredJob>();
const TTL_MS = 30 * 60 * 1000; // 30 分钟自动清理

export function createJob(type: string, userId = "anonymous"): string {
  const id = "job_" + genId();
  jobs.set(id, {
    id,
    userId,
    type,
    status: "pending",
    progress: null,
    result: null,
    error: null,
    createdAt: Date.now(),
  });
  return id;
}

export function updateJob(
  id: string,
  patch: Partial<Pick<StoredJob, "status" | "progress" | "result" | "error">>
): StoredJob | null {
  const job = jobs.get(id);
  if (!job) return null;
  Object.assign(job, patch);
  return job;
}

export function getJob(id: string): Job | null {
  const job = jobs.get(id);
  if (!job) return null;
  return {
    id: job.id,
    userId: job.userId,
    type: job.type,
    status: job.status,
    progress: job.progress,
    result: job.result,
    error: job.error,
    createdAt: new Date(job.createdAt).toISOString(),
  };
}

export function runJob(id: string, task: () => Promise<unknown>): void {
  updateJob(id, { status: "running" });
  task()
    .then((result) => updateJob(id, { status: "done", result, progress: { current: 1, total: 1 } }))
    .catch((e) =>
      updateJob(id, {
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
      })
    );
}

/** TTL 清理（开发模式下由 /api/jobs 路由兜底调用） */
export function cleanupExpiredJobs(): void {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > TTL_MS) jobs.delete(id);
  }
}

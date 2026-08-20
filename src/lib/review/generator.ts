import type { ReviewPlanType } from "@/types";
import type { DemoNote } from "@/lib/store/demo-notes";

export interface PlanItem {
  kpId: string;
  noteId: string;
  title: string;
  definition: string;
  kind: "focus" | "difficulty" | "redun";
  noteTitle: string;
  subject: string;
}

/** 遗忘曲线参考间隔（天）：新学 → 1 → 3 → 7 → 15 → 30（演示排序权重） */
const INTERVALS = [1, 3, 7, 15, 30];

/** 简单哈希（稳定排序用） */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * 复习计划生成（M3-1）
 * - daily：每日复习 — 按遗忘曲线权重排序 + 薄弱项优先（kind=difficulty 权重高）
 * - weekly：周度复盘 — 全量知识点系统梳理
 * - exam：考前突击 — important 高频考点优先 + 全量覆盖
 */
export function generatePlan(
  notes: DemoNote[],
  type: ReviewPlanType,
  subject?: string
): PlanItem[] {
  const items: PlanItem[] = [];
  for (const note of notes) {
    if (subject && subject !== "全部学科" && note.subject !== subject) continue;
    for (const kp of note.kps) {
      items.push({
        kpId: note.id + ":" + kp.t,
        noteId: note.id,
        title: kp.t,
        definition: kp.d,
        kind: (kp.kinds[0] ?? "focus") as PlanItem["kind"],
        noteTitle: note.title,
        subject: note.subject,
      });
    }
  }

  // 排序
  items.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (type === "daily") {
      // 遗忘曲线：距离上次复习越久越靠前（演示用 hash 模拟"上次复习时间"）
      scoreA = hash(a.kpId) % 30;
      scoreB = hash(b.kpId) % 30;
      if (a.kind === "difficulty") scoreA += 8;
      if (b.kind === "difficulty") scoreB += 8;
      if (a.kind === "redun") scoreA -= 10;
      if (b.kind === "redun") scoreB -= 10;
    } else if (type === "exam") {
      // 考前：重点优先
      if (a.kind === "focus" && b.kind !== "focus") return -1;
      if (b.kind === "focus" && a.kind !== "focus") return 1;
      scoreA = hash(a.kpId) % 100;
      scoreB = hash(b.kpId) % 100;
    } else {
      // weekly：按学科分组后稳定顺序
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject, "zh");
      scoreA = hash(a.kpId) % 100;
      scoreB = hash(b.kpId) % 100;
    }
    return scoreB - scoreA;
  });

  // 每日复习限 5 条，其余全量
  return type === "daily" ? items.slice(0, 5) : items;
}

export { INTERVALS };

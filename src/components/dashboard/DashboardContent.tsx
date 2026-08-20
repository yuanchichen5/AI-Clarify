"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { loadDemoNotes } from "@/lib/store/demo-notes";
import { loadDemoAttempts } from "@/lib/store/demo-attempts";
import { cn } from "@/lib/utils";

type RangeKey = "7d" | "30d" | "all";

/**
 * 数据看板（设计文档 §四-5）· 单栏网格（PC 2 列 / 移动 1 列）
 * 学习趋势 / 知识掌握度 / 薄弱知识点 / 知识图谱，演示模式基于本地数据实时计算
 */
export function DashboardContent() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [subject, setSubject] = useState("全部学科");
  const [, force] = useState(0);

  // 数据加载
  useEffect(() => {
    force((v) => v + 1);
  }, []);

  const notes = useMemo(() => loadDemoNotes(), []);
  const attempts = useMemo(() => loadDemoAttempts(), []);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => set.add(n.subject));
    attempts.forEach((a) => set.add(a.subject));
    return ["全部学科", ...Array.from(set)];
  }, [notes, attempts]);

  const filteredNotes = useMemo(
    () => notes.filter((n) => subject === "全部学科" || n.subject === subject),
    [notes, subject]
  );
  const filteredAttempts = useMemo(
    () => attempts.filter((a) => subject === "全部学科" || a.subject === subject),
    [attempts, subject]
  );

  // ---- 学习趋势 ----
  const trend = useMemo(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const byDay = new Map<string, number>();
    const cutoff = Date.now() - days * 864e5;
    for (const n of filteredNotes) {
      if (n.archivedAt < cutoff) continue;
      const day = new Date(n.archivedAt).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    const points = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const max = Math.max(1, ...points.map(([, c]) => c));
    // 复习完成率：最近 7 天作答正确率
    const recent = filteredAttempts.filter((a) => a.lastAt > Date.now() - 7 * 864e5);
    const answered = recent.reduce((s, a) => s + a.correct + a.wrong, 0);
    const correct = recent.reduce((s, a) => s + a.correct, 0);
    const rate = answered ? Math.round((correct / answered) * 100) : 0;
    return { points, max, total: filteredNotes.length, rate, answered };
  }, [filteredNotes, filteredAttempts, range]);

  // ---- 掌握度 ----
  const mastery = useMemo(() => {
    const answered = filteredAttempts.reduce((s, a) => s + a.correct + a.wrong, 0);
    const correct = filteredAttempts.reduce((s, a) => s + a.correct, 0);
    const overall = answered ? Math.round((correct / answered) * 100) : 0;
    const mastered = filteredAttempts.filter((a) => a.wrong === 0).length;
    const reviewing = filteredAttempts.filter((a) => a.wrong > 0).length;
    return { overall, answered, mastered, reviewing };
  }, [filteredAttempts]);

  // ---- 薄弱知识点 ----
  const weakPoints = useMemo(
    () =>
      [...filteredAttempts]
        .filter((a) => a.wrong > 0)
        .sort((a, b) => b.wrong - a.wrong || b.correct - a.correct)
        .slice(0, 6),
    [filteredAttempts]
  );

  // ---- 知识图谱（同学科聚类） ----
  const graph = useMemo(() => {
    const nodes: { id: string; label: string; subject: string; noteId: string; weak: boolean }[] = [];
    const edges: { source: string; target: string }[] = [];
    const subjectGroups = new Map<string, string[]>();
    for (const n of filteredNotes) {
      const id = "note_" + n.id;
      nodes.push({ id, label: n.title, subject: n.subject, noteId: n.id, weak: false });
      const arr = subjectGroups.get(n.subject) ?? [];
      arr.push(id);
      subjectGroups.set(n.subject, arr);
    }
    for (const ids of subjectGroups.values()) {
      for (let i = 1; i < ids.length; i++) edges.push({ source: ids[0], target: ids[i] });
    }
    // 薄弱知识点节点（独立于笔记节点）
    const weakIds = new Set(weakPoints.map((w) => "kp_" + w.kpTitle));
    for (const w of weakPoints) {
      const id = "kp_" + w.kpTitle;
      nodes.push({ id, label: w.kpTitle, subject: w.subject, noteId: w.noteId, weak: true });
      edges.push({ source: "note_" + w.noteId, target: id });
    }
    void weakIds;
    return { nodes, edges };
  }, [filteredNotes, weakPoints]);

  const hasData = filteredNotes.length > 0 || filteredAttempts.length > 0;

  return (
    <div>
      {/* 顶部操作栏 */}
      <div className="flex flex-wrap items-center gap-3 pb-4">
        <h1 className="text-[28px] font-semibold tracking-tight">学习数据</h1>
        <span className="flex-1" />
        <div className="inline-flex overflow-hidden rounded-btn border border-border">
          {(["7d", "30d", "all"] as RangeKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={cn(
                "px-3.5 py-[7px] text-[13px] transition-colors",
                range === key ? "bg-primary-soft font-medium text-primary" : "text-ink-2"
              )}
            >
              {key === "7d" ? "7 日" : key === "30d" ? "30 日" : "全部"}
            </button>
          ))}
        </div>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-[34px] rounded-btn border border-border bg-card px-2.5 text-[13px] text-ink-1 outline-none"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {!hasData ? (
        <Card>
          <EmptyState icon="chart" title="暂无学习数据" description="归档笔记并完成一轮复习后，这里将展示趋势、掌握度与知识图谱。">
            <Button href="/ingest">
              <Icon name="upload" className="h-3.5 w-3.5" />
              去录入第一篇笔记
            </Button>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 学习趋势 */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold">学习趋势</h2>
            <TrendChart points={trend.points} max={trend.max} />
            <div className="mt-3 flex items-center justify-between text-xs text-ink-3">
              <span>
                累计归档 {trend.total} 篇{subject !== "全部学科" ? `（${subject}）` : ""}
              </span>
              <span>
                近 7 日复习完成率 <b className="text-ink-1">{trend.rate}%</b>
              </span>
            </div>
          </Card>

          {/* 知识掌握度 */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold">知识掌握度</h2>
            <div className="flex flex-col items-center py-4">
              <div className="relative flex h-[170px] w-[170px] items-center justify-center">
                <svg width="170" height="170" viewBox="0 0 170 170">
                  <circle cx="85" cy="85" r="68" fill="none" stroke="#E8E6F2" strokeWidth="13" />
                  <circle
                    cx="85"
                    cy="85"
                    r="68"
                    fill="none"
                    stroke="#3CC28A"
                    strokeWidth="13"
                    strokeLinecap="round"
                    strokeDasharray={`${(mastery.overall / 100) * 427.4} 427.4`}
                    transform="rotate(-90 85 85)"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-[26px] font-semibold text-ink-1">{mastery.overall}%</div>
                  <div className="text-xs text-ink-3">
                    {mastery.mastered} 已掌握 · {mastery.reviewing} 待复习
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-3">
                基于 {mastery.answered} 次作答 · 未作答题不计入
              </p>
            </div>
          </Card>

          {/* 薄弱知识点 */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold">薄弱知识点</h2>
            {weakPoints.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-3">
                暂无薄弱知识点 🎉 答错的题目会自动记录到这里
              </p>
            ) : (
              <div>
                {weakPoints.map((w, i) => (
                  <Link
                    key={w.kpTitle}
                    href={`/notes/${w.noteId}`}
                    className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
                  >
                    <span
                      className={cn(
                        "w-5 text-sm font-semibold",
                        i < 3 ? "text-error" : "text-ink-3"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm text-ink-1">{w.kpTitle}</span>
                    <span className="rounded-tag bg-error-soft px-2 py-0.5 text-xs text-error">
                      {w.wrong} 错
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* 知识图谱 */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold">知识图谱</h2>
            <GraphView nodes={graph.nodes} edges={graph.edges} />
          </Card>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-ink-3">
        演示模式数据来自本地笔记与复习作答记录 · 配置 Supabase 后由 /api/dashboard 提供云数据
      </p>
    </div>
  );
}

/** 趋势折线图（SVG） */
function TrendChart({ points, max }: { points: [string, number][]; max: number }) {
  const W = 440;
  const H = 170;
  const PAD = 14;
  if (points.length === 0) {
    return (
      <div className="flex h-[170px] items-center justify-center text-sm text-ink-3">
        该时间范围内暂无归档
      </div>
    );
  }
  const stepX = points.length > 1 ? (W - PAD * 2) / (points.length - 1) : 0;
  const coords = points.map(([, count], i) => ({
    x: PAD + i * stepX,
    y: H - PAD - (count / max) * (H - PAD * 2),
    count,
    day: points[i][0].slice(5),
  }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#E8E6F2" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#E8E6F2" />
        <polyline points={line} fill="none" stroke="#7C6AED" strokeWidth="2" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#7C6AED">
            <title>{`${c.day} · 新增 ${c.count} 篇`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-ink-3">
        <span>{coords[0]?.day ?? ""}</span>
        <span>{coords[coords.length - 1]?.day ?? ""}</span>
      </div>
    </div>
  );
}

/** 知识图谱（SVG：学科聚类 + 薄弱节点红色） */
function GraphView({
  nodes,
  edges,
}: {
  nodes: { id: string; label: string; subject: string; noteId: string; weak: boolean }[];
  edges: { source: string; target: string }[];
}) {
  const W = 420;
  const H = 240;
  if (nodes.length === 0) {
    return <div className="flex h-[200px] items-center justify-center text-sm text-ink-3">暂无节点</div>;
  }
  // 环形布局
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, i) => {
    const angle = (Math.PI * 2 * i) / nodes.length - Math.PI / 2;
    positions.set(n.id, {
      x: W / 2 + Math.cos(angle) * (W / 2 - 40),
      y: H / 2 + Math.sin(angle) * (H / 2 - 30),
    });
  });

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {edges.map((e, i) => {
          const s = positions.get(e.source);
          const t = positions.get(e.target);
          if (!s || !t) return null;
          return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#E8E6F2" strokeWidth="1.2" />;
        })}
        {nodes.map((n) => {
          const p = positions.get(n.id);
          if (!p) return null;
          return (
            <Link key={n.id} href={`/notes/${n.noteId}`}>
              <circle cx={p.x} cy={p.y} r={n.weak ? 8 : 6} fill={n.weak ? "#F87171" : "#7C6AED"} />
              <text
                x={p.x}
                y={p.y + 18}
                textAnchor="middle"
                fontSize="10"
                fill="#6B6A78"
                pointerEvents="none"
              >
                {n.label.length > 6 ? n.label.slice(0, 6) + "…" : n.label}
              </text>
            </Link>
          );
        })}
      </svg>
      {nodes.some((n) => n.weak) && (
        <div className="mt-1 flex items-center gap-4 text-[11px] text-ink-3">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />笔记</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-error" />薄弱知识点</span>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { KpKind } from "@/types";

export interface MindNode {
  id: string;
  label: string;
  kind: "root" | KpKind;
  parentId: string | null;
}

export interface MindMapCanvasProps {
  title: string;
  nodes: MindNode[];
  /** 编辑回调（双击改名 / 增删节点后触发） */
  onChange?: (nodes: MindNode[]) => void;
}

interface Position {
  x: number;
  y: number;
  w: number;
  h: number;
}

const KIND_COLOR: Record<string, string> = {
  root: "#7C6AED",
  focus: "#7C6AED",
  difficulty: "#F5A524",
  redun: "#A09FB0",
};

/**
 * 思维导图画布（设计文档 §四-1 思维导图视图 / §五 特殊交互）
 * - 滚轮缩放（以鼠标为中心）、空白处拖拽平移
 * - 单击选中、双击编辑文字、工具栏增删节点
 * - 节点样式：根节点紫底白字；子节点按 重点(紫)/难点(琥珀)/段子(灰) 描边
 */
export function MindMapCanvas({ title, nodes, onChange }: MindMapCanvasProps) {
  const W = 620;
  const H = 420;
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 布局：根节点居中，子节点沿椭圆扇形分布（最多两层的树）
  const layout = useMemo(() => {
    const pos = new Map<string, Position>();
    const root = nodes.find((n) => n.kind === "root") ?? { id: "root", label: title, kind: "root" as const, parentId: null };
    pos.set(root.id, { x: W / 2 - 60, y: H / 2 - 20, w: 120, h: 40 });
    const children = nodes.filter((n) => n.parentId === root.id);
    const N = Math.max(children.length, 1);
    children.forEach((child, i) => {
      const angle = Math.PI + (Math.PI * 2 * i) / N; // 从左侧开始环布
      const cx = W / 2 + Math.cos(angle) * 180;
      const cy = H / 2 + Math.sin(angle) * 130;
      pos.set(child.id, { x: cx - 60, y: cy - 20, w: 120, h: 40 });
      // 二层子节点（沿父节点方向再外扩）
      const grand = nodes.filter((n) => n.parentId === child.id);
      grand.forEach((g, j) => {
        const gx = cx + Math.cos(angle) * 110;
        const gy = cy + Math.sin(angle) * 90 + (j - (grand.length - 1) / 2) * 46;
        pos.set(g.id, { x: gx - 50, y: gy - 16, w: 100, h: 32 });
      });
    });
    return { pos, root };
  }, [nodes, title, W, H]);

  function center(id: string): { x: number; y: number } {
    const p = layout.pos.get(id);
    return p ? { x: p.x + p.w / 2, y: p.y + p.h / 2 } : { x: W / 2, y: H / 2 };
  }

  // ---- 视图变换 ----
  function applyView() {
    const stage = document.getElementById("mind-stage");
    if (stage) stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }
  useEffect(applyView, [tx, ty, scale]);

  function zoomAt(delta: number, clientX?: number, clientY?: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    const old = scale;
    const ns = Math.min(2.6, Math.max(0.4, scale + delta));
    if (rect && clientX != null && clientY != null) {
      const ax = clientX - rect.left;
      const ay = clientY - rect.top;
      const sx = (ax - tx) / old;
      const sy = (ay - ty) / old;
      setTx(ax - sx * ns);
      setTy(ay - sy * ns);
    }
    setScale(ns);
  }

  function resetView() {
    setScale(1);
    setTx(0);
    setTy(0);
  }

  // ---- 拖拽平移 ----
  function onMouseDown(e: React.MouseEvent) {
    const target = e.target as Element;
    if (target.closest(".mind-node")) {
      const g = target.closest(".mind-node");
      if (g) setSelectedId((g as HTMLElement).dataset.id ?? null);
      return;
    }
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
  }
  useEffect(() => {
    function move(e: MouseEvent) {
      if (!dragRef.current) return;
      setTx(dragRef.current.tx + (e.clientX - dragRef.current.x));
      setTy(dragRef.current.ty + (e.clientY - dragRef.current.y));
    }
    function up() {
      dragRef.current = null;
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  // ---- 节点编辑 ----
  function editNode(id: string) {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    const label = window.prompt("修改节点内容：", node.label);
    if (label && label.trim() && onChange) {
      onChange(nodes.map((n) => (n.id === id ? { ...n, label: label.trim() } : n)));
    }
  }

  function addChild() {
    const parent = nodes.find((n) => n.id === selectedId);
    if (!parent) {
      window.alert("请先点击选择一个父节点");
      return;
    }
    if (!onChange) return;
    const label = window.prompt("输入新子节点的内容：", "新知识点");
    if (!label || !label.trim()) return;
    onChange([
      ...nodes,
      { id: "mn_" + Math.random().toString(36).slice(2, 8), label: label.trim(), kind: "focus", parentId: parent.id },
    ]);
  }

  function removeSelected() {
    if (!selectedId || !onChange) return;
    const node = nodes.find((n) => n.id === selectedId);
    if (!node || node.kind === "root") {
      window.alert("根节点不可删除");
      return;
    }
    if (!window.confirm("确定删除该节点吗？")) return;
    onChange(nodes.filter((n) => n.id !== selectedId && n.parentId !== selectedId));
    setSelectedId(null);
  }

  // ---- 渲染 ----
  const edges = useMemo(() => {
    const list: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (const node of nodes) {
      if (!node.parentId) continue;
      const from = center(node.parentId);
      const to = center(node.id);
      list.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, layout]);

  return (
    <div>
      {/* 工具栏 */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-ink-3">
        <span>
          <b className="text-ink-2">空白处拖拽</b> 平移 · <b className="text-ink-2">滚轮</b> 缩放 ·{" "}
          <b className="text-ink-2">双击节点</b> 修改文字
        </span>
        <span className="flex-1" />
        <Button variant="ghost" size="sm" onClick={addChild}>
          ＋ 子节点
        </Button>
        <Button variant="ghost" size="sm" onClick={removeSelected}>
          删除节点
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => zoomAt(-0.15)} aria-label="缩小">
            −
          </Button>
          <Button variant="ghost" size="sm" onClick={resetView} title="重置视图">
            {Math.round(scale * 100)}%
          </Button>
          <Button variant="ghost" size="sm" onClick={() => zoomAt(0.15)} aria-label="放大">
            ＋
          </Button>
        </div>
      </div>

      {/* 画布 */}
      <div
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onWheel={(e) => {
          e.preventDefault();
          if (e.shiftKey) {
            setTx(tx - e.deltaY);
            return;
          }
          zoomAt(e.deltaY < 0 ? 0.12 : -0.12, e.clientX, e.clientY);
        }}
        className={cn(
          "relative cursor-grab select-none overflow-hidden rounded-card border border-border bg-card",
          "min-h-[420px]",
          dragRef.current && "cursor-grabbing"
        )}
        style={{ touchAction: "none" }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto block max-w-[620px]"
          style={{ width: "100%", height: "auto" }}
        >
          <g id="mind-stage" style={{ transformOrigin: "0 0" }}>
            {/* 连线 */}
            {edges.map((e, i) => (
              <line
                key={i}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke="#E8E6F2"
                strokeWidth={1.4}
              />
            ))}
            {/* 节点 */}
            {nodes.map((node) => {
              const p = layout.pos.get(node.id);
              if (!p) return null;
              const isRoot = node.kind === "root";
              const selected = selectedId === node.id;
              return (
                <g
                  key={node.id}
                  className="mind-node cursor-pointer"
                  data-id={node.id}
                  onDoubleClick={() => editNode(node.id)}
                >
                  <rect
                    x={p.x}
                    y={p.y}
                    width={p.w}
                    height={p.h}
                    rx={8}
                    fill={isRoot ? KIND_COLOR.root : "#FFFFFF"}
                    stroke={isRoot ? "none" : selected ? "#7C6AED" : KIND_COLOR[node.kind] ?? "#E8E6F2"}
                    strokeWidth={selected ? 2 : 1.5}
                  />
                  <text
                    x={p.x + p.w / 2}
                    y={p.y + p.h / 2 + 5}
                    textAnchor="middle"
                    fill={isRoot ? "#FFFFFF" : "#2B2A35"}
                    fontSize={isRoot ? 14 : 12.5}
                    fontWeight={isRoot ? 600 : 400}
                    pointerEvents="none"
                  >
                    {node.label.length > 8 ? node.label.slice(0, 8) + "…" : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

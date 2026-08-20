"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { MindMapCanvas, type MindNode } from "@/components/mindmap/MindMapCanvas";
import { KnowledgeCard } from "@/components/library/KnowledgeCard";
import { VersionHistory } from "@/components/library/VersionHistory";
import {
  loadDemoFolders,
  createDemoFolder,
  renameDemoFolder,
  recolorDemoFolder,
  deleteDemoFolder,
  type DemoFolder,
} from "@/lib/store/demo-folders";
import { loadDemoNotes, type DemoNote } from "@/lib/store/demo-notes";
import { cn } from "@/lib/utils";
import type { TagColor } from "@/types";

export interface ServerNote {
  id: string;
  title: string;
  subject: string;
  updatedAt: string;
}
export interface ServerFolder {
  id: string;
  name: string;
  color: number;
}

export interface LibraryContentProps {
  serverNotes: ServerNote[];
  serverFolders: ServerFolder[];
  supabaseConfigured: boolean;
  keyword?: string;
}

const FOLDER_COLORS: { id: TagColor; name: string; dot: string }[] = [
  { id: 0, name: "紫罗兰", dot: "bg-tag-0" },
  { id: 1, name: "天青", dot: "bg-tag-1" },
  { id: 2, name: "松绿", dot: "bg-tag-2" },
  { id: 3, name: "琥珀", dot: "bg-tag-3" },
  { id: 4, name: "樱粉", dot: "bg-tag-4" },
  { id: 5, name: "靛蓝", dot: "bg-tag-5" },
  { id: 6, name: "灰蓝", dot: "bg-tag-6" },
  { id: 7, name: "浅灰", dot: "bg-tag-7" },
];

const PAGE_SIZE = 6;

interface DisplayNote {
  id: string;
  title: string;
  subject: string;
  time: string;
  isDemo: boolean;
  demo?: DemoNote;
}

export function LibraryContent({
  serverNotes,
  supabaseConfigured,
  keyword = "",
}: LibraryContentProps) {
  const [demoNotes, setDemoNotes] = useState<DemoNote[]>([]);
  const [folders, setFolders] = useState<DemoFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"note" | "mindmap">("note");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState(keyword);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const [batchAction, setBatchAction] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDemoNotes(loadDemoNotes());
    setFolders(loadDemoFolders());
  }, []);

  // ---- 数据合并与排序 ----
  const allNotes: DisplayNote[] = useMemo(() => {
    const server: DisplayNote[] = serverNotes.map((n) => ({
      id: n.id,
      title: n.title,
      subject: n.subject,
      time: n.updatedAt,
      isDemo: false,
    }));
    const demo: DisplayNote[] = demoNotes.map((n) => ({
      id: n.id,
      title: n.title,
      subject: n.subject,
      time: n.time,
      isDemo: true,
      demo: n,
    }));
    return [...server, ...demo];
  }, [serverNotes, demoNotes]);

  const filtered = useMemo(() => {
    let list = allNotes;
    if (activeFolder !== "all") {
      const folder = folders.find((f) => f.id === activeFolder);
      list = list.filter((n) => (n.demo?.folder ?? "") === (folder?.name ?? activeFolder));
    }
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(kw) ||
          n.subject.toLowerCase().includes(kw) ||
          (n.demo?.kps ?? []).some((k) => k.t.toLowerCase().includes(kw) || k.d.toLowerCase().includes(kw))
      );
    }
    return list;
  }, [allNotes, activeFolder, folders, searchText]);

  /** 语义关联推荐（演示模式本地降级：学科 + 标签重叠评分） */
  const recommendations = useMemo(() => {
    if (!searchText.trim()) return [];
    const kw = searchText.trim().toLowerCase();
    const hits = allNotes.filter((n) => n.title.toLowerCase().includes(kw));
    if (hits.length === 0) return [];
    const hitSubjects = new Set(hits.map((h) => h.subject));
    return allNotes
      .filter((n) => !hits.some((h) => h.id === n.id) && hitSubjects.has(n.subject))
      .slice(0, 3);
  }, [allNotes, searchText]);

  const visibleNotes = filtered.slice(0, visible);

  // ---- 目录操作 ----
  function addFolder(parentId: string | null = null) {
    const name = window.prompt("新建目录名称：", "新目录");
    if (!name?.trim()) return;
    const color: TagColor = (folders.length % 8) as TagColor;
    const f = createDemoFolder(name.trim(), color, parentId);
    setFolders(loadDemoFolders());
    setActiveFolder(f.id);
  }
  function renameFolder(id: string) {
    const f = folders.find((x) => x.id === id);
    const name = window.prompt("重命名目录：", f?.name ?? "");
    if (!name?.trim()) return;
    renameDemoFolder(id, name.trim());
    setFolders(loadDemoFolders());
  }
  function recolorFolder(id: string, color: TagColor) {
    recolorDemoFolder(id, color);
    setFolders(loadDemoFolders());
    setColorPickerFor(null);
  }
  function removeFolder(id: string) {
    if (!window.confirm("删除目录？目录下的笔记将移回「我的笔记」")) return;
    deleteDemoFolder(id);
    setFolders(loadDemoFolders());
    setActiveFolder("all");
  }

  // ---- 笔记操作 ----
  const selectedNote: DisplayNote | null = useMemo(
    () => allNotes.find((n) => n.id === selectedId) ?? null,
    [allNotes, selectedId]
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function batchMove(folderName: string) {
    if (!selected.size) return;
    const list = loadDemoNotes().map((n) =>
      selected.has(n.id) ? { ...n, folder: folderName } : n
    );
    // 持久化
    try {
      localStorage.setItem("clarify:demo-notes", JSON.stringify(list));
    } catch {
      /* ignore */
    }
    setDemoNotes(loadDemoNotes());
    setSelected(new Set());
    setBatchAction(null);
  }

  function batchArchive() {
    // 演示模式：归档 = 保持现状（已在库中），仅清除选中态
    setSelected(new Set());
    setBatchAction(null);
  }

  // ---- 思维导图数据 ----
  const mindNodes: MindNode[] = useMemo(() => {
    const note = selectedNote?.demo;
    if (!note) return [];
    return [
      { id: "root", label: note.title, kind: "root", parentId: null },
      ...note.kps.map((k, i) => ({
        id: `kp_${i}`,
        label: k.t,
        kind: (k.kinds[0] ?? "focus") as MindNode["kind"],
        parentId: "root",
      })),
    ];
  }, [selectedNote]);

  function onMindChange(nodes: MindNode[]) {
    // 将导图编辑写回演示笔记（节点改名/增删）
    const note = selectedNote?.demo;
    if (!note) return;
    const kps = nodes
      .filter((n) => n.kind !== "root")
      .map((n) => ({
        t: n.label,
        d: note.kps.find((k) => k.t === n.label)?.d ?? "",
        kinds: [n.kind === "root" ? "focus" : n.kind] as ("focus" | "difficulty" | "redun")[],
      }));
    const updated = { ...note, kps };
    const list = loadDemoNotes().map((n) => (n.id === note.id ? updated : n));
    try {
      localStorage.setItem("clarify:demo-notes", JSON.stringify(list));
    } catch {
      /* ignore */
    }
    setDemoNotes(loadDemoNotes());
  }

  // ---- 渲染 ----
  return (
    <div className="flex items-start gap-6">
      {/* ===== 左侧边栏 280px（移动端抽屉） ===== */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-1/30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] shrink-0 flex-col gap-4 overflow-y-auto bg-bg px-4 py-4 transition-transform duration-200",
          "lg:static lg:z-auto lg:translate-x-0 lg:bg-transparent lg:px-0 lg:py-0",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Button href="/ingest" block>
          <Icon name="plus" className="h-3.5 w-3.5" />
          新建笔记
        </Button>

        <Card padded={false} className="p-3">
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <span className="text-xs text-ink-3">目录</span>
            <button
              onClick={() => addFolder(null)}
              className="flex h-5 w-5 items-center justify-center rounded text-ink-3 transition-colors hover:bg-primary-soft hover:text-primary"
              title="新建目录"
            >
              <Icon name="plus" className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* 我的笔记（根） */}
          <div className="group relative">
            <div
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-btn px-2 py-[7px] text-sm transition-colors",
                activeFolder === "all" ? "bg-primary-soft font-medium text-primary" : "text-ink-2 hover:bg-bg"
              )}
              onClick={() => setActiveFolder("all")}
            >
              <Icon name="folder" className="h-4 w-4" />
              我的笔记
              <span className="ml-auto text-xs text-ink-3">{allNotes.length}</span>
            </div>
            <div className="absolute right-1 top-1 hidden gap-0.5 group-hover:flex">
              <button
                onClick={() => addFolder(null)}
                className="flex h-6 w-6 items-center justify-center rounded text-ink-3 hover:bg-primary-soft hover:text-primary"
                title="新建子目录"
              >
                <Icon name="plus" className="h-3 w-3" />
              </button>
            </div>
          </div>
          {/* 自定义目录 */}
          {folders.map((f) => {
            const count = demoNotes.filter((n) => n.folder === f.name).length;
            return (
              <div key={f.id} className="group relative">
                <div
                  className={cn(
                    "ml-4 flex cursor-pointer items-center gap-2 rounded-btn border-l border-border px-2 py-[7px] text-sm transition-colors",
                    activeFolder === f.id ? "bg-primary-soft font-medium text-primary" : "text-ink-2 hover:bg-bg"
                  )}
                  onClick={() => setActiveFolder(f.id)}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", FOLDER_COLORS[f.color]?.dot ?? "bg-tag-0")} />
                  <span className="truncate">{f.name}</span>
                  <span className="ml-auto text-xs text-ink-3">{count}</span>
                </div>
                <div className="absolute right-1 top-1 hidden gap-0.5 group-hover:flex">
                  <button
                    onClick={() => setColorPickerFor(colorPickerFor === f.id ? null : f.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-ink-3 hover:bg-primary-soft hover:text-primary"
                    title="选择颜色"
                  >
                    <Icon name="settings" className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => renameFolder(f.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-ink-3 hover:bg-primary-soft hover:text-primary"
                    title="重命名"
                  >
                    <Icon name="edit" className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeFolder(f.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-ink-3 hover:bg-error-soft hover:text-error"
                    title="删除"
                  >
                    <Icon name="trash" className="h-3 w-3" />
                  </button>
                </div>
                {colorPickerFor === f.id && (
                  <div className="absolute left-10 top-8 z-20 flex items-center gap-1.5 rounded-modal border border-border bg-card p-2.5">
                    {FOLDER_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => recolorFolder(f.id, c.id)}
                        className={cn("h-5 w-5 rounded-full transition-transform hover:scale-110", c.dot)}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {folders.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-ink-3">暂无自定义目录，悬停「我的笔记」新建</p>
          )}
        </Card>

        {/* 笔记列表（无限滚动 + 骨架屏） */}
        <Card padded={false} className="p-3">
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <span className="text-xs text-ink-3">
              笔记列表 {selected.size > 0 && <b className="text-primary">· 已选 {selected.size}</b>}
            </span>
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-ink-3 hover:text-ink-1"
              >
                取消
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            {visibleNotes.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-center gap-1.5 rounded-btn px-1.5 py-2 transition-colors",
                  selectedId === n.id && !selected.size ? "bg-primary-soft" : "hover:bg-bg"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(n.id)}
                  onChange={() => toggleSelect(n.id)}
                  className="h-3.5 w-3.5 shrink-0 accent-primary"
                  title="多选"
                />
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    setSelectedId(n.id);
                    setViewMode("note");
                  }}
                >
                  <div className="truncate text-sm font-medium text-ink-1">{n.title}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-3">
                    <span className="text-tag-1">{n.subject}</span>
                    <span className="truncate">{n.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {visibleNotes.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-ink-3">没有匹配的笔记</p>
            )}
            {visible < filtered.length && (
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="w-full rounded-btn border border-dashed border-border-hover py-2 text-xs text-ink-3 transition-colors hover:border-primary hover:text-primary"
              >
                加载更多（{filtered.length - visible} 条待加载）
              </button>
            )}
            {visible < filtered.length && filtered.length > visible && (
              <div className="space-y-2 pt-1">
                <Skeleton className="h-10 w-full" />
              </div>
            )}
          </div>
        </Card>

        <Card padded={false} className="flex items-center gap-2.5 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-primary-soft text-sm font-semibold text-primary">
            李
          </span>
          <div>
            <div className="text-sm font-medium text-ink-1">李同学</div>
            <div className="text-xs text-ink-3">student@clarify.ai</div>
          </div>
        </Card>
      </aside>

      {/* ===== 右侧主内容区 ===== */}
      <div className="min-w-0 flex-1">
        {/* 面包屑 + 搜索 */}
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
          <span>
            我的笔记{" "}
            {activeFolder !== "all" && (
              <>
                / <b className="font-medium text-ink-2">{folders.find((f) => f.id === activeFolder)?.name ?? ""}</b>
              </>
            )}
          </span>
          <span className="flex-1" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索当前库（标题/知识点/学科）"
            className="h-8 w-52 rounded-btn border border-border bg-card px-3 text-[13px] text-ink-1 outline-none transition-colors placeholder:text-ink-3 focus:border-primary"
          />
        </div>

        {/* 工具栏 */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-btn border border-border bg-card text-ink-2 lg:hidden"
            aria-label="打开目录"
          >
            <Icon name="folder" className="h-4 w-4" />
          </button>
          <div className="inline-flex overflow-hidden rounded-btn border border-border">
            <button
              onClick={() => setViewMode("note")}
              className={cn(
                "px-3.5 py-[7px] text-[13px]",
                viewMode === "note" ? "bg-primary-soft font-medium text-primary" : "text-ink-2"
              )}
            >
              <Icon name="book" className="mr-1 h-4 w-4" />
              笔记视图
            </button>
            <button
              onClick={() => setViewMode("mindmap")}
              disabled={!selectedNote}
              className={cn(
                "px-3.5 py-[7px] text-[13px]",
                viewMode === "mindmap" ? "bg-primary-soft font-medium text-primary" : "text-ink-2",
                !selectedNote && "cursor-not-allowed opacity-40"
              )}
              title={selectedNote ? undefined : "请先选择一篇笔记"}
            >
              <Icon name="clipboard" className="mr-1 h-4 w-4" />
              思维导图
            </button>
          </div>
          <span className="flex-1" />
          {selected.size > 0 && (
            <div className="flex items-center gap-1.5 rounded-btn border border-primary bg-primary-soft px-2 py-1">
              <span className="text-xs font-medium text-primary">已选 {selected.size} 项</span>
              <button
                onClick={() => setBatchAction("move")}
                className="rounded-btn px-2 py-1 text-xs text-primary hover:bg-primary-soft/70"
              >
                移动
              </button>
              <button
                onClick={() => setBatchAction("archive")}
                className="rounded-btn px-2 py-1 text-xs text-primary hover:bg-primary-soft/70"
              >
                归档
              </button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setVersionsOpen(true)} title="查看版本历史">
            <Icon name="archive" className="h-3.5 w-3.5" />
            版本历史
          </Button>
        </div>

        {/* 搜索无结果 */}
        {searchText.trim() && filtered.length === 0 && (
          <Card className="mb-4">
            <EmptyState
              icon="search"
              title="未找到匹配的笔记"
              description="建议更换关键词，或尝试下方的关联推荐"
            />
          </Card>
        )}

        {/* 关联推荐 */}
        {recommendations.length > 0 && (
          <Card className="mb-4">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold">
              <Icon name="spark" className="h-4 w-4 text-primary" />
              关联笔记推荐（同学科）
            </h3>
            <div className="flex flex-wrap gap-2">
              {recommendations.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedId(r.id);
                    setSearchText("");
                  }}
                  className="rounded-btn border border-border bg-card px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:border-primary hover:text-primary"
                >
                  {r.title}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* 内容区 */}
        {!selectedNote ? (
          <Card>
            {allNotes.length === 0 ? (
              <EmptyState
                icon="book"
                title="开始你的第一份笔记"
                description="支持拍照、截图、文本、PPT、PDF、视频等 7 种方式录入，AI 自动提炼重点与难点。"
              >
                <Button href="/ingest?mode=camera">
                  <Icon name="camera" className="h-3.5 w-3.5" />
                  图片录入
                </Button>
                <Button href="/ingest?mode=text" variant="ghost">
                  <Icon name="text" className="h-3.5 w-3.5" />
                  文本录入
                </Button>
                <Button href="/ingest?mode=video" variant="ghost">
                  <Icon name="video" className="h-3.5 w-3.5" />
                  视频录入
                </Button>
              </EmptyState>
            ) : (
              <EmptyState
                icon="book"
                title="选择一篇笔记"
                description="从左侧列表选择笔记查看详情，或切换思维导图视图。"
              />
            )}
          </Card>
        ) : viewMode === "mindmap" ? (
          <Card>
            <MindMapCanvas
              title={selectedNote.title}
              nodes={mindNodes}
              onChange={selectedNote.isDemo ? onMindChange : undefined}
            />
            {!selectedNote.isDemo && (
              <p className="mt-3 text-center text-xs text-ink-3">
                服务端笔记的导图编辑将在 Supabase 配置后开放
              </p>
            )}
          </Card>
        ) : (
          <Card className="p-5">
            <div className="mb-1 flex items-start gap-3">
              <h2 className="flex-1 text-xl font-semibold">{selectedNote.title}</h2>
              <Button size="sm" href={`/notes/${selectedNote.id}`}>
                <Icon name="spark" className="h-3.5 w-3.5" />
                在详情页编辑
              </Button>
            </div>
            <div className="mb-4 flex items-center gap-2 text-xs text-ink-3">
              <span className="rounded-tag bg-primary-soft px-2 py-0.5 text-primary">{selectedNote.subject}</span>
              <span>{selectedNote.time}</span>
            </div>

            {selectedNote.demo ? (
              <>
                {/* 知识卡片列表（M2-5） */}
                <div className="space-y-2">
                  {(selectedNote.demo.kps ?? []).map((kp, i) => (
                    <KnowledgeCard
                      key={i}
                      name={kp.t}
                      definition={kp.d}
                      kind={kp.kinds[0] ?? "focus"}
                      linkedDifficulties={(selectedNote.demo?.diffs ?? []).map((d) => d.t).slice(0, 3)}
                      linkedNotes={allNotes.filter((n) => n.subject === selectedNote.subject).length - 1}
                    />
                  ))}
                </div>
                {selectedNote.demo.diffs.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-base font-semibold">难点标注</h3>
                    {selectedNote.demo.diffs.map((d, i) => (
                      <div key={i} className="mb-2 rounded-card border border-border border-l-[3px] border-l-warning bg-card p-3.5">
                        <div className="text-sm font-medium">{d.t}</div>
                        <div className="mt-1 text-[13px] text-ink-2">{d.d}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <EmptyState icon="book" title="服务端笔记" description="配置 Supabase 后展示完整内容" />
            )}
          </Card>
        )}

        {!supabaseConfigured && allNotes.length > 0 && (
          <p className="mt-3 text-center text-xs text-ink-3">
            当前为演示模式（本地存储）· 配置 Supabase 后可云同步与语义检索
          </p>
        )}
      </div>

      {/* 批量移动弹窗 */}
      {batchAction === "move" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-1/40 p-4" onClick={() => setBatchAction(null)}>
          <div className="w-full max-w-[340px] rounded-modal border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-[15px] font-semibold">移动 {selected.size} 篇笔记到</h2>
            <div className="space-y-1.5">
              <button onClick={() => batchMove("all")} className="flex w-full items-center gap-2 rounded-btn border border-border px-3 py-2 text-sm text-ink-2 hover:border-primary">
                <Icon name="folder" className="h-4 w-4 text-primary" /> 我的笔记
              </button>
              {folders.map((f) => (
                <button key={f.id} onClick={() => batchMove(f.name)} className="flex w-full items-center gap-2 rounded-btn border border-border px-3 py-2 text-sm text-ink-2 hover:border-primary">
                  <span className={cn("h-2.5 w-2.5 rounded-full", FOLDER_COLORS[f.color]?.dot)} />
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 批量归档确认 */}
      {batchAction === "archive" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-1/40 p-4" onClick={() => setBatchAction(null)}>
          <div className="w-full max-w-[340px] rounded-modal border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-[15px] font-semibold">归档 {selected.size} 篇笔记？</h2>
            <p className="mb-4 text-[13px] text-ink-2">演示模式下笔记保留在本地库中（云归档需 Supabase）。</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setBatchAction(null)}>取消</Button>
              <Button onClick={batchArchive}>确认归档</Button>
            </div>
          </div>
        </div>
      )}

      {/* 版本历史抽屉 */}
      <VersionHistory
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        versions={(selectedNote?.demo?.versions ?? []).map((v) => ({
          label: v.label,
          time: v.time,
          kpCount: v.kpCount,
        }))}
        onRestore={(idx) => {
          const note = selectedNote?.demo;
          const ver = note?.versions?.[idx];
          if (!note || !ver) return;
          const updated = { ...note, kps: ver.kps };
          const list = loadDemoNotes().map((n) => (n.id === note.id ? updated : n));
          try {
            localStorage.setItem("clarify:demo-notes", JSON.stringify(list));
          } catch {
            /* ignore */
          }
          setDemoNotes(loadDemoNotes());
          setVersionsOpen(false);
        }}
      />
    </div>
  );
}

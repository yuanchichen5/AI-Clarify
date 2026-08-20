"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { loadDemoNotes, type DemoNote } from "@/lib/store/demo-notes";

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
}

/** 知识库主页内容（服务端数据 + 演示模式本地数据合并渲染） */
export function LibraryContent({
  serverNotes,
  serverFolders,
  supabaseConfigured,
}: LibraryContentProps) {
  const [demoNotes, setDemoNotes] = useState<DemoNote[]>([]);

  useEffect(() => {
    setDemoNotes(loadDemoNotes());
  }, []);

  const hasDemo = demoNotes.length > 0;
  const total = serverNotes.length + demoNotes.length;

  return (
    <div className="flex items-start gap-6">
      {/* ===== 左侧边栏 280px ===== */}
      <aside className="flex w-[280px] shrink-0 flex-col gap-4">
        <Button href="/ingest" block>
          <Icon name="plus" className="h-3.5 w-3.5" />
          新建笔记
        </Button>

        <Card padded={false} className="p-3">
          <div className="px-2 pb-2 pt-1 text-xs text-ink-3">目录</div>
          <div className="flex cursor-pointer items-center gap-2 rounded-btn bg-primary-soft px-2 py-[7px] text-sm font-medium text-primary">
            <Icon name="folder" className="h-4 w-4" />
            我的笔记
            <span className="ml-auto text-xs text-ink-3">{total}</span>
          </div>
          {serverFolders.map((f) => (
            <div
              key={f.id}
              className="ml-4 flex cursor-pointer items-center gap-2 rounded-btn border-l border-border px-2 py-[7px] text-sm text-ink-2"
            >
              <Icon name="folder" className="h-3.5 w-3.5" />
              {f.name}
            </div>
          ))}
          {serverFolders.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-ink-3">暂无自定义目录</div>
          )}
        </Card>

        <Card padded={false} className="p-3">
          <div className="px-2 pb-2 pt-1 text-xs text-ink-3">笔记列表</div>
          {total === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-ink-3">暂无笔记</div>
          ) : (
            <>
              {serverNotes.map((n) => (
                <div key={n.id} className="rounded-btn px-2 py-2.5 hover:bg-bg">
                  <div className="text-sm font-medium text-ink-1">{n.title}</div>
                  <div className="mt-1 text-xs text-ink-3">
                    <span className="mr-2 text-tag-1">{n.subject}</span>
                    {n.updatedAt}
                  </div>
                </div>
              ))}
              {demoNotes.map((n) => (
                <Link
                  key={n.id}
                  href={`/notes/${n.id}`}
                  className="block rounded-btn px-2 py-2.5 hover:bg-bg"
                >
                  <div className="text-sm font-medium text-ink-1">{n.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-ink-3">
                    <span className="text-tag-1">{n.subject}</span>
                    <span>{n.time}</span>
                    {!supabaseConfigured && (
                      <span className="rounded-tag bg-warning-soft px-1.5 text-warning-ink">演示</span>
                    )}
                  </div>
                </Link>
              ))}
            </>
          )}
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
        <div className="mb-2 text-[13px] text-ink-3">
          我的笔记 / <b className="font-medium text-ink-2">全部</b>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-btn border border-border">
            <button className="bg-primary-soft px-3.5 py-[7px] text-[13px] font-medium text-primary">
              笔记视图
            </button>
            <button className="px-3.5 py-[7px] text-[13px] text-ink-2" disabled title="M2 里程碑开放">
              思维导图
            </button>
          </div>
          <span className="flex-1" />
          <Button variant="ghost" size="sm" disabled title="M4 里程碑开放">
            <Icon name="download" className="h-3.5 w-3.5" />
            导出
          </Button>
          <Button variant="ghost" size="sm" disabled title="M1 使用笔记编辑器内归档">
            <Icon name="archive" className="h-3.5 w-3.5" />
            归档
          </Button>
        </div>

        <Card>
          {total === 0 ? (
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
            <div className="divide-y divide-border">
              {serverNotes.map((n) => (
                <div key={n.id} className="flex items-center gap-3 p-4">
                  <Icon name="book" className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-1">{n.title}</div>
                    <div className="mt-0.5 text-xs text-ink-3">
                      {n.subject} · {n.updatedAt}
                    </div>
                  </div>
                </div>
              ))}
              {demoNotes.map((n) => (
                <Link key={n.id} href={`/notes/${n.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-bg">
                  <Icon name="book" className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-1">{n.title}</div>
                    <div className="mt-0.5 text-xs text-ink-3">
                      {n.subject} · {n.time} · {n.kps.length} 个知识点
                    </div>
                  </div>
                  <Icon name="chevron" className="h-4 w-4 rotate-[-90deg] text-ink-3" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {hasDemo && !supabaseConfigured && (
          <p className="mt-3 text-center text-xs text-ink-3">
            当前为演示模式（本地存储）· 配置 Supabase 后可云同步
          </p>
        )}
      </div>
    </div>
  );
}

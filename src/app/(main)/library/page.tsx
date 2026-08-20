import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { fetchLibraryOverview } from "@/lib/data/library";

/**
 * 笔记知识库主页（核心首页）· 双栏布局（设计文档 §三 / §四-1）
 * 左栏固定 280px：新建笔记 + 目录树 + 笔记列表 + 用户信息
 * 右栏：面包屑 + 工具栏 + 笔记视图/思维导图视图
 * M0 里程碑出口：登录后可见空知识库主页
 */
export default async function LibraryPage() {
  const { folders, notes } = await fetchLibraryOverview();

  return (
    <div className="flex items-start gap-6">
      {/* ===== 左侧边栏 280px ===== */}
      <aside className="flex w-[280px] shrink-0 flex-col gap-4">
        <Button href="/ingest" block size="md">
          <Icon name="plus" className="h-3.5 w-3.5" />
          新建笔记
          <Icon name="chevron" className="ml-auto h-3 w-3 rotate-180" />
        </Button>

        <Card padded={false} className="p-3">
          <div className="px-2 pb-2 pt-1 text-xs text-ink-3">目录</div>
          <div className="hoverable flex cursor-pointer items-center gap-2 rounded-btn bg-primary-soft px-2 py-[7px] text-sm font-medium text-primary">
            <Icon name="folder" className="h-4 w-4" />
            我的笔记
            <span className="ml-auto text-xs text-ink-3">{notes.length}</span>
          </div>
          {folders.map((f) => (
            <div
              key={f.id}
              className="hoverable ml-4 flex cursor-pointer items-center gap-2 rounded-btn border-l border-border pl-2 pr-1 py-[7px] text-sm text-ink-2 hover:text-ink-1"
            >
              <Icon name="folder" className="h-3.5 w-3.5" />
              {f.name}
            </div>
          ))}
          {folders.length === 0 && (
            <div className="px-2 py-2 text-xs text-ink-3">暂无目录（M2 里程碑开放创建）</div>
          )}
        </Card>

        <Card padded={false} className="p-3">
          <div className="px-2 pb-2 pt-1 text-xs text-ink-3">笔记列表</div>
          {notes.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-ink-3">暂无笔记</div>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                className="hoverable cursor-pointer rounded-btn px-2 py-2.5 hover:bg-bg"
              >
                <div className="text-sm font-medium text-ink-1">{n.title}</div>
                <div className="mt-1 text-xs text-ink-3">
                  <span className="mr-2 text-tag-1">{n.subject}</span>
                  {n.updatedAt}
                </div>
              </div>
            ))
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
              <Icon name="book" className="mr-1 h-4 w-4" />
              笔记视图
            </button>
            <button className="px-3.5 py-[7px] text-[13px] text-ink-2" title="M2 里程碑开放">
              思维导图
            </button>
          </div>
          <select
            className="h-[34px] rounded-btn border border-border bg-card px-2.5 text-[13px] text-ink-2 outline-none"
            disabled
            title="M2 里程碑开放"
          >
            <option>全部学科</option>
          </select>
          <span className="flex-1" />
          <Button variant="ghost" size="sm" disabled title="M4 里程碑开放">
            <Icon name="download" className="h-3.5 w-3.5" />
            导出
          </Button>
          <Button variant="ghost" size="sm" disabled title="M1 里程碑开放">
            <Icon name="archive" className="h-3.5 w-3.5" />
            归档
          </Button>
        </div>

        <Card>
          {notes.length === 0 ? (
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
            <div className="p-5">
              <h2 className="text-xl font-semibold">笔记列表</h2>
              <p className="mt-1 text-sm text-ink-2">
                共 {notes.length} 篇笔记（列表交互将在 M2 里程碑完善）
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

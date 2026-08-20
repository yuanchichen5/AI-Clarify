import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * 数据看板页（设计文档 §四-5）· 单栏网格（PC 2 列）
 * M0：卡片骨架 + 空状态；M4：趋势图 / 环形图 / 图谱 / 薄弱点接入
 */
export default function DashboardPage() {
  return (
    <div className="pt-6">
      <div className="flex items-center gap-4 pb-4">
        <h1 className="text-[28px] font-semibold tracking-tight">学习数据</h1>
        <span className="flex-1" />
        <div className="inline-flex overflow-hidden rounded-btn border border-border">
          {["7 日", "30 日", "全部"].map((label, i) => (
            <button
              key={label}
              className={
                i === 1
                  ? "bg-primary-soft px-3.5 py-[7px] text-[13px] font-medium text-primary"
                  : "px-3.5 py-[7px] text-[13px] text-ink-2"
              }
            >
              {label}
            </button>
          ))}
        </div>
        <select className="h-[34px] rounded-btn border border-border bg-card px-2.5 text-[13px] text-ink-2 outline-none">
          <option>全部学科</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        <Card>
          <h2 className="mb-4 text-xl font-semibold">学习趋势</h2>
          <div className="flex h-[200px] items-end gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1"
                style={{ height: `${30 + ((i * 37) % 60)}px` }}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-ink-3">
            M4 里程碑接入：新增笔记数 / 复习完成率折线图
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-semibold">知识掌握度</h2>
          <div className="flex items-center justify-center py-6">
            <div className="flex h-[160px] w-[160px] items-center justify-center rounded-full border-8 border-border">
              <div className="text-center">
                <div className="text-2xl font-semibold text-ink-3">—</div>
                <div className="text-xs text-ink-3">暂无数据</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-semibold">薄弱知识点</h2>
          <EmptyState
            icon="chart"
            title="暂无学习数据"
            description="完成笔记归档与复习后，这里会展示薄弱知识点排序。"
          />
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-semibold">知识图谱</h2>
          <EmptyState
            icon="book"
            title="暂无学习数据"
            description="归档笔记后，将在这里展示知识点节点与关联关系。"
          >
            <Button href="/ingest" variant="ghost" size="sm">
              去录入第一篇笔记
            </Button>
          </EmptyState>
        </Card>
      </div>
    </div>
  );
}

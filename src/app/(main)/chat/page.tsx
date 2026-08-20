import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

/**
 * AI 对话助手页（设计文档 §四-3）· 双栏布局
 * 左栏 260px：新建对话 + 历史会话 + 清空历史
 * 右栏：会话标题 + 消息流 + 输入区
 * M0：骨架 + 空状态；M3：流式对话接入
 */
export default function ChatPage() {
  return (
    <div className="flex items-start gap-6 pt-6">
      <aside className="flex w-[260px] shrink-0 flex-col gap-4">
        <Button block>
          <Icon name="plus" className="h-3.5 w-3.5" />
          新建对话
        </Button>
        <Card padded={false} className="p-3">
          <div className="px-2 pb-2 pt-1 text-xs text-ink-3">历史会话</div>
          <div className="px-2 py-3 text-center text-xs text-ink-3">
            暂无历史会话（M3 里程碑接入）
          </div>
        </Card>
        <Button variant="ghost" size="sm" disabled>
          清空历史
        </Button>
      </aside>

      <Card padded={false} className="flex min-h-[70vh] flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="text-base font-medium">新对话</div>
          <span className="flex-1" />
          <Button variant="soft" size="sm" disabled title="M3 里程碑接入">
            <Icon name="book" className="h-3.5 w-3.5" />
            整理为笔记
          </Button>
        </div>

        <div className="flex-1 px-5 py-4">
          <EmptyState
            icon="chat"
            title="开启一次新对话"
            description="向 AI 提问或要求整理笔记内容，优质回答可一键归档至知识库。"
          />
        </div>

        <div className="flex items-end gap-2.5 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" disabled aria-label="附件">
            <Icon name="paperclip" />
          </Button>
          <textarea
            rows={1}
            placeholder="输入问题，Ctrl+Enter 快捷发送..."
            className="max-h-[140px] min-h-11 flex-1 resize-y rounded-btn border border-border bg-card px-3 py-2.5 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-3 focus:border-primary"
          />
          <Button size="md" disabled>
            <Icon name="send" className="h-3.5 w-3.5" />
            发送
          </Button>
        </div>
      </Card>
    </div>
  );
}

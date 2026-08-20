"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    key: "getting-started",
    label: "快速上手",
    title: "快速上手",
    body: (
      <>
        <p>欢迎使用 Clarify，三步把课堂内容变成结构化笔记：</p>
        <h3>第一步：录入</h3>
        <p>点击右上角「新建笔记」，支持拍照、截图、文本、对话、PPT、PDF、视频七种方式。</p>
        <h3>第二步：AI 整理</h3>
        <p>
          AI 自动推断学科、提炼重点与难点、归纳考试重点，并生成思维导图。识别失败时可手动选择学科。
        </p>
        <h3>第三步：归档与复习</h3>
        <p>确认无误后归档，系统会自动生成复习计划与变体题，在数据看板查看学习趋势。</p>
      </>
    ),
  },
  {
    key: "ingest",
    label: "多模态录入",
    title: "多模态录入",
    body: (
      <>
        <p>Clarify 支持七种录入方式，进入「新建录入」页后通过顶部 Tab 切换。</p>
        <ul>
          <li>拍照 / 截图：用手机拍摄或粘贴截图，AI 自动识别文字与公式。</li>
          <li>文本 / 对话：直接粘贴课堂内容或导入聊天记录。</li>
          <li>PPT / PDF：上传课件，AI 提炼结构并标注重点。</li>
          <li>视频：上传讲课视频，选择「提取音频」或「提取文字」。</li>
        </ul>
        <h3>文件限制</h3>
        <p>图片 ≤ 10MB；PPT/PDF ≤ 50MB 且 ≤ 200 页；音视频 ≤ 500MB 且 ≤ 120 分钟。</p>
      </>
    ),
  },
  {
    key: "ai-notes",
    label: "AI 笔记整理",
    title: "AI 笔记整理",
    body: (
      <>
        <p>AI 会把口语化内容转为结构化知识，并自动区分「重点 / 难点 / 段子」三类条目。</p>
        <ul>
          <li>
            <b>重点</b>：紫色左边框，常考知识点。
          </li>
          <li>
            <b>难点</b>：琥珀色左边框，需要加强理解。
          </li>
          <li>
            <b>段子</b>：灰色左边框，默认折叠，按需展开。
          </li>
        </ul>
        <p>AI 识别学科失败时，会弹出「手动选择学科」下拉框兜底，生成内容可全量编辑后再归档。</p>
      </>
    ),
  },
  {
    key: "review",
    label: "复习计划",
    title: "复习计划",
    body: (
      <>
        <p>系统根据你的笔记与错题，自动生成每日、周度、考前三类复习计划。</p>
        <ul>
          <li>每日复习：10~15 分钟滚动回顾薄弱知识点。</li>
          <li>周度复盘：本周知识点系统梳理 + 变体题。</li>
          <li>考前突击：按考试日期倒推，优先高频考点。</li>
        </ul>
        <p>AI 会生成变体题并自动批改，答错的题可一键加入薄弱知识点。</p>
      </>
    ),
  },
  {
    key: "dashboard",
    label: "数据看板",
    title: "数据看板",
    body: (
      <>
        <p>在「学习数据」页可以查看：</p>
        <ul>
          <li>学习趋势折线图：新增笔记数与复习完成率。</li>
          <li>知识掌握度环形图：整体掌握比例。</li>
          <li>薄弱知识点：按错题数排序，点击可发起复习。</li>
          <li>知识图谱：知识点之间的关联关系。</li>
        </ul>
      </>
    ),
  },
  {
    key: "faq",
    label: "常见问题",
    title: "常见问题",
    body: (
      <>
        <h3>识别结果有误怎么办？</h3>
        <p>直接在笔记编辑区修改，所有 AI 生成内容均支持全量编辑。</p>
        <h3>上传失败是什么原因？</h3>
        <p>多为格式不支持或大小超限，请检查文件并重试。</p>
        <h3>如何导出笔记？</h3>
        <p>在知识库主页顶部点击「导出」，支持 PDF 与 Markdown 两种格式。</p>
      </>
    ),
  },
] as const;

/**
 * 帮助中心页（设计文档 §四-6）· 双栏布局
 * 左栏 220px：帮助文档分类导航；右栏：文档内容区
 */
export default function HelpPage() {
  const [active, setActive] = useState<string>("getting-started");
  const section = SECTIONS.find((s) => s.key === active) ?? SECTIONS[0];

  return (
    <div className="flex items-start gap-6 pt-6">
      <nav className="w-[220px] shrink-0 overflow-hidden rounded-card border border-border bg-card">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={cn(
              "block w-full border-b border-border px-4 py-3 text-left text-sm text-ink-2 transition-colors last:border-b-0 hover:bg-bg hover:text-ink-1",
              active === s.key &&
                "border-l-[3px] border-l-primary bg-primary-soft font-medium text-primary"
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1">
        <Card className="min-h-[480px]">
          <h2 className="mb-3 text-[22px] font-semibold">{section.title}</h2>
          <div className="space-y-3 text-sm leading-relaxed text-ink-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-ink-1 [&_ul]:ml-5 [&_ul]:list-disc [&_li]:my-1">
            {section.body}
          </div>
        </Card>
      </div>
    </div>
  );
}

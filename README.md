# Clarify · AI 智能笔记整理师

面向全体学习者的多模态 AI 笔记智能整理工具：拍照 / 截图 / 文本 / 对话 / PPT / PDF / 视频
七种方式录入，AI 自动提炼重点与难点，生成结构化笔记、思维导图与复习计划。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端框架 | Next.js 15（App Router）+ React 19 + TypeScript（strict） |
| 样式 | Tailwind CSS v4（CSS-first 主题，设计 Token 全覆盖） |
| 后端 | Next.js API Routes（M1 起） |
| 数据库 / 认证 / 存储 | Supabase（PostgreSQL + Auth + Storage + pgvector） |
| AI | Qwen3-Max / DeepSeek-V4-Flash / Qwen-VL（统一 OpenAI 兼容抽象，M1 起） |
| PDF 导出 | @react-pdf/renderer（M4） |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
#    编辑 .env.local，填入 Supabase URL 与 anon key

# 3. 数据库初始化
#    Supabase 控制台 → SQL Editor → 执行 supabase/migrations/0001_init.sql

# 4. 启动开发服务器
npm run dev
#    访问 http://localhost:3000（未配置 Supabase 时可直接浏览页面骨架）
```

## 目录结构

```text
clarify-app/
├── src/
│   ├── app/
│   │   ├── (auth)/            # 登录 / 注册
│   │   ├── (main)/
│   │   │   ├── library/       # 知识库主页（双栏 280px）
│   │   │   ├── ingest/        # 多模态录入（单栏 max-w-4xl）
│   │   │   ├── chat/          # AI 对话助手（双栏 260px）
│   │   │   ├── review/        # 复习中心（单栏 max-w-3xl）
│   │   │   ├── dashboard/     # 数据看板（单栏 2 列网格）
│   │   │   └── help/          # 帮助中心（双栏 220px）
│   │   └── api/               # API Routes（M1 起填充）
│   ├── components/
│   │   ├── ui/                # 基础 UI（Button/Card/Input/Skeleton/Tag/EmptyState/Icon）
│   │   └── layout/            # Header / Footer
│   ├── lib/
│   │   ├── supabase/          # 客户端封装（服务端 / 浏览器 / 中间件）
│   │   ├── data/              # 服务端数据层
│   │   └── llm/               # AI 统一抽象（M1）
│   └── types/                 # 全局类型定义
├── supabase/migrations/       # 数据库迁移（Schema + RLS + pgvector）
├── docs/                      # 需求 / 设计 / 规划 / 测试文档
└── .env.example
```

## 设计规范落地（M0）

- 设计 Token 位于 `src/app/globals.css`（Tailwind v4 `@theme`）：颜色 / 圆角 / 间距 / 字体，
  组件中零硬编码色值
- 无阴影设计：层级完全依靠 border + 留白区分
- 8px 栅格：间距语义 Token（xs/sm/md/lg/xl/2xl/3xl）
- 圆角四档：rounded-btn / rounded-card / rounded-tag / rounded-modal

## 里程碑进度

| 里程碑 | 状态 |
|---|---|
| M0 基础架构（骨架 + Token + Supabase + 认证） | ✅ 完成 |
| M1 核心闭环（录入 → 解析 → 笔记 → 归档） | ✅ 完成（演示模式可全链路走通） |
| M2 知识库与检索（目录 / 列表 / 语义检索 / 思维导图） | ✅ 完成（演示模式可用） |
| M3 复习与对话 | ✅ 完成（演示模式闭环可用） |
| M4 洞察与打磨（看板 / 导出 / 响应式 / 部署） | ✅ 完成（MVP 可演示） |


## 部署（M4-6 · Vercel + Supabase）

### Vercel 部署

```bash
# 方式一：Vercel CLI
npm i -g vercel
vercel            # 首次登录后自动识别 Next.js 项目
vercel --prod     # 生产部署

# 方式二：GitHub 集成
# Vercel 控制台 → New Project → Import 本仓库 → Framework: Next.js → Deploy
```

部署后在 Vercel 项目 Settings → Environment Variables 填入：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `DASHSCOPE_API_KEY` | 通义千问（Qwen3-Max / Qwen-VL） |
| `DEEPSEEK_API_KEY` | DeepSeek（降本模型） |
| `MOCK_AI` | 可选；`true` 时未配置密钥走演示解析 |

### Supabase 初始化清单

1. 创建项目 → SQL Editor 依次执行 `supabase/migrations/0001_init.sql`、`0002_search.sql`
2. Authentication → Providers 确认 Email 可用；可关闭邮件确认便于测试
3. Storage → 新建 `uploads` bucket（private）
4. Project Settings → API 复制 URL 与 anon key 到 `.env.local`
5. 免费项目 1 周无活动会暂停：配置 cron 定时唤醒（如 GitHub Actions 每 3 天 ping 一次首页）

### 生产注意事项

- Vercel Hobby 函数 10s 超时：长任务（音视频/多页文档）走异步 job + 轮询（已实现）
- 向量检索：`note_embeddings` HNSW 索引已建，单用户 <1 万条无压力
- 中文 PDF 导出依赖运行时加载 Noto Sans SC 字体，失败自动降级 Markdown

-- ============================================================
-- Clarify · M0-3 数据库初始化（Supabase / PostgreSQL + pgvector）
-- 对应开发规划文档 §4.2 核心数据模型
-- 执行方式：Supabase 控制台 → SQL Editor 粘贴执行，或 supabase db push
-- ============================================================

-- 0. 扩展
create extension if not exists "vector" with schema extensions;

-- ============================================================
-- 1. 用户资料（扩展 auth.users）
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. 目录（8 色标签）
-- ============================================================
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color smallint not null default 0 check (color between 0 and 7),
  parent_id uuid references public.folders (id) on delete cascade,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. 笔记（content 存结构化 JSON）
-- ============================================================
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid references public.folders (id) on delete set null,
  title text not null default '未命名笔记' check (char_length(title) between 1 and 100),
  subject text not null default '未分类',
  content jsonb not null default '{"knowledgePoints":[],"difficulties":[],"supplements":[],"important":false}'::jsonb,
  view_type text not null default 'note' check (view_type in ('note', 'mindmap')),
  status text not null default 'draft' check (status in ('draft', 'archived')),
  tags text[] not null default '{}',
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. 知识点（重点 / 难点 / 段子 三态）
-- ============================================================
create table if not exists public.knowledge_points (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  title text not null,
  definition text not null default '',
  kind text not null default 'focus' check (kind in ('focus', 'difficulty', 'redun')),
  kinds text[] not null default '{"focus"}',
  important boolean not null default false,
  "order" integer not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 难点标注区（独立于知识点，归并到 content 时亦可从本表还原）
create table if not exists public.difficulties (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  title text not null,
  summary text not null default '',
  suggestion text,
  "order" integer not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 5. 向量（pgvector，维度 1536）
-- ============================================================
create table if not exists public.note_embeddings (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  kp_id uuid references public.knowledge_points (id) on delete cascade,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. 复习计划 / 变体题 / 作答记录
-- ============================================================
create table if not exists public.review_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('daily', 'weekly', 'exam')),
  subject text not null default '全部',
  target_date date,
  items jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  kp_id uuid not null references public.knowledge_points (id) on delete cascade,
  question text not null,
  answer text not null,
  explanation text not null default '',
  variant jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_answer text not null default '',
  is_correct boolean,
  status text not null default 'answered' check (status in ('answered', 'skipped')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 7. 对话
-- ============================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '新对话',
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 8. 异步任务（长任务规范 §5.5）
-- ============================================================
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  progress jsonb,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 9. 索引（数据库规范 §5.3）
-- ============================================================
create index if not exists notes_user_updated_idx
  on public.notes (user_id, updated_at desc);
create index if not exists notes_user_deleted_idx
  on public.notes (user_id) where is_deleted = false;
create index if not exists folders_user_parent_idx
  on public.folders (user_id, parent_id);
create index if not exists kp_note_idx
  on public.knowledge_points (note_id);
create index if not exists diffs_note_idx
  on public.difficulties (note_id);
create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);
create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at);
create index if not exists attempts_user_idx
  on public.quiz_attempts (user_id);
create index if not exists attempts_quiz_idx
  on public.quiz_attempts (quiz_id);
create index if not exists quizzes_kp_idx
  on public.quizzes (kp_id);
create index if not exists jobs_user_idx
  on public.jobs (user_id, created_at desc);

-- HNSW 向量索引（cosine 距离）
create index if not exists note_embeddings_embedding_idx
  on public.note_embeddings using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- 10. updated_at 触发器
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists folders_set_updated_at on public.folders;
create trigger folders_set_updated_at before update on public.folders
  for each row execute function public.set_updated_at();
drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();
drop trigger if exists knowledge_points_set_updated_at on public.knowledge_points;
create trigger knowledge_points_set_updated_at before update on public.knowledge_points
  for each row execute function public.set_updated_at();
drop trigger if exists difficulties_set_updated_at on public.difficulties;
create trigger difficulties_set_updated_at before update on public.difficulties
  for each row execute function public.set_updated_at();
drop trigger if exists review_plans_set_updated_at on public.review_plans;
create trigger review_plans_set_updated_at before update on public.review_plans
  for each row execute function public.set_updated_at();
drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();
drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

-- ============================================================
-- 11. RLS 策略（数据库规范 §5.3：所有用户数据表强制 RLS）
--     策略统一基于 auth.uid() = user_id 隔离
-- ============================================================
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.notes enable row level security;
alter table public.knowledge_points enable row level security;
alter table public.difficulties enable row level security;
alter table public.note_embeddings enable row level security;
alter table public.review_plans enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.jobs enable row level security;

-- profiles：用户仅可读写自己的资料
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- folders / notes / knowledge_points / difficulties：按 user_id 隔离
create policy "folders_all_own" on public.folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_all_own" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "knowledge_points_all_own" on public.knowledge_points
  for all using (exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid()))
  with check (exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid()));
create policy "difficulties_all_own" on public.difficulties
  for all using (exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid()))
  with check (exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid()));
create policy "note_embeddings_all_own" on public.note_embeddings
  for all using (exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid()))
  with check (exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid()));

-- 复习 / 作答
create policy "review_plans_all_own" on public.review_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quiz_attempts_all_own" on public.quiz_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quizzes_read_own" on public.quizzes
  for select using (exists (select 1 from public.quiz_attempts a where a.quiz_id = quizzes.id and a.user_id = auth.uid())
                 or exists (select 1 from public.review_plans p, jsonb_array_elements(p.items) it
                            where p.user_id = auth.uid() and (it->>'quizId')::uuid = quizzes.id));

-- 对话
create policy "conversations_all_own" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "messages_all_own" on public.messages
  for all using (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));

-- 任务
create policy "jobs_all_own" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

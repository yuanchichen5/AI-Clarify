-- ============================================================
-- Clarify · M2 语义检索（pgvector match 函数 + 笔记分页游标辅助）
-- 执行方式：Supabase 控制台 → SQL Editor 粘贴执行
-- ============================================================

-- 语义检索：按 embedding 余弦相似度返回笔记
create or replace function public.match_notes(
  query_embedding vector(1536),
  match_count int default 8
)
returns table (
  note_id uuid,
  title text,
  similarity float
)
language sql
as $$
  select
    n.id as note_id,
    n.title as title,
    1 - (ne.embedding <=> query_embedding) as similarity
  from public.note_embeddings ne
  join public.notes n on n.id = ne.note_id
  where n.is_deleted = false
  order by ne.embedding <=> query_embedding
  limit match_count;
$$;

-- RLS：允许登录用户调用（结果受 notes 的 RLS 约束）
grant execute on function public.match_notes(vector(1536), int) to authenticated;

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface LibraryOverview {
  folders: { id: string; name: string; color: number; parentId: string | null }[];
  notes: { id: string; title: string; subject: string; updatedAt: string }[];
  configured: boolean;
  error?: boolean;
}

/**
 * 知识库首页概览数据（M0 骨架版）
 * - Supabase 未配置 / 查询失败 / 未登录 → 返回空数组，页面呈现空状态
 * - M2 里程碑将在此基础上升级为目录树 + 笔记列表 + 无限滚动
 */
export async function fetchLibraryOverview(): Promise<LibraryOverview> {
  if (!isSupabaseConfigured) {
    return { folders: [], notes: [], configured: false };
  }
  try {
    const supabase = await createClient();
    const [{ data: folders }, { data: notes }] = await Promise.all([
      supabase
        .from("folders")
        .select("id, name, color, parent_id")
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(50),
      supabase
        .from("notes")
        .select("id, title, subject, updated_at")
        .eq("is_deleted", false)
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);
    return {
      folders: (folders ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        color: f.color,
        parentId: f.parent_id,
      })),
      notes: (notes ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        subject: n.subject,
        updatedAt: n.updated_at,
      })),
      configured: true,
    };
  } catch {
    return { folders: [], notes: [], configured: true, error: true };
  }
}

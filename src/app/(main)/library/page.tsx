import { LibraryContent } from "@/components/library/LibraryContent";
import { fetchLibraryOverview } from "@/lib/data/library";

/** 笔记知识库主页（核心首页）· 双栏布局 */
export default async function LibraryPage() {
  const overview = await fetchLibraryOverview();
  return (
    <div className="pt-6">
      <LibraryContent
        serverNotes={overview.notes}
        serverFolders={overview.folders}
        supabaseConfigured={overview.configured}
      />
    </div>
  );
}

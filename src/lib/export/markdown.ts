import type { EditableKp } from "@/components/editor/KpEditorBlock";
import type { EditableDiff } from "@/components/editor/DiffEditorBlock";

export interface ExportNoteInput {
  title: string;
  subject: string;
  time?: string;
  tags?: string[];
  kps: EditableKp[];
  diffs: EditableDiff[];
  supps: string[];
}

/** Markdown 导出上限（PRD §5.7：单次超过 100,000 字符提示拆分导出） */
export const MARKDOWN_LIMIT = 100_000;

export function noteToMarkdown(note: ExportNoteInput): string {
  const lines: string[] = [];
  lines.push(`# ${note.title}`);
  lines.push("");
  lines.push(
    `> 学科：${note.subject}` +
      (note.time ? ` · 时间：${note.time}` : "") +
      (note.tags?.length ? ` · 标签：${note.tags.join(" / ")}` : "")
  );
  lines.push("");

  if (note.kps.length) {
    lines.push("## 重点知识点");
    lines.push("");
    for (const kp of note.kps) {
      const kinds = (kp.kinds ?? ["focus"])
        .map((k) => (k === "focus" ? "重点" : k === "difficulty" ? "难点" : "段子"))
        .join(" / ");
      lines.push(`- **${kp.t}**（${kinds}）`);
      if (kp.d) lines.push(`  ${kp.d}`);
      lines.push("");
    }
  }

  if (note.diffs.length) {
    lines.push("## 难点标注");
    lines.push("");
    for (const d of note.diffs) {
      lines.push(`- **${d.t}**`);
      if (d.d) lines.push(`  ${d.d}`);
      if (d.suggestion) lines.push(`  *突破建议：${d.suggestion}*`);
      lines.push("");
    }
  }

  if (note.supps.length) {
    lines.push("## 补充材料");
    lines.push("");
    for (const s of note.supps) {
      if (s.trim()) lines.push(`- ${s}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/** 下载文件 */
export function downloadText(content: string, filename: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

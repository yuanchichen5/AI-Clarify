"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MARKDOWN_LIMIT, downloadText, noteToMarkdown, type ExportNoteInput } from "@/lib/export/markdown";

export interface ExportNoteButtonProps {
  note: ExportNoteInput;
  variant?: "ghost" | "soft";
  size?: "sm" | "md";
  className?: string;
}

/**
 * 导出按钮（M4-2）
 * - Markdown：标准导出，>100,000 字符提示拆分
 * - PDF：@react-pdf/renderer 前端生成（注册 Noto Sans SC 中文字体），失败降级 Markdown
 */
export function ExportNoteButton({ note, variant = "ghost", size = "sm", className }: ExportNoteButtonProps) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  function exportMarkdown() {
    const md = noteToMarkdown(note);
    if (md.length > MARKDOWN_LIMIT) {
      window.alert(`内容超限（${md.length.toLocaleString()} 字符 > ${MARKDOWN_LIMIT.toLocaleString()}），请拆分导出。`);
      return;
    }
    downloadText(md, `${note.title || "笔记"}.md`, "text/markdown;charset=utf-8");
    setOpen(false);
  }

  async function exportPdf() {
    setBusy(true);
    setOpen(false);
    try {
      // 动态加载（仅导出时引入，保持主包轻量）
      const pdfPkg = await import("@react-pdf/renderer");
      const { Font, Document, Page, Text, View, StyleSheet, pdf } = pdfPkg;

      // 注册中文字体（失败则降级 Markdown）
      try {
        Font.register({
          family: "NotoSansSC",
          src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff2",
          fontWeight: 400,
        });
        Font.register({
          family: "NotoSansSC",
          src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-600-normal.woff2",
          fontWeight: 600,
        });
      } catch {
        /* 字体注册失败走下方降级 */
      }

      const styles = StyleSheet.create({
        page: { padding: 36, fontFamily: "NotoSansSC", fontSize: 11, lineHeight: 1.7, color: "#2B2A35" },
        title: { fontSize: 20, fontWeight: 600, color: "#7C6AED", marginBottom: 6 },
        meta: { fontSize: 9, color: "#A09FB0", marginBottom: 14 },
        h2: { fontSize: 14, fontWeight: 600, marginTop: 14, marginBottom: 6, color: "#2B2A35" },
        kp: { marginBottom: 6 },
        kpTitle: { fontWeight: 600, fontSize: 11 },
        kpBody: { color: "#6B6A78", marginTop: 2 },
        diff: { marginBottom: 6, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: "#F5A524" },
        li: { marginBottom: 3, color: "#6B6A78" },
      });

      const kindsOf = (kinds?: string[]) =>
        (kinds ?? ["focus"]).map((k) => (k === "focus" ? "重点" : k === "difficulty" ? "难点" : "段子")).join(" / ");

      const Doc = (
        <Document>
          <Page size="A4" style={styles.page}>
            <Text style={styles.title}>{note.title}</Text>
            <Text style={styles.meta}>
              学科：{note.subject}
              {note.time ? ` · 时间：${note.time}` : ""}
            </Text>

            {note.kps.length > 0 && (
              <>
                <Text style={styles.h2}>重点知识点</Text>
                {note.kps.map((kp, i) => (
                  <View key={i} style={styles.kp}>
                    <Text style={styles.kpTitle}>
                      [{kindsOf(kp.kinds)}] {kp.t}
                    </Text>
                    {kp.d ? <Text style={styles.kpBody}>{kp.d}</Text> : null}
                  </View>
                ))}
              </>
            )}

            {note.diffs.length > 0 && (
              <>
                <Text style={styles.h2}>难点标注</Text>
                {note.diffs.map((d, i) => (
                  <View key={i} style={styles.diff}>
                    <Text style={styles.kpTitle}>{d.t}</Text>
                    {d.d ? <Text style={styles.kpBody}>{d.d}</Text> : null}
                  </View>
                ))}
              </>
            )}

            {note.supps.filter(Boolean).length > 0 && (
              <>
                <Text style={styles.h2}>补充材料</Text>
                {note.supps
                  .filter(Boolean)
                  .map((s, i) => (
                    <Text key={i} style={styles.li}>
                      · {s}
                    </Text>
                  ))}
              </>
            )}
          </Page>
        </Document>
      );

      const blob = await pdf(Doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title || "笔记"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch {
      // 设计文档异常矩阵：PDF 生成失败 → 降级 Markdown 导出
      window.alert("PDF 生成失败（可能因字体加载），已降级为 Markdown 导出。");
      exportMarkdown();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={"relative " + (className ?? "")}>
      <Button variant={variant} size={size} onClick={() => setOpen((v) => !v)} disabled={busy} title="导出 PDF / Markdown">
        <Icon name="download" className="h-3.5 w-3.5" />
        {busy ? "导出中..." : "导出"}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-modal border border-border bg-card p-2 shadow-none">
            <button
              onClick={exportPdf}
              className="flex w-full items-center gap-2.5 rounded-btn px-3 py-2.5 text-left text-sm text-ink-1 transition-colors hover:bg-bg"
            >
              <Icon name="file" className="h-4 w-4 text-primary" />
              <span>
                PDF 文档
                <span className="block text-xs text-ink-3">适合打印分享，保留排版</span>
              </span>
            </button>
            <button
              onClick={exportMarkdown}
              className="flex w-full items-center gap-2.5 rounded-btn px-3 py-2.5 text-left text-sm text-ink-1 transition-colors hover:bg-bg"
            >
              <Icon name="text" className="h-4 w-4 text-primary" />
              <span>
                Markdown
                <span className="block text-xs text-ink-3">纯文本，方便二次编辑</span>
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

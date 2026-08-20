import { Buffer } from "buffer";

/**
 * 文件内容抽取（M1-8）
 * - PDF：pdf-parse 纯 JS 文本抽取
 * - PPTX：jszip 解包 → 遍历 slide XML 抽取文本
 * - 文本类：直接 utf-8 解码
 * 视觉逐页渲染解析（Qwen-VL 多页）作为后续增强，MVP 走文本路径
 */
export interface ExtractedFile {
  name: string;
  kind: "pdf" | "pptx" | "text" | "image" | "unknown";
  text: string;
  /** 图片/文档页数（供校验） */
  pageCount: number;
}

export function detectKind(name: string, mime?: string): ExtractedFile["kind"] {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".pptx") || lower.endsWith(".ppt")) return "pptx";
  if (mime?.startsWith("image/")) return "image";
  if (/\.(txt|md|markdown)$/.test(lower) || mime?.startsWith("text/")) return "text";
  return "unknown";
}

/** 校验规则（PRD §5.1 字段规则） */
export function validateFile(name: string, size: number, kind: string): string | null {
  if (kind === "image" && size > 10 * 1024 * 1024) return "图片大小超过 10MB 限制";
  if ((kind === "pdf" || kind === "pptx") && size > 50 * 1024 * 1024) return "文档大小超过 50MB 限制";
  if (kind === "unknown") return "不支持的文件格式";
  return null;
}

/** 读取 PDF 文本 */
async function extractPdfText(buf: Buffer): Promise<string> {
  try {
    // 动态 import 避免构建期打包 pdf-parse 的浏览器问题；类型声明与 CJS 运行时不一致，做窄化断言
    type PdfParseFn = (input: Buffer) => Promise<{ text?: string }>;
    const mod = (await import("pdf-parse")) as unknown as
      | PdfParseFn
      | { default?: PdfParseFn };
    const pdfParse: PdfParseFn =
      typeof mod === "function"
        ? mod
        : (mod.default ?? (async () => ({ text: "" })));
    const data = await pdfParse(buf as unknown as Buffer);
    return typeof data?.text === "string" ? data.text : "";
  } catch {
    return "";
  }
}

/** 读取 PPTX 文本（解包 slide XML） */
async function extractPptxText(buf: Buffer): Promise<string> {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buf as unknown as ArrayBuffer);
    const slideNames = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)/)?.[1] ?? "0", 10);
        const nb = parseInt(b.match(/slide(\d+)/)?.[1] ?? "0", 10);
        return na - nb;
      });
    const parts: string[] = [];
    for (const name of slideNames.slice(0, 200)) {
      const xml = await zip.files[name].async("string");
      // 抽取 <a:t> 文本节点
      const texts = Array.from(xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)).map((m) => m[1]);
      const slideText = texts.join(" ").trim();
      if (slideText) parts.push(slideText);
    }
    return parts.join("\n\n");
  } catch {
    return "";
  }
}

/** 统一抽取入口 */
export async function extractFileText(
  name: string,
  buf: Buffer,
  mime?: string
): Promise<ExtractedFile> {
  const kind = detectKind(name, mime);
  let text = "";
  const pageCount = 1;

  if (kind === "pdf") {
    text = await extractPdfText(buf);
  } else if (kind === "pptx") {
    text = await extractPptxText(buf);
  } else if (kind === "text") {
    text = buf.toString("utf-8");
  }

  return { name, kind, text, pageCount };
}

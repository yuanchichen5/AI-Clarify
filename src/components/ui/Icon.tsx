import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * 统一线框图标库（设计文档 §二：图标统一线框风格）
 * 导航图标 20px / 内容区 16px / 按钮内 14px —— 通过 size 或 className 控制
 */
const iconDefs: Record<string, { paths: ReactNode; sw: number }> = {
  search: {
    sw: 1.6,
    paths: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
      </>
    ),
  },
  plus: { sw: 1.8, paths: <path d="M12 5v14M5 12h14" strokeLinecap="round" /> },
  book: {
    sw: 1.6,
    paths: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    ),
  },
  folder: {
    sw: 1.6,
    paths: <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />,
  },
  chevron: {
    sw: 1.8,
    paths: <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />,
  },
  chat: {
    sw: 1.6,
    paths: <path d="M21 12a8 8 0 0 1-8 8H4l2-3.5A8 8 0 1 1 21 12z" strokeLinejoin="round" />,
  },
  clipboard: {
    sw: 1.6,
    paths: (
      <>
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M12 11h4M12 16h4" />
      </>
    ),
  },
  chart: {
    sw: 1.6,
    paths: (
      <>
        <path d="M4 20V4M4 20h16" strokeLinecap="round" />
        <path d="M9 16v-5M14 16V8M19 16v-3" strokeLinecap="round" />
      </>
    ),
  },
  user: {
    sw: 1.6,
    paths: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 12 0v1" />
      </>
    ),
  },
  download: {
    sw: 1.6,
    paths: <path d="M12 3v12M7 11l5 5 5-5M4 21h16" strokeLinecap="round" strokeLinejoin="round" />,
  },
  archive: {
    sw: 1.6,
    paths: (
      <>
        <path d="M3 7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2H3V7zM4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9z" />
        <path d="M10 13h4" strokeLinecap="round" />
      </>
    ),
  },
  upload: {
    sw: 1.6,
    paths: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" strokeLinecap="round" strokeLinejoin="round" />,
  },
  paperclip: {
    sw: 1.6,
    paths: (
      <path d="M21 11.5L12.5 20a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5L11 18" strokeLinecap="round" />
    ),
  },
  send: {
    sw: 1.6,
    paths: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinejoin="round" />,
  },
  check: {
    sw: 1.8,
    paths: <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />,
  },
  x: { sw: 1.8, paths: <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /> },
  camera: {
    sw: 1.6,
    paths: (
      <>
        <path d="M3 8a1 1 0 0 1 1-1h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8z" />
        <circle cx="12" cy="12" r="3.5" />
      </>
    ),
  },
  image: {
    sw: 1.6,
    paths: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" fill="currentColor" stroke="none" />
        <path d="M21 16l-5-5-9 9" />
      </>
    ),
  },
  text: { sw: 1.6, paths: <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" /> },
  mic: {
    sw: 1.6,
    paths: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
      </>
    ),
  },
  slides: {
    sw: 1.6,
    paths: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M10 21h4" strokeLinecap="round" />
      </>
    ),
  },
  file: {
    sw: 1.6,
    paths: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
        <path d="M14 3v5h5" />
      </>
    ),
  },
  video: {
    sw: 1.6,
    paths: (
      <>
        <rect x="3" y="5" width="13" height="14" rx="2" />
        <path d="M16 10l5-3v10l-5-3" />
      </>
    ),
  },
  help: {
    sw: 1.6,
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01" strokeLinecap="round" />
      </>
    ),
  },
  spark: {
    sw: 0,
    paths: (
      <>
        <path
          d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
          fill="currentColor"
        />
        <path
          d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"
          fill="currentColor"
        />
      </>
    ),
  },
  "arrow-left": {
    sw: 1.8,
    paths: <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />,
  },
  eye: {
    sw: 1.6,
    paths: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  "eye-off": {
    sw: 1.6,
    paths: (
      <path
        d="M3 3l18 18M10.6 6.1A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.2 3.8M6.2 6.2C3.4 8 2 12 2 12s3.5 7 10 7c1.6 0 3-.3 4.2-.8"
        strokeLinecap="round"
      />
    ),
  },
  mail: {
    sw: 1.6,
    paths: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  settings: {
    sw: 1.5,
    paths: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </>
    ),
  },
  edit: {
    sw: 1.6,
    paths: (
      <>
        <path d="M12 20h9" strokeLinecap="round" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" strokeLinejoin="round" />
      </>
    ),
  },
  trash: {
    sw: 1.6,
    paths: (
      <>
        <path
          d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
};

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: keyof typeof iconDefs | string;
  /** 显式像素尺寸（默认 16px 由 className 控制） */
  size?: number;
}

export function Icon({ name, size, className, ...rest }: IconProps) {
  const def = iconDefs[name];
  if (!def) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={def.sw || 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
      {...rest}
    >
      {def.paths}
    </svg>
  );
}

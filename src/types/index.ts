/**
 * Clarify 全局类型定义（开发规划文档 §4.2 核心数据模型契约前置）
 * 与 Supabase 表结构一一对应，字段统一 snake_case 映射为 camelCase 视图类型
 */

/* ---- 通用 ---- */
export type ID = string;

export interface ApiOk<T> {
  data: T;
}
export interface ApiErr {
  error: { code: string; message: string };
}
export type ApiResult<T> = ApiOk<T> | ApiErr;

/** 分页响应（游标分页） */
export interface PageResult<T> {
  data: T[];
  nextCursor: string | null;
}

/* ---- 目录与笔记 ---- */
export type TagColor = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Folder {
  id: ID;
  userId: ID;
  name: string;
  color: TagColor;
  parentId: ID | null;
  noteCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type KpKind = "focus" | "difficulty" | "redun";

export interface KnowledgePoint {
  id: ID;
  noteId: ID;
  title: string;
  definition: string;
  /** 内容属性：重点 / 难点 / 段子（可多选，首项为渲染主类型） */
  kinds: KpKind[];
  important: boolean;
  order: number;
  createdAt: string;
}

export interface DifficultyItem {
  id: ID;
  noteId: ID;
  title: string;
  summary: string;
  suggestion?: string;
  order: number;
}

export type NoteStatus = "draft" | "archived";
export type NoteViewType = "note" | "mindmap";

export interface Note {
  id: ID;
  userId: ID;
  folderId: ID | null;
  title: string;
  subject: string;
  /** 结构化内容：知识分层列表 / 难点标注区 / 补充材料区（JSON） */
  content: NoteContent;
  viewType: NoteViewType;
  status: NoteStatus;
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  /** 关联数据（列表接口附带） */
  knowledgePoints?: KnowledgePoint[];
  difficulties?: DifficultyItem[];
}

export interface NoteContent {
  title?: string;
  subject?: string;
  /** 知识点分层列表 */
  knowledgePoints: KnowledgePoint[];
  /** 难点标注区 */
  difficulties: DifficultyItem[];
  /** 补充材料区 */
  supplements: string[];
  /** 考试重点标记 */
  important: boolean;
}

/* ---- 复习 ---- */
export type ReviewPlanType = "daily" | "weekly" | "exam";

export interface ReviewPlan {
  id: ID;
  userId: ID;
  type: ReviewPlanType;
  subject: string;
  targetDate: string | null;
  /** 计划条目：按遗忘曲线排序的知识点清单 */
  items: { kpId: ID; noteId: ID; order: number; dueAt: string }[];
  status: "active" | "done";
  createdAt: string;
}

export interface Quiz {
  id: ID;
  kpId: ID;
  question: string;
  answer: string;
  explanation: string;
  variant: { original: string; variant: string } | null;
  createdAt: string;
}

export type AttemptStatus = "answered" | "skipped";

export interface QuizAttempt {
  id: ID;
  quizId: ID;
  userAnswer: string;
  isCorrect: boolean;
  status: AttemptStatus;
  createdAt: string;
}

/* ---- 对话 ---- */
export interface Conversation {
  id: ID;
  userId: ID;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export type MessageRole = "user" | "assistant";

export interface Message {
  id: ID;
  conversationId: ID;
  role: MessageRole;
  content: string;
  createdAt: string;
}

/* ---- 异步任务 ---- */
export type JobStatus = "pending" | "running" | "done" | "failed";

export interface Job {
  id: ID;
  userId: ID;
  type: string;
  status: JobStatus;
  progress: { current: number; total: number } | null;
  result: unknown;
  error: string | null;
  createdAt: string;
}

/* ---- 录入方式（PRD §5.1 七种） ---- */
export type IngestMode = "camera" | "screenshot" | "text" | "chatlog" | "ppt" | "pdf" | "video";

/* ---- AI 解析结果（契约示例 4.4） ---- */
export interface ParseResult {
  subject: string;
  confidence: number;
  knowledgePoints: { title: string; kind: KpKind; summary: string }[];
  difficulties: { title: string; summary: string; suggestion?: string }[];
}

/* ---- 学科树 ---- */
export interface SubjectTree {
  [subject: string]: string[];
}

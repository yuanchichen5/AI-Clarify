"use client";

import { ReviewFlow } from "@/components/review/ReviewFlow";

/** 复习中心页（设计文档 §四-4）· 单栏流程式 max-w-3xl（三阶段） */
export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-[720px] pt-6">
      <div className="pb-4">
        <h1 className="text-[28px] font-semibold tracking-tight">复习中心</h1>
      </div>
      <ReviewFlow />
    </div>
  );
}

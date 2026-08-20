"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

/** 全局错误边界（M4-3：异常兜底，渲染失败不白屏） */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Clarify ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="mx-auto max-w-md px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-ink-1">页面渲染出错了</h2>
            <p className="mt-2 text-sm text-ink-2">
              {this.state.message || "发生未知错误"}，请刷新页面重试。
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, message: "" });
                window.location.reload();
              }}
              className="mt-5 rounded-btn bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover"
            >
              刷新页面
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

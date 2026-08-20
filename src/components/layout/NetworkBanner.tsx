"use client";

import { useEffect, useState } from "react";

/**
 * 网络断连横幅（设计文档 §七 错误提示：网络断开顶部红色固定提示条，恢复后自动消失）
 */
export function NetworkBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const on = () => setOffline(true);
    const off = () => setOffline(false);
    window.addEventListener("offline", on);
    window.addEventListener("online", off);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("offline", on);
      window.removeEventListener("online", off);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="fixed left-0 right-0 top-0 z-[100] bg-error px-4 py-2 text-center text-[13px] font-medium text-white">
      网络连接已断开，请检查网络
    </div>
  );
}

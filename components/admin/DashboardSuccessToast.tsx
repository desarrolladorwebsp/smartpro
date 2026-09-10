"use client";

import { useEffect } from "react";

type DashboardSuccessToastProps = {
  message: string;
  onDismiss: () => void;
};

export function DashboardSuccessToast({ message, onDismiss }: DashboardSuccessToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timeout);
  }, [message, onDismiss]);

  return (
    <div
      className="fixed right-4 bottom-4 z-[70] max-w-sm rounded-[20px] border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-800 shadow-[0_18px_46px_rgba(16,16,36,0.16)] sm:right-6 sm:bottom-6"
      role="status"
    >
      {message}
    </div>
  );
}

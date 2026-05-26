"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const ToastContext = React.createContext<{
  toast: (opts: { title: string; description?: string; variant?: "success" | "error" }) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<
    Array<{ id: string; title: string; description?: string; variant?: string }>
  >([]);

  const toast = React.useCallback(
    ({
      title,
      description,
      variant = "success",
    }: {
      title: string;
      description?: string;
      variant?: "success" | "error";
    }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-lg border px-4 py-3 shadow-lg text-sm animate-in slide-in-from-right",
              t.variant === "error"
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-white border-gray-200 text-gray-900"
            )}
          >
            <div className="font-medium">{t.title}</div>
            {t.description && (
              <div className="text-gray-500 mt-0.5">{t.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

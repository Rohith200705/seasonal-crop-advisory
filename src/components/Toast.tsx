"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type Ctx = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<Ctx>({ toast: () => {} });

const ICONS: Record<ToastKind, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

const COLORS: Record<ToastKind, string> = {
  success: "border-brand-400 text-brand-700",
  error: "border-red-400 text-red-700",
  info: "border-sky-400 text-sky-700",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-20 z-[80] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex items-start gap-2.5 rounded-xl border-l-4 bg-white px-4 py-3 text-sm font-semibold shadow-[0_8px_24px_rgba(20,35,26,0.14)] ${COLORS[t.kind]}`}
            role="status"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                t.kind === "success"
                  ? "bg-brand-500"
                  : t.kind === "error"
                    ? "bg-red-500"
                    : "bg-sky-500"
              }`}
            >
              {ICONS[t.kind]}
            </span>
            <span className="leading-snug text-ink/85">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

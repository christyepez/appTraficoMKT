"use client";

import { ToastType } from "./lib";
import { useEffect, useState } from "react";

export function ToastViewport() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    let lastToastId = 0;
    let timer: number | undefined;
    const show = (detail: { id?: number; message: string; type: ToastType }) => {
      const id = detail.id ?? Date.now();
      if (id === lastToastId) return;
      lastToastId = id;
      setToast({ message: detail.message, type: detail.type });
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setToast(null), 4200);
    };
    const stored = window.localStorage.getItem("requirements-last-toast");
    if (stored) {
      try {
        const detail = JSON.parse(stored) as { id?: number; message: string; type: ToastType };
        if (Date.now() - Number(detail.id ?? 0) < 8000) show(detail);
      } catch {
        window.localStorage.removeItem("requirements-last-toast");
      }
    }
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: number; message: string; type: ToastType }>).detail;
      show(detail);
    };
    window.addEventListener("app-toast", handler);
    return () => {
      window.removeEventListener("app-toast", handler);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return toast ? <div className={`toast ${toast.type}`}>{toast.message}</div> : null;
}

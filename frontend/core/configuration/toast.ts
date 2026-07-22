export type ToastType = "success" | "error" | "info";
const toastStorageKey = "requirements-last-toast";

export function showToast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  const detail = { id: Date.now(), message, type };
  window.localStorage.setItem(toastStorageKey, JSON.stringify(detail));
  window.dispatchEvent(new CustomEvent("app-toast", { detail }));
}

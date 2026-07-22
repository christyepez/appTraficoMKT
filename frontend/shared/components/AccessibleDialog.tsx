"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useRef } from "react";

type AccessibleDialogProps = {
  labelledBy: string;
  children: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  backdropClassName?: string;
  panelClassName?: string;
};

export function AccessibleDialog({ labelledBy, children, onClose, closeDisabled = false, backdropClassName = "", panelClassName = "" }: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    focusableElements(dialogRef.current)[0]?.focus();
    return () => previousFocus?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !closeDisabled) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusableElements(dialogRef.current);
    if (items.length === 0) return event.preventDefault();
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div ref={dialogRef} className={`modal-backdrop ${backdropClassName}`.trim()} role="dialog" aria-modal="true" aria-labelledby={labelledBy} onKeyDown={handleKeyDown}>
      <section className={`modal-panel ${panelClassName}`.trim()}>{children}</section>
    </div>
  );
}

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])')).filter((item) => !item.hasAttribute("hidden"));
}

"use client";

import { AuditWorkspace } from "../../features/audit/components/AuditWorkspace";
import { useAuditLog } from "../../features/audit/hooks/useAuditLog";
import { AppNav } from "../nav";

export default function AuditPage() {
  const workspace = useAuditLog();
  return (
    <main className="app-shell">
      <AppNav />
      <AuditWorkspace workspace={workspace} />
    </main>
  );
}

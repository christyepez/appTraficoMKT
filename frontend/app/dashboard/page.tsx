"use client";

import { RequirementsWorkspace } from "../../features/requirements/components/RequirementsWorkspace";
import { useRequirementsWorkspace } from "../../features/requirements/hooks/useRequirementsWorkspace";
import { AppNav } from "../nav";

export default function DashboardPage() {
  const workspace = useRequirementsWorkspace();
  return (
    <main className="app-shell">
      <AppNav />
      <RequirementsWorkspace workspace={workspace} />
    </main>
  );
}

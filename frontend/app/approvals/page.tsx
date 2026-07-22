"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { ApprovalDecisionForm } from "../../features/approvals/components/ApprovalDecisionForm";
import { ApprovalEvidenceDialog } from "../../features/approvals/components/ApprovalEvidenceDialog";
import { ApprovalQueue } from "../../features/approvals/components/ApprovalQueue";
import { useApprovalsWorkspace } from "../../features/approvals/hooks/useApprovalsWorkspace";
import type { Activity, ApprovalDecision } from "../../features/approvals/models/approval.models";
import styles from "../../features/approvals/styles/Approval.module.css";
import { AppNav } from "../nav";

export default function ApprovalsPage() {
  const workspace = useApprovalsWorkspace();
  const [evidenceActivity, setEvidenceActivity] = useState<Activity | null>(null);
  const [decisionRequest, setDecisionRequest] = useState<{ activity: Activity; decision: ApprovalDecision } | null>(null);
  return <main className="app-shell"><AppNav /><section className={`content-shell ${styles.workspace}`}>
    {evidenceActivity && <ApprovalEvidenceDialog activity={evidenceActivity} evidence={workspace.evidence} onClose={() => setEvidenceActivity(null)} />}
    {decisionRequest && <ApprovalDecisionForm activity={decisionRequest.activity} initialDecision={decisionRequest.decision} pending={workspace.pendingIds.has(decisionRequest.activity.id)} onSubmit={(decision, comments) => workspace.decide(decisionRequest.activity.id, decision, comments)} onClose={() => setDecisionRequest(null)} />}
    <section className={`panel ${styles.panel}`}><div className={`card-head ${styles.header}`}><h2>Aprobaciones</h2><button className="button secondary" type="button" disabled={workspace.isRefreshing} onClick={() => void workspace.refresh().catch(() => undefined)}><RefreshCw size={16} /> {workspace.isRefreshing ? "Actualizando" : "Actualizar"}</button></div>{workspace.message && <span className={styles.feedback} role="status" aria-live="polite">{workspace.message}</span>}<ApprovalQueue activities={workspace.activities} approvals={workspace.approvals} search={workspace.search} showApproved={workspace.showApproved} canDecide={workspace.canDecide} pendingIds={workspace.pendingIds} isInitialLoading={workspace.isInitialLoading} loadError={workspace.loadError} onSearch={workspace.setSearch} onShowApproved={workspace.setShowApproved} onRetry={() => void workspace.refresh().catch(() => undefined)} onDecision={(activity, decision) => setDecisionRequest({ activity, decision })} onEvidence={setEvidenceActivity} /></section>
  </section></main>;
}

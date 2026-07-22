"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { EvidenceList } from "../../features/evidence/components/EvidenceList";
import { EvidenceUploadDialog } from "../../features/evidence/components/EvidenceUploadDialog";
import { useEvidenceWorkspace } from "../../features/evidence/hooks/useEvidenceWorkspace";
import { attachableActivities } from "../../features/evidence/utils/evidence-workspace.utils";
import styles from "../../features/evidence/styles/Evidence.module.css";
import { CrudActionButton } from "../../shared/components/CrudActionButton";
import { AppNav } from "../nav";

export default function EvidencePage() {
  const workspace = useEvidenceWorkspace();
  const [uploadActivityId, setUploadActivityId] = useState<string | null>(null);
  const canAttach = attachableActivities(workspace.activities).length > 0;
  return (
    <main className="app-shell">
      <AppNav />
      <section className={`content-shell ${styles.workspace}`}>
        {uploadActivityId !== null && <EvidenceUploadDialog activities={workspace.activities} initialActivityId={uploadActivityId} pendingIds={workspace.pendingIds} onUploadFile={workspace.uploadFile} onUploadUrl={workspace.uploadUrl} onClose={() => setUploadActivityId(null)} />}
        <section className={`panel ${styles.panel}`}>
          <div className={`card-head ${styles.header}`}><div><h2>Evidencias y aprobaciones</h2><p>{workspace.evidence.length} adjuntos registrados sobre {workspace.activities.length} productos visibles.</p></div><div className="actions"><CrudActionButton action="create" label="Adjuntar nueva evidencia" disabled={!canAttach} onClick={() => setUploadActivityId("")} /><button className="button secondary" type="button" disabled={workspace.isRefreshing} onClick={() => void workspace.refresh().catch(() => undefined)}><RefreshCw size={16} /> {workspace.isRefreshing ? "Actualizando" : "Actualizar"}</button></div></div>
          {workspace.message && <span className={styles.feedback} role="status" aria-live="polite">{workspace.message}</span>}
          <div className="detail-grid compact-detail-grid top-space"><div className="detail-item"><span>Productos visibles</span><strong>{workspace.activities.length}</strong></div><div className="detail-item"><span>Adjuntos</span><strong>{workspace.evidence.length}</strong></div><div className="detail-item"><span>Aprobaciones</span><strong>{workspace.approvals.length}</strong></div></div>
          <EvidenceList activities={workspace.activities} evidence={workspace.evidence} approvals={workspace.approvals} pendingIds={workspace.pendingIds} isInitialLoading={workspace.isInitialLoading} loadError={workspace.loadError} onRetry={() => void workspace.refresh().catch(() => undefined)} onAttach={setUploadActivityId} onDelete={(id) => void workspace.remove(id)} />
        </section>
      </section>
    </main>
  );
}

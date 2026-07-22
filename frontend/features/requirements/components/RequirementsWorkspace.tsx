"use client";

import { RefreshCw } from "lucide-react";
import { CrudActionButton } from "../../../shared/components/CrudActionButton";
import { useState } from "react";
import type { Requirement } from "../models/requirement.models";
import type { RequirementsWorkspace as Workspace } from "../hooks/useRequirementsWorkspace";
import { RequirementFilters } from "./RequirementFilters";
import { RequirementForm } from "./RequirementForm";
import { RequirementList } from "./RequirementList";
import { RelatedProductsDialog } from "./RelatedProductsDialog";
import styles from "../styles/Requirements.module.css";

export function RequirementsWorkspace({ workspace }: { workspace: Workspace }) {
  const [editing, setEditing] = useState<Requirement | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Requirement | null>(null);
  const [search, setSearch] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  function openForm(requirement: Requirement | null) {
    setEditing(requirement);
    setFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setFormOpen(false);
  }

  return (
    <section className={`content-shell tracking-layout ${styles.shell}`}>
      {formOpen && <RequirementForm key={editing?.id ?? "new"} requirement={editing} catalogs={workspace.catalogs} onSave={workspace.save} onSuccess={closeForm} onFeedback={workspace.report} onCancel={closeForm} />}
      {selected && <RelatedProductsDialog requirement={selected} activities={workspace.activities} onClose={() => setSelected(null)} />}
      <section className="panel">
        <div className="card-head"><div><span className="eyebrow">Operación de marketing</span><h2>Seguimiento de requerimientos</h2></div><div className="actions">
          {workspace.permissions.canCreate && <CrudActionButton action="create" label="Crear nuevo requerimiento" onClick={() => openForm(null)} />}
          <button className="button secondary" type="button" disabled={workspace.isRefreshing} onClick={() => void workspace.refresh().catch(() => undefined)}><RefreshCw size={16} /> Actualizar</button>
        </div></div>
        {workspace.message && <span className="badge" role="status">{workspace.message}</span>}
        <RequirementFilters search={search} showCompleted={showCompleted} refreshing={workspace.isRefreshing} onSearch={setSearch} onShowCompleted={setShowCompleted} />
        <RequirementList requirements={workspace.requirements} search={search} showCompleted={showCompleted} loading={workspace.isInitialLoading} error={workspace.loadError} canManage={workspace.permissions.canManage} pendingIds={workspace.pendingRequirementIds} onRetry={() => void workspace.refresh().catch(() => undefined)} onProducts={setSelected} onStatus={(id, action) => void workspace.changeStatus(id, action)} onEdit={openForm} onDelete={(id) => void workspace.remove(id)} />
      </section>
    </section>
  );
}

"use client";

import { useState } from "react";
import { PaginationControls, paginate, type PaginationState } from "../../../app/pagination";
import type { Activity, Approval, EvidenceItem } from "../models/evidence.models";
import { toggleExpanded } from "../utils/evidence-workspace.utils";
import { EvidenceCard } from "./EvidenceCard";

type EvidenceListProps = {
  activities: Activity[];
  evidence: EvidenceItem[];
  approvals: Approval[];
  pendingIds: Set<string>;
  isInitialLoading: boolean;
  loadError: string;
  onRetry: () => void;
  onAttach: (activityId: string) => void;
  onDelete: (evidenceId: string) => void;
};

export function EvidenceList({ activities, evidence, approvals, pendingIds, isInitialLoading, loadError, onRetry, onAttach, onDelete }: EvidenceListProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });
  const page = paginate(activities, pagination);
  if (isInitialLoading) return <div className="empty" role="status">Cargando evidencias…</div>;
  if (loadError && activities.length === 0) return <div className="empty" role="alert">{loadError} <button className="button secondary compact-button" type="button" onClick={onRetry}>Reintentar</button></div>;
  if (activities.length === 0) return <div className="empty">No hay productos visibles para revisar adjuntos.</div>;
  return <><div className="stack compact-stack top-space">{page.items.map((activity) => <EvidenceCard key={activity.id} activity={activity} evidence={evidence} approvals={approvals} expanded={expanded.includes(activity.id)} pendingIds={pendingIds} onToggle={() => setExpanded((values) => toggleExpanded(values, activity.id))} onAttach={() => onAttach(activity.id)} onDelete={onDelete} />)}</div><PaginationControls state={{ ...pagination, page: page.page }} totalItems={activities.length} onChange={setPagination} /></>;
}

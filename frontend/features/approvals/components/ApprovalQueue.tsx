"use client";

import { useState } from "react";
import { PaginationControls, paginate, type PaginationState } from "../../../app/pagination";
import type { Activity, Approval, ApprovalDecision } from "../models/approval.models";
import { ApprovalCard } from "./ApprovalCard";

export function ApprovalQueue({ activities, approvals, search, showApproved, canDecide, pendingIds, isInitialLoading, loadError, onSearch, onShowApproved, onRetry, onDecision, onEvidence }: { activities: Activity[]; approvals: Approval[]; search: string; showApproved: boolean; canDecide: boolean; pendingIds: Set<string>; isInitialLoading: boolean; loadError: string; onSearch: (value: string) => void; onShowApproved: (value: boolean) => void; onRetry: () => void; onDecision: (activity: Activity, decision: ApprovalDecision) => void; onEvidence: (activity: Activity) => void }) {
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });
  const page = paginate(activities, pagination);
  return <><label className="field top-space"><span>Buscar en aprobaciones</span><input value={search} onChange={(event) => { onSearch(event.target.value); setPagination((value) => ({ ...value, page: 1 })); }} placeholder="Producto, responsable, tipo, canal, KPI, estado..." /></label><div className="check-group"><label className="check-field">Ver productos aprobados<input type="checkbox" checked={showApproved} onChange={(event) => { onShowApproved(event.target.checked); setPagination((value) => ({ ...value, page: 1 })); }} /></label></div>{isInitialLoading ? <div className="empty" role="status">Cargando aprobaciones…</div> : loadError && activities.length === 0 ? <div className="empty" role="alert">{loadError} <button className="button secondary compact-button" type="button" onClick={onRetry}>Reintentar</button></div> : <><div className="stack compact-stack top-space">{page.items.map((item) => <ApprovalCard key={item.id} activity={item} approvals={approvals} search={search} canDecide={canDecide} pending={pendingIds.has(item.id)} onDecision={(decision) => onDecision(item, decision)} onEvidence={() => onEvidence(item)} />)}{activities.length === 0 && <div className="empty">No hay productos que coincidan con el filtro.</div>}</div><PaginationControls state={{ ...pagination, page: page.page }} totalItems={activities.length} onChange={setPagination} /></>}</>;
}

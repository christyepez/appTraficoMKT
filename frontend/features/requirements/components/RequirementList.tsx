"use client";

import { useMemo, useState } from "react";
import { PaginationControls, paginate, type PaginationState } from "../../../app/pagination";
import type { Requirement, RequirementStatusAction } from "../models/requirement.models";
import { isFinalRequirement, matchesRequirementSearch } from "../utils/requirement.utils";
import { RequirementCard } from "./RequirementCard";

type Props = { requirements: Requirement[]; search: string; showCompleted: boolean; loading: boolean; error: string; canManage: boolean; pendingIds: Set<string>; onRetry: () => void; onProducts: (value: Requirement) => void; onStatus: (id: string, action: RequirementStatusAction) => void; onEdit: (value: Requirement) => void; onDelete: (id: string) => void };

export function RequirementList({ requirements, search, showCompleted, loading, error, canManage, pendingIds, onRetry, onProducts, onStatus, onEdit, onDelete }: Props) {
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });
  const filtered = useMemo(() => requirements.filter((item) => showCompleted === isFinalRequirement(item.status)).filter((item) => matchesRequirementSearch(item, search)), [requirements, search, showCompleted]);
  const page = paginate(filtered, pagination);
  if (loading) return <div className="empty" role="status">Cargando requerimientos…</div>;
  return <>{error && <div className="empty" role="alert"><p>{error}</p><button className="button secondary compact" type="button" onClick={onRetry}>Reintentar</button></div>}{!error && requirements.length === 0 && <div className="empty">Aún no hay requerimientos registrados.</div>}{requirements.length > 0 && filtered.length === 0 && <div className="empty">No hay requerimientos que coincidan con los filtros seleccionados.</div>}{filtered.length > 0 && <><div className="stack compact-stack top-space">{page.items.map((item) => <RequirementCard key={item.id} requirement={item} search={search} pending={pendingIds.has(item.id)} canManage={canManage} onProducts={onProducts} onStatus={onStatus} onEdit={onEdit} onDelete={onDelete} />)}</div><PaginationControls state={{ ...pagination, page: page.page }} totalItems={filtered.length} onChange={setPagination} /></>}</>;
}

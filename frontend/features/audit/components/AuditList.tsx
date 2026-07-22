"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { PaginationControls, paginate, type PaginationState } from "../../../app/pagination";
import type { AuditRow } from "../models/audit.models";
import { formatAuditDate } from "../utils/audit.utils";
import { AuditEventDetail } from "./AuditEventDetail";

export function AuditList({ rows, loading, error, onRetry }: { rows: AuditRow[]; loading: boolean; error: string; onRetry: () => void }) {
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 }), page = paginate(rows, pagination);
  if (loading) return <div className="empty" role="status">Cargando auditoría…</div>;
  if (error) return <div className="empty" role="alert">{error} <button className="button secondary compact" type="button" onClick={onRetry}>Reintentar</button></div>;
  if (!rows.length) return <div className="empty">Sin eventos para el filtro seleccionado.</div>;
  return <><div className="stack compact-stack top-space">{page.items.map((row) => <article className="card compact-card" key={`${row.source}-${row.id}`}><div className="card-head"><div className="compact-title"><h3><FileText size={16} /> {row.action}</h3><p>{row.source} | {row.performedBy} | {formatAuditDate(row.occurredAt)}</p></div><span className="badge">{row.decision || row.toStatus || "Registro"}</span></div><div className="detail-grid compact-detail-grid"><div className="detail-item"><span>Entidad</span><strong>{row.entityId || "Sin identificador"}</strong></div>{row.relatedId && <div className="detail-item"><span>Relacionado</span><strong>{row.relatedId}</strong></div>}<div className="detail-item"><span>Desde</span><strong>{row.fromStatus || "Inicio"}</strong></div><div className="detail-item"><span>Hasta</span><strong>{row.toStatus || row.decision || "Registro"}</strong></div></div><AuditEventDetail row={row} /></article>)}</div><PaginationControls state={{ ...pagination, page: page.page }} totalItems={rows.length} onChange={setPagination} /></>;
}

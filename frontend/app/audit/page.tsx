"use client";

import { AppNav } from "../nav";
import { api, t } from "../lib";
import { FileText, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AuditRow = {
  id: string;
  source: "Requerimientos" | "Productos" | "Aprobaciones";
  entityId: string;
  relatedId?: string;
  fromStatus?: string;
  toStatus?: string;
  decision?: string;
  action: string;
  performedBy: string;
  comments?: string;
  payloadJson?: string;
  occurredAt: string;
};

type RequirementAudit = {
  id: string;
  requirementId: string;
  fromStatus?: string;
  toStatus: string;
  action: string;
  performedBy: string;
  comments: string;
  occurredAt: string;
};

type ActivityAudit = {
  id: string;
  activityId: string;
  requirementId: string;
  fromStatus?: string;
  toStatus: string;
  action: string;
  performedBy: string;
  comments: string;
  occurredAt: string;
};

type ApprovalAudit = {
  id: string;
  activityId: string;
  decision: string;
  action: string;
  performedBy: string;
  payloadJson: string;
  occurredAt: string;
};

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [source, setSource] = useState("Todas");
  const [search, setSearch] = useState("");

  async function load() {
    const [requirements, products, approvals] = await Promise.all([
      api<RequirementAudit[]>("/api/requirements/audit").catch(() => []),
      api<ActivityAudit[]>("/api/activities/audit").catch(() => []),
      api<ApprovalAudit[]>("/api/approvals/audit").catch(() => [])
    ]);

    setRows([
      ...requirements.map((item): AuditRow => ({
        id: item.id,
        source: "Requerimientos",
        entityId: item.requirementId,
        fromStatus: item.fromStatus,
        toStatus: item.toStatus,
        action: item.action,
        performedBy: item.performedBy,
        comments: item.comments,
        occurredAt: item.occurredAt
      })),
      ...products.map((item): AuditRow => ({
        id: item.id,
        source: "Productos",
        entityId: item.activityId,
        relatedId: item.requirementId,
        fromStatus: item.fromStatus,
        toStatus: item.toStatus,
        action: item.action,
        performedBy: item.performedBy,
        comments: item.comments,
        occurredAt: item.occurredAt
      })),
      ...approvals.map((item): AuditRow => ({
        id: item.id,
        source: "Aprobaciones",
        entityId: item.activityId,
        decision: item.decision,
        action: item.action,
        performedBy: item.performedBy,
        payloadJson: item.payloadJson,
        occurredAt: item.occurredAt
      }))
    ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()));
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 30000);
    load().catch(() => location.assign("/login"));
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => rows
    .filter((row) => source === "Todas" || row.source === source)
    .filter((row) => matches(row, search)), [rows, source, search]);

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell">
        <section className="panel">
          <div className="card-head">
            <div>
              <h2>{t("Auditorías")}</h2>
              <p>Tracking administrativo de requerimientos, productos y aprobaciones.</p>
            </div>
            <div className="actions">
              <label className="field compact-field">
                <span>Tracking</span>
                <select value={source} onChange={(event) => setSource(event.target.value)}>
                  <option>Todas</option>
                  <option>Requerimientos</option>
                  <option>Productos</option>
                  <option>Aprobaciones</option>
                </select>
              </label>
              <button className="button secondary" title="Actualizar auditorías" onClick={load}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>
          <div className="detail-grid compact-detail-grid top-space">
            <div className="detail-item"><span>Total eventos</span><strong>{rows.length}</strong></div>
            <div className="detail-item"><span>Filtrados</span><strong>{filtered.length}</strong></div>
            <div className="detail-item"><span>Último evento</span><strong>{rows[0] ? formatDate(rows[0].occurredAt) : "Sin datos"}</strong></div>
          </div>
          <label className="field top-space">
            <span>Buscar</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por acción, usuario, estado, decisión..." />
          </label>
          <div className="stack compact-stack top-space">
            {filtered.map((row) => (
              <article className="card compact-card" key={`${row.source}-${row.id}`}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3><FileText size={16} /> {row.action}</h3>
                    <p>{row.source} | {row.performedBy} | {formatDate(row.occurredAt)}</p>
                  </div>
                  <span className="badge">{row.decision || row.toStatus}</span>
                </div>
                <div className="detail-grid compact-detail-grid">
                  <div className="detail-item"><span>Entidad</span><strong>{row.entityId}</strong></div>
                  {row.relatedId && <div className="detail-item"><span>Relacionado</span><strong>{row.relatedId}</strong></div>}
                  <div className="detail-item"><span>Desde</span><strong>{row.fromStatus || "Inicio"}</strong></div>
                  <div className="detail-item"><span>Hasta</span><strong>{row.toStatus || row.decision || "Registro"}</strong></div>
                </div>
                {(row.comments || row.payloadJson) && (
                  <details className="top-space">
                    <summary>Ver detalle del evento</summary>
                    <pre className="json-preview">{pretty(row.payloadJson || row.comments || "")}</pre>
                  </details>
                )}
              </article>
            ))}
            {filtered.length === 0 && <div className="empty">Sin eventos para el filtro seleccionado.</div>}
          </div>
        </section>
      </section>
    </main>
  );
}

function matches(row: AuditRow, term: string) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return [row.source, row.entityId, row.relatedId, row.fromStatus, row.toStatus, row.decision, row.action, row.performedBy, row.comments, row.payloadJson]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function pretty(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

import type { ActivityAudit, ApprovalAudit, AuditRow, AuditSource, RequirementAudit } from "../models/audit.models";

export function normalizeAuditRows(requirements: RequirementAudit[], products: ActivityAudit[], approvals: ApprovalAudit[]): AuditRow[] {
  return [
    ...requirements.map((item): AuditRow => ({ ...base(item), source: "Requerimientos", entityId: item.requirementId, fromStatus: item.fromStatus, toStatus: item.toStatus, comments: item.comments, payloadJson: item.payloadJson })),
    ...products.map((item): AuditRow => ({ ...base(item), source: "Productos", entityId: item.activityId, relatedId: item.requirementId, fromStatus: item.fromStatus, toStatus: item.toStatus, comments: item.comments, payloadJson: item.payloadJson })),
    ...approvals.map((item): AuditRow => ({ ...base(item), source: "Aprobaciones", entityId: item.activityId, decision: item.decision, payloadJson: item.payloadJson }))
  ].sort((left, right) => timestamp(right.occurredAt) - timestamp(left.occurredAt));
}

export function filterAuditRows(rows: AuditRow[], source: AuditSource, search: string) {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => source === "Todas" || row.source === source).filter((row) => !query || [row.source, row.entityId, row.relatedId, row.fromStatus, row.toStatus, row.decision, row.action, row.performedBy, row.comments, row.payloadJson].filter(Boolean).join(" ").toLowerCase().includes(query));
}

export function prettyAuditValue(value: string) {
  if (!value) return "Sin detalle adicional.";
  try { return JSON.stringify(redact(JSON.parse(value)), null, 2); }
  catch { return value; }
}

export function formatAuditDate(value?: string) {
  if (!value) return "Sin datos";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function base(item: { id: string; action: string; performedBy: string; occurredAt: string }) { return { id: item.id, action: item.action || "Evento sin acción", performedBy: item.performedBy || "Sistema", occurredAt: item.occurredAt }; }
function timestamp(value: string) { const result = new Date(value).getTime(); return Number.isNaN(result) ? 0 : result; }
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /password|token|secret|authorization/i.test(key) ? "[OCULTO]" : redact(item)]));
}

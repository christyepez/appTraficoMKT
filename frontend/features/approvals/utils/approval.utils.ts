import type { AuthSession } from "../../../app/lib";
import type { Activity } from "../models/approval.models";

export function approvalStatusLabel(status: string) {
  const labels: Record<string, string> = { Todo: "Por hacer", InProgress: "Producto en proceso", EvidenceAttached: "Evidencia adjunta", PendingApproval: "Pendiente de aprobación", Approved: "Aprobado", Rejected: "Producto en proceso" };
  return labels[status] ?? status;
}

export function filterApprovalActivities(activities: Activity[], showApproved: boolean, search: string) {
  const status = showApproved ? "Approved" : "PendingApproval";
  const query = search.trim().toLowerCase();
  return activities.filter((item) => item.status === status).filter((item) => !query || [item.productId, item.productType, item.productResponsible, item.mainKpi, item.requirementType, item.diffusionChannel, item.strategicObjective, approvalStatusLabel(item.status)].join(" ").toLowerCase().includes(query));
}

export function canDecideApprovals(session: AuthSession | null) {
  return Boolean(session?.user.roles.some((role) => ["Administrador", "Aprobador", "Coordinador"].includes(role)));
}

export function formatApprovalDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

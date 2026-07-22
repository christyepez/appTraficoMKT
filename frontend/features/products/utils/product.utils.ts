import type { Activity } from "../../../shared/models/api.models";

export { filterProductsForSession, filterRequirementsForSession } from "../../../shared/utils/session-visibility.utils";

export type ProductStep = "start" | "evidence" | "approval";
export type StepState = "pending" | "ready" | "done";

export function normalizeProductStatus(status: string) {
  return status === "Rejected" ? "InProgress" : status;
}

export function productStatusLabel(status: string) {
  const normalized = normalizeProductStatus(status);
  const labels: Record<string, string> = {
    Todo: "Por hacer",
    InProgress: "Producto en proceso",
    EvidenceAttached: "Evidencia adjunta",
    PendingApproval: "Pendiente de aprobación",
    Approved: "Aprobado"
  };
  return labels[normalized] ?? normalized;
}

export function approvalDecisionLabel(decision: string) {
  return decision === "Approved" ? "Aprobado" : decision === "Rejected" ? "Rechazado" : decision;
}

export function buildNextProductId(products: Activity[]) {
  const max = products.reduce((current, item) => {
    const match = /^PROD-(\d+)$/i.exec(item.productId.trim());
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `PROD-${String(max + 1).padStart(4, "0")}`;
}

export function matchesProductSearch(item: Activity, term: string) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return [item.productId, item.productType, item.requirementType, item.productResponsible, item.diffusionChannel, item.mainKpi, productStatusLabel(item.status), item.observations]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function productStepState(item: Activity, step: ProductStep): StepState {
  const order = ["Todo", "InProgress", "EvidenceAttached", "PendingApproval", "Approved"];
  const current = order.indexOf(normalizeProductStatus(item.status));
  if (step === "start") return current <= 0 ? "ready" : "done";
  if (step === "evidence") return current <= 0 ? "pending" : current === 1 ? "ready" : "done";
  return current < 2 ? "pending" : current === 2 ? "ready" : "done";
}

export function workflowButtonClass(state: StepState) {
  return state === "done" ? "icon-button success" : state === "ready" ? "icon-button warning" : "icon-button pending";
}

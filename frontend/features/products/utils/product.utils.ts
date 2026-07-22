import type { AuthSession } from "../../../app/lib";
import type { Activity, Requirement } from "../../../shared/models/api.models";

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

export function filterRequirementsForSession(requirements: Requirement[], session: AuthSession | null) {
  if (hasFullProductAccess(session)) return requirements;
  const keys = sessionUserKeys(session);
  return requirements.filter((item) => keys.has(item.requestedBy.toLowerCase()));
}

export function filterProductsForSession(products: Activity[], visibleRequirements: Requirement[], session: AuthSession | null) {
  if (hasFullProductAccess(session)) return products;
  const keys = sessionUserKeys(session);
  const requirementIds = new Set(visibleRequirements.map((item) => item.id));
  return products.filter((item) => keys.has(item.productResponsible.toLowerCase()) || requirementIds.has(item.requirementId));
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

function hasFullProductAccess(session: AuthSession | null) {
  return !session || session.user.roles.some((role) => ["Administrador", "Auditor", "Coordinador"].includes(role));
}

function sessionUserKeys(session: AuthSession | null) {
  return new Set([session?.user.name ?? "", session?.user.email ?? ""].map((value) => value.toLowerCase()).filter(Boolean));
}

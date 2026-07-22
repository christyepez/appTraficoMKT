import type { AuthSession } from "../../../app/lib";
import type { Activity, Requirement } from "../../../shared/models/api.models";
import type { RequirementPermissions, RequirementStep, RequirementStepState } from "../models/requirement.models";

export function filterRequirementsForSession(requirements: Requirement[], activities: Activity[], session: AuthSession | null) {
  if (!session || hasRole(session, "Administrador", "Coordinador", "Auditor")) return requirements;
  const keys = new Set([session.user.name, session.user.email].map(normalize).filter(Boolean));
  const assignedIds = new Set(activities.filter((item) => keys.has(normalize(item.productResponsible))).map((item) => item.requirementId));
  if (hasRole(session, "Tecnico")) return requirements.filter((item) => assignedIds.has(item.id));
  return requirements.filter((item) => keys.has(normalize(item.requestedBy)) || assignedIds.has(item.id));
}

export function requirementPermissions(session: AuthSession | null): RequirementPermissions {
  const canManage = session ? !hasRole(session, "Auditor") : false;
  return { canCreate: canManage, canManage };
}

export function requirementStepState(requirement: Requirement, step: RequirementStep): RequirementStepState {
  const order = ["Draft", "InAnalysis", "InExecution", "PendingApproval", "Completed", "Rejected"];
  const current = order.indexOf(requirement.status);
  if (step === "analysis") return current <= 0 ? "ready" : "done";
  if (step === "execution") return current <= 0 ? "pending" : current === 1 ? "ready" : "done";
  if (current < 2) return "pending";
  return current === 2 || current === 3 ? "ready" : "done";
}

export function isFinalRequirement(status: string) {
  return status === "Completed" || status === "Rejected";
}

export function requirementStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Draft: "Borrador",
    InAnalysis: "En análisis",
    InExecution: "En ejecución",
    PendingApproval: "Pendiente de aprobación",
    Completed: "Finalizado",
    Rejected: "Finalizado rechazado"
  };
  return labels[status] ?? status;
}

export function activityStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Todo: "Por hacer",
    InProgress: "En progreso",
    EvidenceAttached: "Evidencia adjunta",
    PendingApproval: "Pendiente de aprobación",
    Approved: "Aprobado",
    Rejected: "Rechazado"
  };
  return labels[status] ?? status;
}

export function matchesRequirementSearch(requirement: Requirement, term: string) {
  const query = normalize(term.trim());
  if (!query) return true;
  return [requirement.code, requirement.activityOrEvent, requirement.requestedBy, requirement.faculty, requirement.career, requirement.campus, requirement.place, requirement.status]
    .some((value) => normalize(value).includes(query));
}

export function workflowButtonClass(state: RequirementStepState) {
  return state === "done" ? "icon-button success" : state === "ready" ? "icon-button warning" : "icon-button pending";
}

function hasRole(session: AuthSession, ...roles: string[]) {
  return session.user.roles.some((role) => roles.includes(role));
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

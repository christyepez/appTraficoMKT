import type { AuthSession } from "../../core/auth/session";
import type { Activity, Requirement } from "../models/api.models";

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

function hasFullProductAccess(session: AuthSession | null) {
  return !session || session.user.roles.some((role) => ["Administrador", "Auditor", "Coordinador"].includes(role));
}

function sessionUserKeys(session: AuthSession | null) {
  return new Set([session?.user.name ?? "", session?.user.email ?? ""].map((value) => value.toLowerCase()).filter(Boolean));
}

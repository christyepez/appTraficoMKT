import type { PublicAvailability, PublicRequirementCatalogs, PublicRequirementPayload } from "../models/public-requirement.models";
import type { PublicRequirementValues } from "../schemas/public-requirement.schema";
import { mapRequirementFormToLegacyPayload } from "../../requirements/domain/requirement-form.mappers";

export function isPublicFeatureActive(availability: PublicAvailability, now = Date.now()) {
  if (!availability.enabled) return false;
  const from = availability.activeFrom ? new Date(availability.activeFrom).getTime() : Number.NEGATIVE_INFINITY;
  const until = availability.activeUntil ? new Date(availability.activeUntil).getTime() : Number.POSITIVE_INFINITY;
  if (Number.isNaN(from) || Number.isNaN(until)) return false;
  return now >= from && now <= until;
}

export function mapPublicRequirementPayload(values: PublicRequirementValues, catalogs: PublicRequirementCatalogs, requestDate = new Date().toISOString().slice(0, 10)): PublicRequirementPayload {
  return { ...mapRequirementFormToLegacyPayload(values, catalogs, requestDate), idempotencyKey: crypto.randomUUID() };
}

export function publicRequirementSuccessMessage(requirementCode: string) {
  return `Su requerimiento fue registrado correctamente con el código ${requirementCode}. El área de Marketing revisará la información enviada.`;
}

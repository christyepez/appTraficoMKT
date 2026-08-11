import type { LegacyRequirementPayload, RequirementFormCatalog } from "../../requirements/domain/requirement-form.types";

export type PublicCatalog = RequirementFormCatalog & {
  isActive: boolean;
};

export type PublicRequirementCatalogs = {
  faculties: PublicCatalog[];
  careers: PublicCatalog[];
  campuses: PublicCatalog[];
  eventFormats: PublicCatalog[];
};

export type PublicRequirementPayload = LegacyRequirementPayload & {
  idempotencyKey: string;
  turnstileToken?: string;
};

export type PublicRequirementCreationResult = {
  requirementId: string;
  requirementCode: string;
  uploadToken: string;
  uploadTokenExpiresAt: string;
  message: string;
};

export type PublicRequirementAttachmentResult = {
  attachmentId: string;
  fileName: string;
  success: boolean;
  error?: string;
};

export type PublicAvailability = {
  enabled: boolean;
  activeFrom?: string | null;
  activeUntil?: string | null;
};

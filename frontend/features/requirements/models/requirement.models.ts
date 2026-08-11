import type { Activity, NamedCatalog, Requirement } from "../../../shared/models/api.models";
import type { LegacyRequirementPayload } from "../domain/requirement-form.types";

export type { Requirement } from "../../../shared/models/api.models";

export type CareerCatalog = NamedCatalog & { facultyId: string };

export type RequirementCatalogs = {
  faculties: NamedCatalog[];
  careers: CareerCatalog[];
  campuses: NamedCatalog[];
  eventFormats: NamedCatalog[];
};

export type RequirementWorkspaceData = {
  requirements: Requirement[];
  activities: Activity[];
  catalogs: RequirementCatalogs;
};

export type SaveRequirementPayload = LegacyRequirementPayload & { attachments?: File[] };

export type RequirementAttachment = {
  id: string;
  requirementId: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  status: string;
  uploadedBy: string;
  createdAt: string;
};

export type RequirementStatusAction = "analysis" | "execution" | "complete";
export type RequirementStep = RequirementStatusAction;
export type RequirementStepState = "pending" | "ready" | "done";

export type RequirementPermissions = {
  canCreate: boolean;
  canManage: boolean;
};

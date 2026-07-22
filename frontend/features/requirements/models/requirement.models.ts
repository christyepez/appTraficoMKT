import type { Activity, NamedCatalog, Requirement } from "../../../shared/models/api.models";

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

export type SaveRequirementPayload = {
  activityOrEvent: string;
  requestedBy: string;
  facultyId: string;
  faculty: string;
  career: string;
  campusId: string;
  campus: string;
  place: string;
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  eventObjective: string;
  eventFormatId: string;
  eventFormat: string;
  requestDate: string;
};

export type RequirementStatusAction = "analysis" | "execution" | "complete";
export type RequirementStep = RequirementStatusAction;
export type RequirementStepState = "pending" | "ready" | "done";

export type RequirementPermissions = {
  canCreate: boolean;
  canManage: boolean;
};

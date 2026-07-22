import type { Activity, Approval, EvidenceItem, Requirement } from "../../../shared/models/api.models";

export type { Activity, Approval, EvidenceItem, Requirement } from "../../../shared/models/api.models";

export type EvidenceWorkspaceData = {
  requirements: Requirement[];
  activities: Activity[];
  evidence: EvidenceItem[];
  approvals: Approval[];
};

export type ExternalEvidencePayload = {
  activityId: string;
  fileName: string;
  contentType: "text/uri-list";
  storageUrl: string;
  uploadedBy: string;
};

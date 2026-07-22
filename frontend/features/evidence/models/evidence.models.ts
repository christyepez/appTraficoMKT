import type { Activity, Approval, EvidenceItem, Requirement } from "../../../shared/models/api.models";

export type { Activity, Approval, EvidenceItem, ExternalEvidencePayload, Requirement } from "../../../shared/models/api.models";

export type EvidenceWorkspaceData = {
  requirements: Requirement[];
  activities: Activity[];
  evidence: EvidenceItem[];
  approvals: Approval[];
};

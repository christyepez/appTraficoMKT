import type { Activity, Approval, EvidenceItem } from "../../../shared/models/api.models";

export type { Activity, Approval, EvidenceItem } from "../../../shared/models/api.models";

export type ApprovalDecision = "Approved" | "Rejected";

export type ApprovalWorkspaceData = {
  activities: Activity[];
  evidence: EvidenceItem[];
  approvals: Approval[];
};

export type ApprovalDecisionPayload = {
  decision: "approved" | "rejected";
  decidedByEmail: string;
  comments: string;
  source: "web";
};

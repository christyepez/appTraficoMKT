import { api } from "../../../app/lib";
import type { Activity, Approval, EvidenceItem } from "../../../shared/models/api.models";
import type { ApprovalDecisionPayload, ApprovalWorkspaceData } from "../models/approval.models";

export async function getApprovalWorkspace(): Promise<ApprovalWorkspaceData> {
  const [activities, evidence, approvals] = await Promise.all([
    api<Activity[]>("/api/activities"),
    api<EvidenceItem[]>("/api/evidence").catch(() => []),
    api<Approval[]>("/api/approvals").catch(() => [])
  ]);
  return { activities, evidence, approvals };
}

export function submitApproval(activityId: string, payload: ApprovalDecisionPayload) {
  return api(`/api/activities/${activityId}/approvals`, { method: "POST", body: JSON.stringify(payload) });
}

import { api } from "../../../app/lib";
import type { Activity, Approval, EvidenceItem, Requirement } from "../../../shared/models/api.models";
import type { EvidenceWorkspaceData, ExternalEvidencePayload } from "../models/evidence.models";

export async function getEvidenceWorkspace(): Promise<EvidenceWorkspaceData> {
  const [requirements, activities, evidence, approvals] = await Promise.all([
    api<Requirement[]>("/api/requirements"),
    api<Activity[]>("/api/activities"),
    api<EvidenceItem[]>("/api/evidence"),
    api<Approval[]>("/api/approvals")
  ]);
  return { requirements, activities, evidence, approvals };
}

export function uploadEvidence(form: FormData) {
  return api<EvidenceItem>("/api/evidence/upload", { method: "POST", body: form });
}

export function createExternalEvidence(payload: ExternalEvidencePayload) {
  return api<EvidenceItem>("/api/evidence", { method: "POST", body: JSON.stringify(payload) });
}

export function markEvidenceAttached(activityId: string) {
  return api(`/api/activities/${activityId}/evidence-attached`, { method: "PATCH" });
}

export function deleteEvidence(evidenceId: string) {
  return api(`/api/evidence/${evidenceId}`, { method: "DELETE" });
}

export type AuditSource = "Todas" | "Requerimientos" | "Productos" | "Aprobaciones";
export type AuditRow = { id: string; source: Exclude<AuditSource, "Todas">; entityId: string; relatedId?: string; fromStatus?: string; toStatus?: string; decision?: string; action: string; performedBy: string; comments?: string; payloadJson?: string; occurredAt: string };
export type RequirementAudit = { id: string; requirementId: string; fromStatus?: string; toStatus: string; action: string; performedBy: string; comments: string; payloadJson?: string; occurredAt: string };
export type ActivityAudit = { id: string; activityId: string; requirementId: string; fromStatus?: string; toStatus: string; action: string; performedBy: string; comments: string; payloadJson?: string; occurredAt: string };
export type ApprovalAudit = { id: string; activityId: string; decision: string; action: string; performedBy: string; payloadJson: string; occurredAt: string };
export type AuditWorkspaceData = { requirements: RequirementAudit[]; products: ActivityAudit[]; approvals: ApprovalAudit[]; warnings: string[] };

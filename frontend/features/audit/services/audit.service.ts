import { api } from "../../../app/lib";
import type { ActivityAudit, ApprovalAudit, AuditWorkspaceData, RequirementAudit } from "../models/audit.models";

export async function getAuditWorkspace(): Promise<AuditWorkspaceData> {
  const [requirements, products, approvals] = await Promise.all([
    optional("requerimientos", api<RequirementAudit[]>("/api/requirements/audit")),
    optional("productos", api<ActivityAudit[]>("/api/activities/audit")),
    optional("aprobaciones", api<ApprovalAudit[]>("/api/approvals/audit"))
  ]);
  return { requirements: requirements.data, products: products.data, approvals: approvals.data, warnings: [requirements, products, approvals].flatMap((item) => item.error ? [item.error] : []) };
}

async function optional<T>(label: string, request: Promise<T>) {
  try { return { data: await request, error: "" }; }
  catch { return { data: [] as T, error: `No se pudo cargar auditoría de ${label}.` }; }
}

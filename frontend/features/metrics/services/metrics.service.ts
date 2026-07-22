import { api } from "../../../app/lib";
import type { Activity } from "../../../shared/models/api.models";
import type { ApprovalMetrics, MetricsWorkspaceData, ProductMetrics, RequirementMetrics, UsageMetrics } from "../models/metrics.models";

export async function getMetricsWorkspace(): Promise<MetricsWorkspaceData> {
  const [requirements, products, approvals, usage, activities] = await Promise.all([
    optional("requerimientos", api<RequirementMetrics>("/api/requirements/metrics")),
    optional("productos", api<ProductMetrics>("/api/activities/metrics")),
    optional("aprobaciones", api<ApprovalMetrics>("/api/approvals/metrics")),
    optional("usuarios", api<UsageMetrics>("/api/identity/usage-metrics")),
    optional("actividades", api<Activity[]>("/api/activities"))
  ]);
  return {
    requirements: requirements.data,
    products: products.data,
    approvals: approvals.data,
    usage: usage.data,
    activities: activities.data ?? [],
    warnings: [requirements, products, approvals, usage, activities].flatMap((item) => item.error ? [item.error] : [])
  };
}

async function optional<T>(label: string, request: Promise<T>) {
  try { return { data: await request, error: "" }; }
  catch { return { data: null, error: `No se pudieron cargar métricas de ${label}.` }; }
}

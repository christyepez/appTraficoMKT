import type { Activity } from "../../../shared/models/api.models";
import type { ApprovalMetrics, MetricSlice, ProductMetrics, RequirementMetrics, UsageMetrics, UsageRow } from "../models/metrics.models";

export function auditEventCount(requirements: RequirementMetrics | null, products: ProductMetrics | null, approvals: ApprovalMetrics | null) {
  return [...(requirements?.averageHoursByStage ?? []), ...(products?.averageHoursByStage ?? [])].reduce((total, item) => total + safe(item.events), safe(approvals?.auditEvents));
}

export function estimatedEffortHours(requirements: RequirementMetrics | null, products: ProductMetrics | null) {
  return Number([...(requirements?.averageHoursByStage ?? []), ...(products?.averageHoursByStage ?? [])].reduce((total, item) => total + safe(item.averageHours) * safe(item.events), 0).toFixed(1));
}

export function buildUsageRows(usage: UsageMetrics | null, activities: Activity[]): UsageRow[] {
  return (usage?.recentUsers ?? []).map((user) => {
    const keys = [user.email, user.name].map(normalize);
    const assigned = activities.filter((activity) => keys.includes(normalize(activity.productResponsible)));
    return { user, assigned, approved: assigned.filter((activity) => activity.status === "Approved").length, inProgress: assigned.filter((activity) => activity.status !== "Approved").length };
  });
}

export function visibleSlices(items: MetricSlice[], limit = 8) {
  return items.filter((item) => item.name && Number.isFinite(item.count) && Number.isFinite(item.percentage)).slice(0, limit);
}

export function metricBarPercentage(value: number) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function formatMetricDate(value?: string) {
  if (!value) return "Sin ingreso";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function hasMetricData(values: Array<unknown | null>) {
  return values.some(Boolean);
}

function safe(value?: number) { return Number.isFinite(value) ? Number(value) : 0; }
function normalize(value: string) { return value.trim().toLowerCase(); }

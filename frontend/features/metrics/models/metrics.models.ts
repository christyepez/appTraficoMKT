import type { Activity } from "../../../shared/models/api.models";

export type MetricSlice = { name: string; count: number; percentage: number };
export type StageMetric = { stage: string; averageHours: number; events: number };
export type RequirementMetrics = { totalRequirements: number; completedRequirements: number; activeRequirements: number; averageCycleDays: number; byStatus: MetricSlice[]; byFaculty: MetricSlice[]; byCampus: MetricSlice[]; byFormat: MetricSlice[]; averageHoursByStage: StageMetric[] };
export type ProductMetrics = { totalProducts: number; approvedProducts: number; activeProducts: number; averageCycleDays: number; byStatus: MetricSlice[]; workloadByResponsible: MetricSlice[]; byProductType: MetricSlice[]; byDiffusionChannel: MetricSlice[]; byMainKpi: MetricSlice[]; byTargetAudience: MetricSlice[]; averageHoursByStage: StageMetric[] };
export type ApprovalMetrics = { totalApprovals: number; approvedApprovals: number; rejectedApprovals: number; auditEvents: number; byDecision: MetricSlice[]; lastAuditAt?: string };
export type UsageUser = { name: string; email: string; roles: string; lastLoginAt?: string; isActive: boolean };
export type UsageMetrics = { totalUsers: number; activeUsers: number; usersLoggedLast7Days: number; averageHoursSinceLastLogin: number; recentUsers: UsageUser[] };
export type MetricsConcept = "summary" | "workload" | "times" | "impact" | "participation" | "usage";
export type MetricsWorkspaceData = { requirements: RequirementMetrics | null; products: ProductMetrics | null; approvals: ApprovalMetrics | null; usage: UsageMetrics | null; activities: Activity[]; warnings: string[] };
export type UsageRow = { user: UsageUser; assigned: Activity[]; approved: number; inProgress: number };

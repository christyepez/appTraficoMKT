import type { Activity, AgendaItem, Requirement } from "../../agenda/models/agenda.models";
export type MetricPeriod = "day" | "week" | "month";
export type AgendaMetricSummary = { plannedHours: number; capacityHours: number; occupancy: number; availability: number; pendingPlanning: number; atRisk: number };
export type WorkloadItem = { label: string; blocks: number; hours: number; percent: number };
export type AgendaMetricsResult = { items: AgendaItem[]; activities: Activity[]; summary: AgendaMetricSummary; campusLoad: WorkloadItem[]; technicianLoad: WorkloadItem[]; activityById: Map<string, Activity>; requirementById: Map<string, Requirement> };

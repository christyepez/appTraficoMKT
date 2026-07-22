import { describe, expect, it } from "vitest";
import type { Activity } from "../../../shared/models/api.models";
import type { ProductMetrics, RequirementMetrics, UsageMetrics } from "../models/metrics.models";
import { auditEventCount, buildUsageRows, estimatedEffortHours, formatMetricDate, hasMetricData, metricBarPercentage, visibleSlices } from "./metrics.utils";

describe("general metrics utils", () => {
  it("calcula auditoría y esfuerzo con valores seguros", () => {
    const requirements = { averageHoursByStage: [{ stage: "Análisis", averageHours: 2.5, events: 4 }] } as RequirementMetrics;
    const products = { averageHoursByStage: [{ stage: "Diseño", averageHours: 3, events: 2 }] } as ProductMetrics;
    expect(auditEventCount(requirements, products, { auditEvents: 3 } as never)).toBe(9);
    expect(estimatedEffortHours(requirements, products)).toBe(16);
    expect(auditEventCount(null, null, null)).toBe(0);
    expect(estimatedEffortHours({ averageHoursByStage: [{ stage: "x", averageHours: Number.NaN, events: 2 }] } as never, null)).toBe(0);
  });
  it("agrupa carga de usuarios sin distinguir mayúsculas", () => {
    const usage = { recentUsers: [{ name: "Ana", email: "ANA@EXAMPLE.COM", roles: "Tecnico", isActive: true }] } as UsageMetrics;
    const activities = [activity("1", "ana@example.com", "Approved"), activity("2", "Ana", "InProgress"), activity("3", "otro", "Todo")];
    const [row] = buildUsageRows(usage, activities); expect(row.assigned).toHaveLength(2); expect(row.approved).toBe(1); expect(row.inProgress).toBe(1); expect(buildUsageRows(null, activities)).toEqual([]);
  });
  it("normaliza barras, segmentos y existencia de datos", () => {
    const slices = [{ name: "A", count: 1, percentage: 150 }, { name: "", count: 2, percentage: 20 }, { name: "B", count: Number.NaN, percentage: 10 }];
    expect(visibleSlices(slices)).toEqual([slices[0]]); expect(metricBarPercentage(150)).toBe(100); expect(metricBarPercentage(-2)).toBe(0); expect(metricBarPercentage(Number.NaN)).toBe(0); expect(hasMetricData([null, {}])).toBe(true); expect(hasMetricData([null, null])).toBe(false);
  });
  it("formatea fechas ausentes, inválidas y válidas", () => {
    expect(formatMetricDate()).toBe("Sin ingreso"); expect(formatMetricDate("invalid")).toBe("Fecha no disponible"); expect(formatMetricDate("2026-07-01T10:00:00Z")).not.toContain("disponible");
  });
});
function activity(id: string, responsible: string, status: string) { return { id, productResponsible: responsible, status, productId: id, productType: "Video" } as Activity; }

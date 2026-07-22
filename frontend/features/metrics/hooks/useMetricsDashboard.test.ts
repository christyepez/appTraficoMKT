import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSession, showToast } from "../../../app/lib";
import { getMetricsWorkspace } from "../services/metrics.service";
import { useMetricsDashboard } from "./useMetricsDashboard";
vi.mock("../../../app/lib", () => ({ getSession: vi.fn(), showToast: vi.fn() }));
vi.mock("../services/metrics.service", () => ({ getMetricsWorkspace: vi.fn() }));
const serviceMock = vi.mocked(getMetricsWorkspace), sessionMock = vi.mocked(getSession);
beforeEach(() => { vi.clearAllMocks(); sessionMock.mockReturnValue({ accessToken: "t", expiresAt: "x", user: { id: "u", name: "A", email: "a@x", roles: ["Auditor"], screenPermissions: ["metrics"] } }); serviceMock.mockResolvedValue(data()); });

describe("useMetricsDashboard", () => {
  it("carga, cambia concepto y refresca", async () => {
    const { result, unmount } = renderHook(() => useMetricsDashboard()); await waitFor(() => expect(result.current.isLoading).toBe(false)); expect(result.current.requirements?.totalRequirements).toBe(3);
    act(() => result.current.setConcept("usage")); expect(result.current.concept).toBe("usage"); await act(async () => { await result.current.refresh(); }); expect(serviceMock).toHaveBeenCalledTimes(2); unmount();
  });
  it("mantiene datos parciales sin bloquear la pantalla", async () => {
    serviceMock.mockResolvedValue({ ...data(), products: null, warnings: ["Sin productos"] }); const { result, unmount } = renderHook(() => useMetricsDashboard()); await waitFor(() => expect(result.current.isLoading).toBe(false)); expect(result.current.loadError).toBe(""); expect(result.current.warnings).toEqual(["Sin productos"]); unmount();
  });
  it("presenta vacío crítico si ninguna fuente responde", async () => {
    serviceMock.mockResolvedValue({ requirements: null, products: null, approvals: null, usage: null, activities: [], warnings: ["fallos"] }); const { result, unmount } = renderHook(() => useMetricsDashboard()); await waitFor(() => expect(result.current.isLoading).toBe(false)); expect(result.current.loadError).toContain("indicadores generales"); unmount();
  });
  it("maneja un error inesperado y permite reintentar", async () => {
    serviceMock.mockRejectedValueOnce(new Error("Sin conexión")); const { result, unmount } = renderHook(() => useMetricsDashboard()); await waitFor(() => expect(result.current.loadError).toBe("Sin conexión")); expect(showToast).toHaveBeenCalledWith("Sin conexión", "error"); await act(async () => { await result.current.refresh(); }); expect(result.current.loadError).toBe(""); unmount();
  });
});
function data() { return { requirements: { totalRequirements: 3, completedRequirements: 1, averageHoursByStage: [], byStatus: [], byFaculty: [], byCampus: [], byFormat: [] }, products: { totalProducts: 2, approvedProducts: 1, averageHoursByStage: [], byStatus: [], workloadByResponsible: [], byProductType: [], byDiffusionChannel: [], byMainKpi: [], byTargetAudience: [] }, approvals: { auditEvents: 1, byDecision: [] }, usage: { totalUsers: 1, activeUsers: 1, usersLoggedLast7Days: 1, averageHoursSinceLastLogin: 2, recentUsers: [] }, activities: [], warnings: [] } as never; }

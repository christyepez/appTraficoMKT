import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSession, showToast } from "../../../app/lib";
import { getAuditWorkspace } from "../services/audit.service";
import { useAuditLog } from "./useAuditLog";
vi.mock("../../../app/lib", () => ({ getSession: vi.fn(), showToast: vi.fn() })); vi.mock("../services/audit.service", () => ({ getAuditWorkspace: vi.fn() }));
const serviceMock = vi.mocked(getAuditWorkspace), sessionMock = vi.mocked(getSession);
beforeEach(() => { vi.clearAllMocks(); sessionMock.mockReturnValue({ accessToken: "t", expiresAt: "x", user: { id: "u", name: "A", email: "a@x", roles: ["Auditor"], screenPermissions: ["audit"] } }); serviceMock.mockResolvedValue(data()); });
describe("useAuditLog", () => {
  it("carga, normaliza, filtra y refresca", async () => { const { result, unmount } = renderHook(() => useAuditLog()); await waitFor(() => expect(result.current.isLoading).toBe(false)); expect(result.current.rows).toHaveLength(2); act(() => { result.current.setSource("Productos"); result.current.setSearch("luis"); }); expect(result.current.filteredRows).toHaveLength(1); await act(async () => { await result.current.refresh(); }); expect(serviceMock).toHaveBeenCalledTimes(2); unmount(); });
  it("conserva datos parciales", async () => { serviceMock.mockResolvedValue({ ...data(), products: [], warnings: ["Sin productos"] }); const { result, unmount } = renderHook(() => useAuditLog()); await waitFor(() => expect(result.current.isLoading).toBe(false)); expect(result.current.loadError).toBe(""); expect(result.current.warnings).toHaveLength(1); unmount(); });
  it("presenta error cuando fallan las tres fuentes", async () => { serviceMock.mockResolvedValue({ requirements: [], products: [], approvals: [], warnings: ["r", "p", "a"] }); const { result, unmount } = renderHook(() => useAuditLog()); await waitFor(() => expect(result.current.isLoading).toBe(false)); expect(result.current.loadError).toContain("eventos"); unmount(); });
  it("maneja error inesperado y reintento", async () => { serviceMock.mockRejectedValueOnce(new Error("Sin conexión")); const { result, unmount } = renderHook(() => useAuditLog()); await waitFor(() => expect(result.current.loadError).toBe("Sin conexión")); expect(showToast).toHaveBeenCalledWith("Sin conexión", "error"); await act(async () => { await result.current.refresh(); }); expect(result.current.loadError).toBe(""); unmount(); });
});
function data() { return { requirements: [{ id: "r", requirementId: "req", toStatus: "Draft", action: "Crear", performedBy: "Ana", comments: "", occurredAt: "2026-07-01" }], products: [{ id: "p", activityId: "prod", requirementId: "req", toStatus: "Todo", action: "Crear", performedBy: "Luis", comments: "", occurredAt: "2026-07-02" }], approvals: [], warnings: [] } as never; }

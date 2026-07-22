import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSession, showToast } from "../../../app/lib";
import { deleteRequirement, getRequirementWorkspace, saveRequirement, updateRequirementStatus } from "../services/requirement.service";
import { useRequirementsWorkspace } from "./useRequirementsWorkspace";

vi.mock("../../../app/lib", () => ({ getSession: vi.fn(), showToast: vi.fn() }));
vi.mock("../services/requirement.service", () => ({ getRequirementWorkspace: vi.fn(), saveRequirement: vi.fn(), updateRequirementStatus: vi.fn(), deleteRequirement: vi.fn() }));
const sessionMock = vi.mocked(getSession), workspaceMock = vi.mocked(getRequirementWorkspace), saveMock = vi.mocked(saveRequirement), statusMock = vi.mocked(updateRequirementStatus), deleteMock = vi.mocked(deleteRequirement);

beforeEach(() => {
  vi.clearAllMocks(); sessionMock.mockReturnValue(session("Administrador")); workspaceMock.mockResolvedValue(workspace()); saveMock.mockResolvedValue({} as never); statusMock.mockResolvedValue({} as never); deleteMock.mockResolvedValue({} as never); vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("useRequirementsWorkspace", () => {
  it("carga datos visibles, catálogos y permisos", async () => {
    const { result, unmount } = renderHook(() => useRequirementsWorkspace());
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.requirements).toHaveLength(2); expect(result.current.activities).toHaveLength(1); expect(result.current.permissions.canManage).toBe(true); unmount();
  });

  it("restringe auditoría a consulta", async () => {
    sessionMock.mockReturnValue(session("Auditor")); const { result, unmount } = renderHook(() => useRequirementsWorkspace());
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false)); expect(result.current.permissions).toEqual({ canCreate: false, canManage: false }); unmount();
  });

  it("actualiza al recuperar foco y visibilidad", async () => {
    const { unmount } = renderHook(() => useRequirementsWorkspace()); await waitFor(() => expect(workspaceMock).toHaveBeenCalledTimes(1));
    act(() => window.dispatchEvent(new Event("focus"))); await waitFor(() => expect(workspaceMock).toHaveBeenCalledTimes(2));
    act(() => document.dispatchEvent(new Event("visibilitychange"))); await waitFor(() => expect(workspaceMock).toHaveBeenCalledTimes(3)); unmount();
  });

  it("guarda y refresca", async () => {
    const { result, unmount } = renderHook(() => useRequirementsWorkspace()); await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    await act(async () => { await result.current.save(null, { activityOrEvent: "Feria" } as never); }); expect(saveMock).toHaveBeenCalledTimes(1); expect(workspaceMock).toHaveBeenCalledTimes(2); unmount();
  });

  it("evita doble transición y reporta éxito", async () => {
    let release!: () => void; statusMock.mockReturnValue(new Promise((resolve) => { release = () => resolve({} as never); }));
    const { result, unmount } = renderHook(() => useRequirementsWorkspace()); await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    let first!: Promise<boolean>, second!: Promise<boolean | void>;
    act(() => { first = result.current.changeStatus("r1", "analysis"); second = result.current.changeStatus("r1", "analysis"); });
    await expect(second).resolves.toBe(false); expect(statusMock).toHaveBeenCalledTimes(1); release(); await act(async () => { await first; }); expect(showToast).toHaveBeenCalledWith("Estado actualizado correctamente.", undefined); unmount();
  });

  it("maneja error recuperable y eliminación cancelada", async () => {
    workspaceMock.mockRejectedValueOnce(new Error("Sin conexión")); const { result, unmount } = renderHook(() => useRequirementsWorkspace());
    await waitFor(() => expect(result.current.loadError).toBe("Sin conexión")); expect(showToast).toHaveBeenCalledWith("Sin conexión", "error");
    await act(async () => { await result.current.refresh(); }); expect(result.current.loadError).toBe("");
    vi.mocked(window.confirm).mockReturnValue(false); await act(async () => { expect(await result.current.remove("r1")).toBe(false); }); expect(deleteMock).not.toHaveBeenCalled(); unmount();
  });

  it("elimina y refresca una sola vez", async () => {
    const { result, unmount } = renderHook(() => useRequirementsWorkspace()); await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    await act(async () => { expect(await result.current.remove("r1")).toBe(true); }); expect(deleteMock).toHaveBeenCalledWith("r1"); expect(result.current.message).toBe("Requerimiento eliminado correctamente."); unmount();
  });

  it("reporta errores de mutación y libera el bloqueo", async () => {
    statusMock.mockRejectedValueOnce(new Error("Conflicto")); deleteMock.mockRejectedValueOnce(new Error("No permitido")); const { result, unmount } = renderHook(() => useRequirementsWorkspace()); await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    await act(async () => { expect(await result.current.changeStatus("r1", "analysis")).toBe(false); }); expect(result.current.pendingRequirementIds.size).toBe(0);
    await act(async () => { expect(await result.current.remove("r1")).toBe(false); }); expect(showToast).toHaveBeenCalledWith("No permitido", "error"); unmount();
  });
});

function session(role: string) { return { accessToken: "t", expiresAt: "x", user: { id: "u", name: "Admin", email: "admin@example.com", roles: [role], screenPermissions: ["dashboard"] } }; }
function workspace() { return { requirements: [req("r1", "Draft"), req("r2", "Completed")], activities: [{ id: "p", requirementId: "r1", productResponsible: "tech@example.com" }], catalogs: { faculties: [], careers: [], campuses: [], eventFormats: [] } } as never; }
function req(id: string, status: string) { return { id, code: id, activityOrEvent: "Feria", requestedBy: "owner@example.com", facultyId: "f", faculty: "F", career: "C", campusId: "c", campus: "Centro", place: "P", startDate: "2026-08-01", endDate: "2026-08-02", eventObjective: "O", eventFormatId: "e", eventFormat: "E", requestDate: "2026-07-01", status, statusId: "s" }; }

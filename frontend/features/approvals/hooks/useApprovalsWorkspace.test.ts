import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSession, showToast } from "../../../app/lib";
import { getApprovalWorkspace, submitApproval } from "../services/approval.service";
import { useApprovalsWorkspace } from "./useApprovalsWorkspace";

vi.mock("../../../app/lib", () => ({ getSession: vi.fn(), showToast: vi.fn() }));
vi.mock("../services/approval.service", () => ({ getApprovalWorkspace: vi.fn(), submitApproval: vi.fn() }));
const sessionMock = vi.mocked(getSession);
const workspaceMock = vi.mocked(getApprovalWorkspace);
const submitMock = vi.mocked(submitApproval);

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockReturnValue(session(["Aprobador"]));
  workspaceMock.mockResolvedValue(workspace());
  submitMock.mockResolvedValue(undefined as never);
});

describe("useApprovalsWorkspace", () => {
  it("carga, busca y alterna pendientes/aprobados", async () => {
    const { result, unmount } = renderHook(() => useApprovalsWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.activities.map((item) => item.id)).toEqual(["p1"]);
    act(() => result.current.setShowApproved(true));
    expect(result.current.activities.map((item) => item.id)).toEqual(["p2"]);
    act(() => result.current.setSearch("sin coincidencia"));
    expect(result.current.activities).toEqual([]);
    unmount();
  });

  it("aprueba y rechaza con identidad de sesión", async () => {
    const { result, unmount } = renderHook(() => useApprovalsWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    await act(async () => { expect(await result.current.decide("p1", "Approved", "Correcto")).toBe(true); });
    expect(submitMock).toHaveBeenCalledWith("p1", { decision: "Approved", approvedBy: "Aprobador", comments: "Correcto" });
    expect(showToast).toHaveBeenCalledWith("Producto aprobado correctamente.");
    await act(async () => { expect(await result.current.decide("p1", "Rejected", "Cambios")).toBe(true); });
    expect(result.current.message).toBe("Producto rechazado correctamente.");
    unmount();
  });

  it("bloquea doble envío y usuarios de solo lectura", async () => {
    let finish!: () => void;
    submitMock.mockReturnValueOnce(new Promise((resolve) => { finish = () => resolve(undefined as never); }));
    const { result, unmount } = renderHook(() => useApprovalsWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    let first!: Promise<boolean>;
    await act(async () => { first = result.current.decide("p1", "Approved", "Correcto"); expect(await result.current.decide("p1", "Approved", "Duplicado")).toBe(false); });
    finish();
    await act(async () => { await first; });
    sessionMock.mockReturnValue(session(["Auditor"]));
    await act(async () => { expect(await result.current.decide("p1", "Approved", "No autorizado")).toBe(false); });
    expect(submitMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("expone errores de carga y decisión", async () => {
    workspaceMock.mockRejectedValueOnce(new Error("Sin conexión"));
    const { result, unmount } = renderHook(() => useApprovalsWorkspace(60_000));
    await waitFor(() => expect(result.current.loadError).toBe("Sin conexión"));
    await act(async () => { await result.current.refresh(); });
    submitMock.mockRejectedValueOnce(new Error("Decisión rechazada"));
    await act(async () => { expect(await result.current.decide("p1", "Rejected", "Cambios")).toBe(false); });
    expect(result.current.message).toBe("Decisión rechazada");
    submitMock.mockRejectedValueOnce("sin detalle");
    await act(async () => { expect(await result.current.decide("p1", "Rejected", "Cambios")).toBe(false); });
    expect(result.current.message).toBe("No se pudo registrar la decisión.");
    unmount();
  });

  it("usa el correo cuando el nombre del aprobador no está disponible", async () => {
    sessionMock.mockReturnValue({ ...session(["Aprobador"]), user: { ...session(["Aprobador"]).user, name: undefined as never, email: "aprobador@example.com" } });
    const { result, unmount } = renderHook(() => useApprovalsWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    await act(async () => { await result.current.decide("p1", "Approved", "Correcto"); });
    expect(submitMock).toHaveBeenCalledWith("p1", expect.objectContaining({ approvedBy: "aprobador@example.com" }));
    unmount();
  });
});

function session(roles: string[]) { return { accessToken: "t", expiresAt: "x", user: { id: "u", name: "Aprobador", email: "a@x", roles, screenPermissions: ["approvals"] } }; }
function workspace() {
  const activity = (id: string, status: string) => ({ id, requirementId: "r", productId: id, requirementTypeId: "r", requirementType: "Diseño", strategicObjective: "Marca", targetAudienceId: "t", targetAudience: "Todos", productTypeId: "p", productType: "Video", diffusionChannelId: "d", diffusionChannel: "Web", mainKpiId: "k", mainKpi: "Alcance", productResponsible: "tech@example.com", observations: "", status, statusId: "s" });
  return { activities: [activity("p1", "PendingApproval"), activity("p2", "Approved")], evidence: [{ id: "e1", activityId: "p1", fileName: "a.pdf", storageUrl: "/a", uploadedBy: "Equipo" }], approvals: [{ id: "a1", activityId: "p2", decision: "Approved", approvedBy: "A", comments: "Ok" }] };
}

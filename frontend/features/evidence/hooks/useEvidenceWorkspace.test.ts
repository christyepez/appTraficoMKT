import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSession, showToast } from "../../../app/lib";
import { createExternalEvidence, deleteEvidence, getEvidenceWorkspace, markEvidenceAttached, uploadEvidence } from "../services/evidence.service";
import { useEvidenceWorkspace } from "./useEvidenceWorkspace";

vi.mock("../../../app/lib", () => ({ getSession: vi.fn(), showToast: vi.fn() }));
vi.mock("../services/evidence.service", () => ({ createExternalEvidence: vi.fn(), deleteEvidence: vi.fn(), getEvidenceWorkspace: vi.fn(), markEvidenceAttached: vi.fn(), uploadEvidence: vi.fn() }));

const workspaceMock = vi.mocked(getEvidenceWorkspace);
const sessionMock = vi.mocked(getSession);
const uploadMock = vi.mocked(uploadEvidence);
const externalMock = vi.mocked(createExternalEvidence);
const markMock = vi.mocked(markEvidenceAttached);
const deleteMock = vi.mocked(deleteEvidence);

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockReturnValue({ accessToken: "token", expiresAt: "2099", user: { id: "u1", name: "Técnico", email: "tech@example.com", roles: ["Tecnico"], screenPermissions: ["evidence"] } });
  workspaceMock.mockResolvedValue(workspace());
  uploadMock.mockResolvedValue({} as never);
  externalMock.mockResolvedValue({} as never);
  markMock.mockResolvedValue(undefined as never);
  deleteMock.mockResolvedValue(undefined as never);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("useEvidenceWorkspace", () => {
  it("filtra productos, evidencias y aprobaciones por sesión", async () => {
    const { result, unmount } = renderHook(() => useEvidenceWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.activities.map((item) => item.id)).toEqual(["p1"]);
    expect(result.current.evidence.map((item) => item.id)).toEqual(["e1"]);
    expect(result.current.approvals.map((item) => item.id)).toEqual(["a1"]);
    unmount();
  });

  it("carga archivo y enlace sin duplicar operaciones", async () => {
    let finish!: () => void;
    uploadMock.mockReturnValueOnce(new Promise((resolve) => { finish = () => resolve({} as never); }));
    const { result, unmount } = renderHook(() => useEvidenceWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    let first!: Promise<boolean>;
    await act(async () => {
      first = result.current.uploadFile("p1", new File(["x"], "a.pdf"), "Equipo");
      expect(await result.current.uploadFile("p1", new File(["x"], "b.pdf"), "Equipo")).toBe(false);
    });
    finish();
    await act(async () => { expect(await first).toBe(true); });
    expect(markMock).toHaveBeenCalledWith("p1");
    await act(async () => { expect(await result.current.uploadUrl("p1", "video", "https://example.com", "Equipo")).toBe(true); });
    expect(externalMock).toHaveBeenCalledWith(expect.objectContaining({ fileName: "video" }));
    unmount();
  });

  it("elimina con confirmación y expone errores recuperables", async () => {
    const { result, unmount } = renderHook(() => useEvidenceWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    await act(async () => { expect(await result.current.remove("e1")).toBe(true); });
    expect(deleteMock).toHaveBeenCalledWith("e1");
    deleteMock.mockRejectedValueOnce(new Error("Bloqueado"));
    await act(async () => { expect(await result.current.remove("e1")).toBe(false); });
    expect(result.current.message).toBe("Bloqueado");
    expect(showToast).toHaveBeenCalledWith("Bloqueado", "error");
    unmount();
  });

  it("muestra error de carga y permite reintentar", async () => {
    workspaceMock.mockRejectedValueOnce(new Error("Sin conexión"));
    const { result, unmount } = renderHook(() => useEvidenceWorkspace(60_000));
    await waitFor(() => expect(result.current.loadError).toBe("Sin conexión"));
    await act(async () => { await result.current.refresh(); });
    expect(result.current.loadError).toBe("");
    unmount();
  });

  it("refresca con eventos de ventana y permite cancelar una eliminación", async () => {
    const { result, unmount } = renderHook(() => useEvidenceWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    const calls = workspaceMock.mock.calls.length;
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    await waitFor(() => expect(workspaceMock.mock.calls.length).toBeGreaterThan(calls));
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("pageshow"));
    });
    await waitFor(() => expect(workspaceMock.mock.calls.length).toBeGreaterThan(calls + 1));
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    await act(async () => { expect(await result.current.remove("e1")).toBe(false); });
    expect(deleteMock).not.toHaveBeenCalled();
    unmount();
  });

  it("usa feedback genérico cuando una operación falla sin Error", async () => {
    externalMock.mockRejectedValueOnce("fallo");
    const { result, unmount } = renderHook(() => useEvidenceWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    await act(async () => { expect(await result.current.uploadUrl("p1", "video", "https://example.com", "Equipo")).toBe(false); });
    expect(result.current.message).toBe("No se pudo completar la operación.");
    unmount();
  });
});

function workspace() {
  const requirement = (id: string, requestedBy: string) => ({ id, code: id, activityOrEvent: "Evento", requestedBy, facultyId: "f", faculty: "F", career: "C", campusId: "c", campus: "C", place: "P", startDate: "2026-01-01", endDate: "2026-01-02", eventObjective: "O", eventFormatId: "e", eventFormat: "E", requestDate: "2026-01-01", status: "InProgress", statusId: "s" });
  const activity = (id: string, requirementId: string, responsible: string) => ({ id, requirementId, productId: id, requirementTypeId: "r", requirementType: "R", strategicObjective: "O", targetAudienceId: "t", targetAudience: "T", productTypeId: "p", productType: "Video", diffusionChannelId: "d", diffusionChannel: "Web", mainKpiId: "k", mainKpi: "K", productResponsible: responsible, observations: "", status: "InProgress", statusId: "s" });
  return { requirements: [requirement("r1", "tech@example.com"), requirement("r2", "other@example.com")], activities: [activity("p1", "r1", "tech@example.com"), activity("p2", "r2", "other@example.com")], evidence: [{ id: "e1", activityId: "p1", fileName: "a.pdf", storageUrl: "/a", uploadedBy: "Equipo" }, { id: "e2", activityId: "p2", fileName: "b.pdf", storageUrl: "/b", uploadedBy: "Equipo" }], approvals: [{ id: "a1", activityId: "p1", decision: "Approved", approvedBy: "A", comments: "" }, { id: "a2", activityId: "p2", decision: "Approved", approvedBy: "A", comments: "" }] };
}

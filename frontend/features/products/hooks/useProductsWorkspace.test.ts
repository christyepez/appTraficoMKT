import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSession, showToast } from "../../../app/lib";
import type { AuthSession } from "../../../app/lib";
import type { Activity, Requirement } from "../../../shared/models/api.models";
import type { ProductWorkspaceData } from "../models/product.models";
import { createExternalProductEvidence, deleteProduct, deleteProductEvidence, getProductWorkspace, saveProduct, updateProductStatus, uploadProductEvidence } from "../services/product.service";
import { useProductsWorkspace } from "./useProductsWorkspace";

vi.mock("../../../app/lib", () => ({
  defaultBrandSettings: { showProductIdField: false },
  getSession: vi.fn(),
  showToast: vi.fn()
}));

vi.mock("../services/product.service", () => ({
  createExternalProductEvidence: vi.fn(),
  deleteProduct: vi.fn(),
  deleteProductEvidence: vi.fn(),
  getProductWorkspace: vi.fn(),
  saveProduct: vi.fn(),
  updateProductStatus: vi.fn(),
  uploadProductEvidence: vi.fn()
}));

const getWorkspaceMock = vi.mocked(getProductWorkspace);
const getSessionMock = vi.mocked(getSession);
const updateStatusMock = vi.mocked(updateProductStatus);
const deleteProductMock = vi.mocked(deleteProduct);
const saveProductMock = vi.mocked(saveProduct);
const uploadEvidenceMock = vi.mocked(uploadProductEvidence);
const externalEvidenceMock = vi.mocked(createExternalProductEvidence);
const deleteEvidenceMock = vi.mocked(deleteProductEvidence);

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockReturnValue(session());
  getWorkspaceMock.mockResolvedValue(workspace());
  updateStatusMock.mockResolvedValue(undefined as never);
  deleteProductMock.mockResolvedValue(undefined as never);
  saveProductMock.mockResolvedValue({} as never);
  uploadEvidenceMock.mockResolvedValue({} as never);
  externalEvidenceMock.mockResolvedValue({} as never);
  deleteEvidenceMock.mockResolvedValue(undefined as never);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("useProductsWorkspace", () => {
  it("carga y filtra el workspace según la sesión", async () => {
    const { result, unmount } = renderHook(() => useProductsWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    expect(result.current.requirements.map((item) => item.id)).toEqual(["req1"]);
    expect(result.current.products.map((item) => item.id)).toEqual(["product1", "product2"]);
    expect(result.current.evidence.map((item) => item.id)).toEqual(["evidence1"]);
    expect(result.current.technicians.map((item) => item.id)).toEqual(["tech1"]);
    expect(result.current.suggestedProductId).toBe("PROD-0004");
    unmount();
  });

  it("mantiene acceso completo y técnicos vacíos sin sesión", async () => {
    getSessionMock.mockReturnValue(null);
    getWorkspaceMock.mockResolvedValue({ ...workspace(), technicians: [] });
    const { result, unmount } = renderHook(() => useProductsWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.products).toHaveLength(3);
    expect(result.current.technicians).toEqual([]);
    unmount();
  });

  it("expone error recuperable y permite reintentar", async () => {
    getWorkspaceMock.mockRejectedValueOnce(new Error("No hay conexión."));
    const { result, unmount } = renderHook(() => useProductsWorkspace(60_000));
    await waitFor(() => expect(result.current.loadError).toBe("No hay conexión."));
    expect(showToast).toHaveBeenCalledWith("No hay conexión.", "error");

    await act(async () => { await result.current.refresh(); });
    expect(result.current.loadError).toBe("");
    expect(result.current.products).toHaveLength(2);
    unmount();
  });

  it("evita transiciones duplicadas mientras una acción está pendiente", async () => {
    let resolveStatus!: () => void;
    updateStatusMock.mockReturnValue(new Promise<void>((resolve) => { resolveStatus = resolve; }) as never);
    const { result, unmount } = renderHook(() => useProductsWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    let first!: Promise<void>;
    await act(async () => {
      first = result.current.changeStatus("product1", "start");
      void result.current.changeStatus("product1", "start");
    });
    expect(updateStatusMock).toHaveBeenCalledTimes(1);
    expect(result.current.pendingProductIds.has("product1")).toBe(true);

    resolveStatus();
    await act(async () => { await first; });
    expect(result.current.pendingProductIds.has("product1")).toBe(false);
    expect(showToast).toHaveBeenCalledWith("Estado actualizado correctamente.", undefined);
    unmount();
  });

  it("reporta errores de transición y libera la acción", async () => {
    updateStatusMock.mockRejectedValueOnce(new Error("Transición rechazada."));
    const { result, unmount } = renderHook(() => useProductsWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    await act(async () => { await result.current.changeStatus("product1", "start"); });
    expect(result.current.message).toBe("Transición rechazada.");
    expect(result.current.pendingProductIds.size).toBe(0);
    expect(showToast).toHaveBeenCalledWith("Transición rechazada.", "error");
    unmount();
  });

  it("confirma eliminación y refresca después de guardar", async () => {
    const { result, unmount } = renderHook(() => useProductsWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    await act(async () => { await result.current.remove("product1"); });
    expect(deleteProductMock).toHaveBeenCalledWith("product1");

    await act(async () => { await result.current.save(null, { requirementId: "req1" } as never); });
    expect(saveProductMock).toHaveBeenCalled();
    expect(getWorkspaceMock.mock.calls.length).toBeGreaterThanOrEqual(3);
    unmount();
  });

  it("expone el error de eliminación y libera el producto", async () => {
    deleteProductMock.mockRejectedValueOnce(new Error("No se pudo eliminar."));
    const { result, unmount } = renderHook(() => useProductsWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    await act(async () => { await result.current.remove("product1"); });
    expect(result.current.message).toBe("No se pudo eliminar.");
    expect(result.current.pendingProductIds.size).toBe(0);
    unmount();
  });

  it("carga archivo y enlace, actualiza estado y elimina evidencia", async () => {
    const { result, unmount } = renderHook(() => useProductsWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    const file = new File(["contenido"], "archivo.pdf", { type: "application/pdf" });

    await act(async () => { expect(await result.current.uploadEvidence("product1", file, "Equipo")).toBe(true); });
    expect(uploadEvidenceMock).toHaveBeenCalledWith(expect.any(FormData));
    expect(updateStatusMock).toHaveBeenCalledWith("product1", "evidence-attached");

    await act(async () => { expect(await result.current.addExternalEvidence("product1", "Video", "https://example.com/video", "Equipo")).toBe(true); });
    expect(externalEvidenceMock).toHaveBeenCalledWith(expect.objectContaining({ fileName: "Video", storageUrl: "https://example.com/video" }));

    await act(async () => { expect(await result.current.removeEvidence("evidence1")).toBe(true); });
    expect(deleteEvidenceMock).toHaveBeenCalledWith("evidence1");
    unmount();
  });

  it("maneja fallos y duplicados de evidencia", async () => {
    let resolveUpload!: () => void;
    uploadEvidenceMock.mockReturnValueOnce(new Promise((resolve) => { resolveUpload = () => resolve({}); }) as never);
    const { result, unmount } = renderHook(() => useProductsWorkspace(60_000));
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    const file = new File(["contenido"], "archivo.pdf", { type: "application/pdf" });

    let first!: Promise<boolean>;
    await act(async () => {
      first = result.current.uploadEvidence("product1", file, "Equipo");
      expect(await result.current.uploadEvidence("product1", file, "Equipo")).toBe(false);
    });
    resolveUpload();
    await act(async () => { await first; });
    expect(uploadEvidenceMock).toHaveBeenCalledTimes(1);

    uploadEvidenceMock.mockRejectedValueOnce("sin detalle");
    await act(async () => { expect(await result.current.uploadEvidence("product1", file, "Equipo")).toBe(false); });
    externalEvidenceMock.mockRejectedValueOnce(new Error("Enlace rechazado."));
    await act(async () => { expect(await result.current.addExternalEvidence("product1", "Video", "https://example.com", "Equipo")).toBe(false); });
    externalEvidenceMock.mockRejectedValueOnce("sin detalle");
    await act(async () => { expect(await result.current.addExternalEvidence("product1", "Video", "https://example.com", "Equipo")).toBe(false); });
    deleteEvidenceMock.mockRejectedValueOnce(new Error("Adjunto bloqueado."));
    await act(async () => { expect(await result.current.removeEvidence("evidence1")).toBe(false); });
    deleteEvidenceMock.mockRejectedValueOnce("sin detalle");
    await act(async () => { expect(await result.current.removeEvidence("evidence1")).toBe(false); });
    expect(result.current.pendingEvidenceIds.size).toBe(0);
    unmount();
  });
});

function session(): AuthSession {
  return {
    accessToken: "token",
    expiresAt: "2099-01-01",
    user: { id: "tech1", name: "Técnico Uno", email: "tech@example.com", roles: ["Tecnico"], screenPermissions: ["activities"] }
  };
}

function workspace(): ProductWorkspaceData {
  const requirements = [requirement(), requirement({ id: "req2", requestedBy: "other@example.com" })];
  const products = [
    product(),
    product({ id: "product2", requirementId: "req2", productId: "PROD-0002", productResponsible: "tech@example.com" }),
    product({ id: "product3", requirementId: "req2", productId: "PROD-0003", productResponsible: "other@example.com" })
  ];
  return {
    requirements,
    products,
    evidence: [{ id: "evidence1", activityId: "product1", fileName: "uno.pdf", storageUrl: "/uno.pdf", uploadedBy: "Equipo" }, { id: "evidence2", activityId: "product3", fileName: "dos.pdf", storageUrl: "/dos.pdf", uploadedBy: "Equipo" }],
    approvals: [],
    technicians: [{ id: "tech1", name: "Técnico Uno", email: "tech@example.com", roles: ["Técnico"], isActive: true }, { id: "inactive", name: "Inactivo", email: "inactive@example.com", roles: ["Tecnico"], isActive: false }],
    nextProductId: "PROD-0004",
    showProductIdField: true,
    catalogs: { requirementTypes: [], targetAudiences: [], productTypes: [], diffusionChannels: [], mainKpis: [] }
  };
}

function requirement(overrides: Partial<Requirement> = {}): Requirement {
  return {
    id: "req1", code: "REQ-1", activityOrEvent: "Evento", requestedBy: "tech@example.com", facultyId: "f1", faculty: "Facultad", career: "Carrera", campusId: "c1", campus: "Campus", place: "Auditorio", startDate: "2026-08-01", endDate: "2026-08-02", eventObjective: "Objetivo", eventFormatId: "ef1", eventFormat: "Presencial", requestDate: "2026-07-01", status: "InProgress", statusId: "s1", ...overrides
  };
}

function product(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "product1", requirementId: "req1", productId: "PROD-0001", requirementTypeId: "rt1", requirementType: "Diseño", strategicObjective: "Difusión", targetAudienceId: "ta1", targetAudience: "Estudiantes", productTypeId: "pt1", productType: "Video", diffusionChannelId: "dc1", diffusionChannel: "Instagram", mainKpiId: "k1", mainKpi: "Alcance", productResponsible: "other@example.com", observations: "Campaña", status: "Todo", statusId: "s1", ...overrides
  };
}

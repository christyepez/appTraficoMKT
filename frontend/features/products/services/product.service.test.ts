import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, defaultBrandSettings } from "../../../app/lib";
import type { Activity } from "../../../shared/models/api.models";
import { createExternalProductEvidence, deleteProduct, deleteProductEvidence, getProductWorkspace, saveProduct, updateProductStatus, uploadProductEvidence } from "./product.service";

vi.mock("../../../app/lib", () => ({
  api: vi.fn(),
  defaultBrandSettings: { showProductIdField: false }
}));

const apiMock = vi.mocked(api);
const activeCatalog = [{ id: "1", type: "Tipo", code: "A", name: "Activo", isActive: true }, { id: "2", type: "Tipo", code: "I", name: "Inactivo", isActive: false }];

beforeEach(() => apiMock.mockReset());

describe("getProductWorkspace", () => {
  it("consolida datos y filtra catálogos activos", async () => {
    apiMock.mockImplementation((url: string) => {
      const path = String(url ?? "");
      const responses: Record<string, unknown> = {
        "/api/requirements": [{ id: "r1" }],
        "/api/activities": [{ id: "p1" }],
        "/api/evidence": [{ id: "e1" }],
        "/api/approvals": [{ id: "a1" }],
        "/api/identity/users/technicians": [{ id: "u1" }],
        "/api/activities/next-product-id": { productId: "PROD-0002" },
        "/api/identity/brand-settings": { ...defaultBrandSettings, showProductIdField: true }
      };
      return Promise.resolve(path.startsWith("/api/admin/catalogs/by-type/") ? activeCatalog : responses[path]) as never;
    });

    const result = await getProductWorkspace();
    expect(result.nextProductId).toBe("PROD-0002");
    expect(result.showProductIdField).toBe(true);
    expect(result.catalogs.requirementTypes).toEqual([activeCatalog[0]]);
    expect(result.catalogs.mainKpis).toEqual([activeCatalog[0]]);
    expect(apiMock).toHaveBeenCalledTimes(12);
  });

  it("usa valores seguros cuando endpoints opcionales fallan", async () => {
    apiMock.mockImplementation((url: string) => {
      const path = String(url ?? "");
      if (["/api/approvals", "/api/identity/users/technicians", "/api/activities/next-product-id", "/api/identity/brand-settings"].includes(path)) return Promise.reject(new Error("optional")) as never;
      if (path.startsWith("/api/admin/catalogs/by-type/")) return Promise.resolve([]) as never;
      return Promise.resolve([]) as never;
    });

    const result = await getProductWorkspace();
    expect(result.approvals).toEqual([]);
    expect(result.technicians).toEqual([]);
    expect(result.nextProductId).toBeNull();
    expect(result.showProductIdField).toBe(false);
  });
});

describe("product commands", () => {
  const existing = { id: "p1" } as Activity;
  const payload = { requirementId: "r1" } as never;

  it("crea y actualiza productos", async () => {
    apiMock.mockResolvedValue({} as never);
    await saveProduct(null, payload);
    expect(apiMock).toHaveBeenLastCalledWith("/api/activities", expect.objectContaining({ method: "POST" }));
    await saveProduct(existing, payload);
    expect(apiMock).toHaveBeenLastCalledWith("/api/activities/p1", expect.objectContaining({ method: "PUT" }));
  });

  it("ejecuta transiciones y eliminaciones", async () => {
    apiMock.mockResolvedValue(undefined as never);
    await updateProductStatus("p1", "start");
    expect(apiMock).toHaveBeenLastCalledWith("/api/activities/p1/start", { method: "PATCH" });
    await deleteProduct("p1");
    expect(apiMock).toHaveBeenLastCalledWith("/api/activities/p1", { method: "DELETE" });
    await deleteProductEvidence("e1");
    expect(apiMock).toHaveBeenLastCalledWith("/api/evidence/e1", { method: "DELETE" });
  });

  it("carga archivos y registra enlaces externos", async () => {
    apiMock.mockResolvedValue({} as never);
    const form = new FormData();
    await uploadProductEvidence(form);
    expect(apiMock).toHaveBeenLastCalledWith("/api/evidence/upload", { method: "POST", body: form });
    const external = { activityId: "p1", fileName: "Video", contentType: "text/uri-list", storageUrl: "https://example.com", uploadedBy: "Equipo" } as const;
    await createExternalProductEvidence(external);
    expect(apiMock).toHaveBeenLastCalledWith("/api/evidence", expect.objectContaining({ method: "POST", body: JSON.stringify(external) }));
  });
});

import { api, defaultBrandSettings, type BrandSettings } from "../../../app/lib";
import type { Activity, Requirement } from "../../../shared/models/api.models";
import type { Approval, CatalogItem, EvidenceItem, ExternalEvidencePayload, ProductWorkspaceData, SaveProductPayload, Technician } from "../models/product.models";

const catalogEndpoint = "/api/admin/catalogs/by-type";

export async function getProductWorkspace(): Promise<ProductWorkspaceData> {
  const [requirements, products, evidence, approvals, technicians, nextProduct, brand, requirementTypes, targetAudiences, productTypes, diffusionChannels, mainKpis] = await Promise.all([
    api<Requirement[]>("/api/requirements"),
    api<Activity[]>("/api/activities"),
    api<EvidenceItem[]>("/api/evidence"),
    api<Approval[]>("/api/approvals").catch(() => []),
    api<Technician[]>("/api/identity/users/technicians").catch(() => []),
    api<{ productId: string }>("/api/activities/next-product-id").catch(() => null),
    api<BrandSettings>("/api/identity/brand-settings").catch(() => defaultBrandSettings),
    getActiveCatalog("TipoRequerimiento"),
    getActiveCatalog("PublicoObjetivo"),
    getActiveCatalog("TipoProducto"),
    getActiveCatalog("CanalDifusion"),
    getActiveCatalog("KpiPrincipal")
  ]);

  return {
    requirements,
    products,
    evidence,
    approvals,
    technicians,
    nextProductId: nextProduct?.productId ?? null,
    showProductIdField: Boolean(brand.showProductIdField),
    catalogs: { requirementTypes, targetAudiences, productTypes, diffusionChannels, mainKpis }
  };
}

export function saveProduct(product: Activity | null, payload: SaveProductPayload) {
  return api<Activity>(`/api/activities${product ? `/${product.id}` : ""}`, {
    method: product ? "PUT" : "POST",
    body: JSON.stringify(payload)
  });
}

export function updateProductStatus(productId: string, action: "start" | "submit-approval" | "evidence-attached") {
  return api(`/api/activities/${productId}/${action}`, { method: "PATCH" });
}

export function deleteProduct(productId: string) {
  return api(`/api/activities/${productId}`, { method: "DELETE" });
}

export function deleteProductEvidence(evidenceId: string) {
  return api(`/api/evidence/${evidenceId}`, { method: "DELETE" });
}

export function uploadProductEvidence(form: FormData) {
  return api<EvidenceItem>("/api/evidence/upload", { method: "POST", body: form });
}

export function createExternalProductEvidence(payload: ExternalEvidencePayload) {
  return api<EvidenceItem>("/api/evidence", { method: "POST", body: JSON.stringify(payload) });
}

async function getActiveCatalog(type: string) {
  const items = await api<CatalogItem[]>(`${catalogEndpoint}/${type}`);
  return items.filter((item) => item.isActive);
}

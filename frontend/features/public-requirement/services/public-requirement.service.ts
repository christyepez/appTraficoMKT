import { api, defaultBrandSettings, type BrandSettings } from "../../../app/lib";
import type { PublicCatalog, PublicRequirementCatalogs, PublicRequirementPayload } from "../models/public-requirement.models";

export async function getPublicRequirementCatalogs(): Promise<PublicRequirementCatalogs> {
  const [faculties, careers, campuses, eventFormats] = await Promise.all([
    api<PublicCatalog[]>("/api/admin/faculties"),
    api<PublicCatalog[]>("/api/admin/careers"),
    api<PublicCatalog[]>("/api/admin/campuses"),
    api<PublicCatalog[]>("/api/admin/catalogs/by-type/FormatoEvento")
  ]);
  const active = (items: PublicCatalog[]) => items.filter((item) => item.isActive);
  return { faculties: active(faculties), careers: active(careers), campuses: active(campuses), eventFormats: active(eventFormats) };
}

export async function getPublicBrandSettings() {
  const settings = await api<BrandSettings>("/api/identity/brand-settings");
  return { ...defaultBrandSettings, ...settings };
}

export function createPublicRequirement(payload: PublicRequirementPayload) {
  return api("/api/requirements", { method: "POST", body: JSON.stringify(payload) });
}

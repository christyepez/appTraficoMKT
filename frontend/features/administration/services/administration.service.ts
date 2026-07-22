import { api } from "../../../app/lib";
import type { NamedCatalog } from "../../../shared/models/api.models";
import type { CatalogKind, CatalogPayload, CatalogRow } from "../models/administration.models";
export async function getCatalogAdministration(kind: CatalogKind, type: string) {
  const path = kind === "catalogs" ? `/api/admin/catalogs/by-type/${encodeURIComponent(type)}` : `/api/admin/${kind}`;
  const [items, faculties] = await Promise.all([api<CatalogRow[]>(path), api<NamedCatalog[]>("/api/admin/faculties")]);
  return { items, faculties };
}
export function saveCatalogRow(kind: CatalogKind, row: CatalogRow | null, payload: CatalogPayload) {
  const { variant: _variant, ...body } = payload;
  return api(`/api/admin/${kind}${row ? `/${row.id}` : ""}`, { method: row ? "PUT" : "POST", body: JSON.stringify(body) });
}
export function disableCatalogRow(kind: CatalogKind, id: string) { return api(`/api/admin/${kind}/${id}`, { method: "DELETE" }); }

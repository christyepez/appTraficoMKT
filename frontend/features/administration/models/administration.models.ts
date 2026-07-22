import type { Approver, NamedCatalog } from "../../../shared/models/api.models";
export type CatalogKind = "faculties" | "campuses" | "careers" | "catalogs" | "approvers";
export type Career = NamedCatalog & { facultyId: string };
export type CatalogRow = NamedCatalog | Career | Approver;
export type CatalogGroup = { kind: CatalogKind; label: string; type?: string };
export type CatalogVariant = Exclude<CatalogKind, "approvers">;
export type CatalogPayload =
  | { variant: "faculties" | "campuses"; code: string; name: string; isActive: boolean }
  | { variant: "careers"; code: string; name: string; facultyId: string; isActive: boolean }
  | { variant: "catalogs"; type: string; code: string; name: string; isActive: boolean }
  | { variant: "approvers"; name: string; email: string; approvalLevel: number; facultyId: string | null; campusId: null; isActive: boolean };
export const catalogTypes = ["EstadoRequerimiento", "FormatoEvento", "EstadoProducto", "TipoProducto", "TipoRequerimiento", "PublicoObjetivo", "CanalDifusion", "KpiPrincipal"] as const;
export const catalogGroups: CatalogGroup[] = [{ kind: "faculties", label: "Facultades" }, { kind: "careers", label: "Carreras" }, { kind: "campuses", label: "Sedes" }, { kind: "approvers", label: "Aprobadores" }, ...catalogTypes.map((type) => ({ kind: "catalogs" as const, label: type, type }))];

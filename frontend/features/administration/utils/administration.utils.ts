import type { Approver, NamedCatalog } from "../../../shared/models/api.models";
import type { Career, CatalogKind, CatalogPayload, CatalogRow, CatalogVariant } from "../models/administration.models";
import type { AdministrationFormValues } from "../schemas/administration.schema";
export function groupLabel(kind: CatalogKind, type: string) { return kind === "faculties" ? "Facultades" : kind === "careers" ? "Carreras" : kind === "campuses" ? "Sedes" : kind === "approvers" ? "Aprobadores" : type; }
export function rowTitle(row: CatalogRow) { return "code" in row && row.code ? `${row.code} - ${row.name}` : row.name; }
export function facultyName(faculties: NamedCatalog[], id?: string | null) { return faculties.find((item) => item.id === id)?.name ?? "Sin facultad"; }
export function catalogDefaults(kind: CatalogVariant, type: string, row: CatalogRow | null): AdministrationFormValues {
  const named = row && "code" in row ? row as NamedCatalog : null; const career = row && "facultyId" in row ? row as Career : null;
  if (kind === "careers") return { variant: kind, code: named?.code ?? "", name: row?.name ?? "", facultyId: career?.facultyId ?? "", isActive: row?.isActive ?? true };
  if (kind === "catalogs") return { variant: kind, type, code: named?.code ?? "", name: row?.name ?? "", isActive: row?.isActive ?? true };
  return { variant: kind, code: named?.code ?? "", name: row?.name ?? "", isActive: row?.isActive ?? true };
}
export function approverDefaults(row: CatalogRow | null): AdministrationFormValues { const value = row as Approver | null; return { variant: "approvers", name: value?.name ?? "", email: value?.email ?? "", facultyId: value?.facultyId ?? "", approvalLevel: value?.approvalLevel ?? 1, isActive: value?.isActive ?? true }; }
export function toCatalogPayload(values: AdministrationFormValues): CatalogPayload { return values.variant === "approvers" ? { ...values, facultyId: values.facultyId || null, campusId: null } : values; }

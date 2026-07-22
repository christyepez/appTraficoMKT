"use client";
import { zodResolver } from "@hookform/resolvers/zod"; import { useForm } from "react-hook-form";
import type { NamedCatalog } from "../../../shared/models/api.models";
import type { CatalogPayload, CatalogRow, CatalogVariant } from "../models/administration.models";
import { catalogFormSchema, type CatalogFormValues } from "../schemas/administration.schema";
import { catalogDefaults, groupLabel, toCatalogPayload } from "../utils/administration.utils";
import { AdministrationDialog } from "./AdministrationDialog";
export function CatalogForm({ kind, type, row, faculties, onSave, onClose }: { kind: CatalogVariant; type: string; row: CatalogRow | null; faculties: NamedCatalog[]; onSave: (row: CatalogRow | null, payload: CatalogPayload) => Promise<unknown>; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CatalogFormValues>({ resolver: zodResolver(catalogFormSchema), defaultValues: catalogDefaults(kind, type, row) as CatalogFormValues });
  async function submit(values: CatalogFormValues) { await onSave(row, toCatalogPayload(values)); onClose(); }
  return <AdministrationDialog title={`${row ? "Editar" : "Crear"} ${groupLabel(kind, type)}`} saving={isSubmitting} onClose={onClose}><form className="form top-space" noValidate onSubmit={handleSubmit(submit)}><input type="hidden" {...register("variant")} />{kind === "catalogs" && <Field label="Tipo de catálogo" error={fieldError(errors, "type")}><input {...register("type")} /></Field>}<Field label="Código" error={errors.code?.message}><input {...register("code")} /></Field><Field label="Nombre" error={errors.name?.message}><input {...register("name")} /></Field>{kind === "careers" && <Field label="Facultad" error={fieldError(errors, "facultyId")}><select {...register("facultyId")}><option value="">Seleccione…</option>{faculties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>}<label className="check-field field-wide"><input type="checkbox" {...register("isActive")} /> Activo</label><Actions saving={isSubmitting} editing={Boolean(row)} onClose={onClose} /></form></AdministrationDialog>;
}
function fieldError(errors: object, key: string) { return (errors as Record<string, { message?: string } | undefined>)[key]?.message; }
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}{error && <small role="alert">{error}</small>}</label>; }
function Actions({ saving, editing, onClose }: { saving: boolean; editing: boolean; onClose: () => void }) { return <div className="form-actions"><button className="button" disabled={saving}>{saving ? "Guardando" : editing ? "Guardar" : "Crear"}</button><button className="button secondary" type="button" disabled={saving} onClick={onClose}>Cancelar</button></div>; }

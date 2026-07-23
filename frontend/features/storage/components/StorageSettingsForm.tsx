"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AccessibleDialog } from "../../../shared/components/AccessibleDialog";
import type { StorageSettings } from "../models/storage.models";
import { storageSettingsSchema, type StorageFormValues } from "../schemas/storage.schema";
import { storageFormDefaults, storagePayload } from "../utils/storage.utils";

export function StorageSettingsForm({ item, onSave, onClose }: { item: StorageSettings | null; onSave: (id: string, payload: ReturnType<typeof storagePayload>) => Promise<unknown>; onClose: () => void }) {
  const [error, setError] = useState("");
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<StorageFormValues>({ resolver: zodResolver(storageSettingsSchema), defaultValues: storageFormDefaults(item) });
  const provider = useWatch({ control, name: "provider" });

  async function submit(value: StorageFormValues) {
    setError("");
    try {
      await onSave(item?.id ?? "", storagePayload(value));
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar.");
    }
  }

  function change(nextProvider: "Local" | "Blob" | "Ftp") {
    reset(storageFormDefaults({ ...item, ...storageFormDefaults(item), provider: nextProvider } as StorageSettings));
  }

  return <AccessibleDialog labelledBy="storage-form-title" onClose={onClose} closeDisabled={isSubmitting}>
    <h2 id="storage-form-title">{item ? "Editar configuración" : "Crear configuración"}</h2>
    <form className="form top-space" noValidate onSubmit={handleSubmit(submit)}>
      <input type="hidden" {...register("id")}/>
      <label className="field"><span>Nombre</span><input {...register("name")}/></label>
      <label className="field"><span>Proveedor</span><select value={provider} onChange={(event) => change(event.target.value as typeof provider)}><option>Local</option><option>Blob</option><option>Ftp</option></select></label>
      {provider === "Local" && <label className="field field-wide"><span>Ruta local</span><input {...register("localPath")}/></label>}
      {provider === "Blob" && <><label className="field field-wide"><span>Nueva conexión Blob</span><input type="password" autoComplete="new-password" {...register("blobConnectionString")}/><small>El valor almacenado nunca se muestra; ingrese un reemplazo para guardar.</small></label><label className="field"><span>Contenedor Blob</span><input {...register("blobContainer")}/></label></>}
      {provider === "Ftp" && <><label className="field"><span>Host FTP</span><input {...register("ftpHost")}/></label><label className="field"><span>Usuario FTP</span><input {...register("ftpUser")}/></label><label className="field"><span>Nueva clave FTP</span><input type="password" autoComplete="new-password" {...register("ftpPassword")}/><small>La clave almacenada nunca se muestra.</small></label></>}
      {Object.values(errors)[0]?.message && <p role="alert">{String(Object.values(errors)[0]?.message)}</p>}
      <div className="check-group">
        <label className="check-field">Usar cloud en producción<input type="checkbox" {...register("isProductionCloudEnabled")}/></label>
        <label className="check-field">Activo<input type="checkbox" {...register("isActive")}/></label>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="form-actions"><button className="button" disabled={isSubmitting}>{isSubmitting ? "Guardando" : item ? "Guardar" : "Crear"}</button><button className="button secondary" type="button" disabled={isSubmitting} onClick={onClose}>Cancelar</button></div>
    </form>
  </AccessibleDialog>;
}

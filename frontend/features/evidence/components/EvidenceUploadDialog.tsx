"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AccessibleDialog } from "../../../shared/components/AccessibleDialog";
import { evidenceFileName, normalizeEvidenceUrl, validateEvidenceFile } from "../../../shared/utils/evidence.utils";
import type { Activity } from "../models/evidence.models";
import { evidenceUploadSchema, type EvidenceUploadValues } from "../schemas/evidence.schema";
import { attachableActivities, isFinalActivity } from "../utils/evidence-workspace.utils";
import { EvidencePreview } from "./EvidencePreview";
import styles from "../styles/Evidence.module.css";

type EvidenceUploadDialogProps = {
  activities: Activity[];
  initialActivityId?: string;
  pendingIds: Set<string>;
  onUploadFile: (activityId: string, file: File, uploadedBy: string) => Promise<boolean>;
  onUploadUrl: (activityId: string, fileName: string, url: string, uploadedBy: string) => Promise<boolean>;
  onClose: () => void;
};

export function EvidenceUploadDialog({ activities, initialActivityId = "", pendingIds, onUploadFile, onUploadUrl, onClose }: EvidenceUploadDialogProps) {
  const available = attachableActivities(activities);
  const defaultActivityId = available.some((item) => item.id === initialActivityId) ? initialActivityId : available[0]?.id ?? "";
  const { register, handleSubmit, control, formState: { errors } } = useForm<EvidenceUploadValues>({
    resolver: zodResolver(evidenceUploadSchema),
    defaultValues: { activityId: defaultActivityId, mode: "file", url: "", urlName: "", uploadedBy: "Equipo técnico" }
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const mode = useWatch({ control, name: "mode" });
  const activityId = useWatch({ control, name: "activityId" });
  const pending = pendingIds.has(activityId);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function selectFile(nextFile: File | null) {
    const validationError = validateEvidenceFile(nextFile);
    if (validationError) return setFileError(validationError);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile as File));
    setFileError("");
  }

  async function submit(values: EvidenceUploadValues) {
    const activity = activities.find((item) => item.id === values.activityId);
    if (!activity || isFinalActivity(activity.status)) return setFileError("El producto está finalizado y no admite nuevos adjuntos.");
    if (values.mode === "file") {
      const validationError = validateEvidenceFile(file);
      if (validationError) return setFileError(validationError);
      if (await onUploadFile(values.activityId, file as File, values.uploadedBy)) onClose();
      return;
    }
    const normalizedUrl = normalizeEvidenceUrl(values.url);
    if (!normalizedUrl) return setFileError("Ingrese una URL HTTP o HTTPS válida.");
    if (await onUploadUrl(values.activityId, evidenceFileName(normalizedUrl, values.urlName), normalizedUrl, values.uploadedBy)) onClose();
  }

  function clearSource() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setFileError("");
  }

  return (
    <AccessibleDialog labelledBy="evidence-upload-title" onClose={onClose} closeDisabled={pending} backdropClassName={styles.dialogBackdrop} panelClassName={styles.dialogPanel}>
      <div className="card-head"><h2 id="evidence-upload-title">Adjuntar evidencia</h2><button autoFocus className="icon-button" type="button" aria-label="Cerrar carga de evidencia" disabled={pending} onClick={onClose}><X size={16} /></button></div>
      <form className="form" onSubmit={handleSubmit(submit)} noValidate>
        <label className="field"><span>Producto</span><select {...register("activityId")} disabled={pending}>{available.map((item) => <option key={item.id} value={item.id}>{item.productId} - {item.productType}</option>)}</select>{errors.activityId && <small role="alert">{errors.activityId.message}</small>}</label>
        <label className="field"><span>Origen del adjunto</span><select {...register("mode", { onChange: clearSource })} disabled={pending}><option value="file">Subir archivo</option><option value="url">Ingresar URL</option></select></label>
        {mode === "file" ? (
          <label className={`${dragging ? "drop-zone active" : "drop-zone"} ${styles.dropZone}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0] ?? null); }}>
            <input className={styles.fileInput} type="file" aria-label="Seleccionar archivo" disabled={pending} onChange={(event) => selectFile(event.target.files?.[0] ?? null)} /><span><Upload size={18} /> Arrastra un archivo o selecciónalo. Máximo 50 MB.</span>
          </label>
        ) : <><label className="field field-wide"><span>URL del adjunto</span><input type="url" {...register("url")} disabled={pending} placeholder="https://..." /></label><label className="field"><span>Nombre descriptivo</span><input {...register("urlName")} disabled={pending} /></label></>}
        {file && <div className="file-preview"><div className="card-head"><strong>{file.name}</strong><button className="icon-button danger" type="button" aria-label="Quitar archivo seleccionado" disabled={pending} onClick={clearSource}><Trash2 size={16} /></button></div><EvidencePreview fileName={file.name} source={previewUrl} contentType={file.type} /></div>}
        <label className="field"><span>Subido por</span><input {...register("uploadedBy")} disabled={pending} />{errors.uploadedBy && <small role="alert">{errors.uploadedBy.message}</small>}</label>
        {fileError && <p className={styles.error} role="alert">{fileError}</p>}
        <button className="button compact" disabled={!activityId || pending}><Upload size={16} /> {pending ? "Adjuntando" : "Adjuntar"}</button>
      </form>
    </AccessibleDialog>
  );
}

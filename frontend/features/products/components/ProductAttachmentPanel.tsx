"use client";

import { Trash2, Upload, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import type { Product } from "../models/product.models";
import { evidenceFileName, normalizeEvidenceUrl, validateEvidenceFile } from "../utils/evidence.utils";
import { EvidencePreview } from "./EvidencePreview";
import styles from "../styles/Product.module.css";

type ProductAttachmentPanelProps = {
  product: Product;
  pending: boolean;
  onUploadFile: (productId: string, file: File, uploadedBy: string) => Promise<boolean>;
  onUploadUrl: (productId: string, fileName: string, storageUrl: string, uploadedBy: string) => Promise<boolean>;
  onClose: () => void;
};

export function ProductAttachmentPanel({ product, pending, onUploadFile, onUploadUrl, onClose }: ProductAttachmentPanelProps) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [url, setUrl] = useState("");
  const [urlName, setUrlName] = useState("");
  const [uploadedBy, setUploadedBy] = useState("Equipo técnico");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function selectFile(nextFile?: File | null) {
    const validationError = validateEvidenceFile(nextFile ?? null);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile ?? null);
    setPreviewUrl(URL.createObjectURL(nextFile as File));
    setError("");
  }

  function clearFile() {
    if (!file || !window.confirm("¿Quitar el archivo seleccionado antes de subirlo?")) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");

    if (mode === "file") {
      const validationError = validateEvidenceFile(file);
      if (validationError) return setError(validationError);
      if (await onUploadFile(product.id, file as File, uploadedBy.trim())) onClose();
      return;
    }

    const normalizedUrl = normalizeEvidenceUrl(url);
    if (!normalizedUrl) return setError("Ingrese una URL HTTP o HTTPS válida.");
    if (await onUploadUrl(product.id, evidenceFileName(normalizedUrl, urlName), normalizedUrl, uploadedBy.trim())) onClose();
  }

  function changeMode(nextMode: "file" | "url") {
    setMode(nextMode);
    setFile(null);
    setPreviewUrl("");
    setUrl("");
    setUrlName("");
    setError("");
  }

  return (
    <form className={`attachment-panel top-space ${styles.attachmentPanel}`} onSubmit={submit} aria-label={`Adjunto de ${product.productId}`}>
      <div className="card-head">
        <div><h3>Adjunto de producto</h3><p>{product.productId}</p></div>
        <button className="icon-button" type="button" title="Cerrar carga de adjunto" aria-label="Cerrar carga de adjunto" disabled={pending} onClick={onClose}><X size={16} /></button>
      </div>
      <label className="field"><span>Origen del adjunto</span><select value={mode} disabled={pending} onChange={(event) => changeMode(event.target.value as "file" | "url")}><option value="file">Subir archivo</option><option value="url">Ingresar URL</option></select></label>
      {mode === "file" && (
        <label className={`${dragging ? "drop-zone active" : "drop-zone"} ${styles.dropZone}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }}>
          <input className={styles.fileInput} type="file" aria-label="Seleccionar archivo" disabled={pending} onChange={(event) => selectFile(event.target.files?.[0])} />
          <span><Upload size={18} /> Arrastra un archivo o haz clic para seleccionar. Máximo 50 MB.</span>
        </label>
      )}
      {mode === "url" && <>
        <label className="field field-wide"><span>URL del adjunto</span><input type="url" value={url} disabled={pending} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." /></label>
        <label className="field"><span>Nombre descriptivo</span><input value={urlName} maxLength={240} disabled={pending} onChange={(event) => setUrlName(event.target.value)} placeholder="Video, diseño o archivo externo" /></label>
      </>}
      {mode === "file" && file && (
        <div className="file-preview">
          <div className="card-head"><div><strong>{file.name}</strong><span>{Math.round(file.size / 1024)} KB</span></div><button className="icon-button danger" type="button" title="Quitar archivo seleccionado" disabled={pending} onClick={clearFile}><Trash2 size={16} /></button></div>
          <EvidencePreview fileName={file.name} source={previewUrl} contentType={file.type} />
        </div>
      )}
      <label className="field"><span>Subido por</span><input value={uploadedBy} disabled={pending} onChange={(event) => setUploadedBy(event.target.value)} required /></label>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button className="button compact" title="Cargar adjunto al producto seleccionado" disabled={pending}><Upload size={16} /> {pending ? "Cargando" : "Agregar adjunto"}</button>
    </form>
  );
}

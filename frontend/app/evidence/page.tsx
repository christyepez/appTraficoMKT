"use client";

import { AppNav } from "../nav";
import { Activity, Requirement, api, getSession, showToast } from "../lib";
import { Eye, FileText, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type EvidenceItem = {
  id: string;
  activityId: string;
  fileName: string;
  contentType: string;
  storageUrl: string;
  uploadedBy: string;
};

type Approval = {
  id: string;
  activityId: string;
  decision: string;
  approvedBy: string;
  comments: string;
};

export default function EvidencePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activityId, setActivityId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function load() {
    const session = getSession();
    const [requirements, acts, evs, aps] = await Promise.all([
      api<Requirement[]>("/api/requirements"),
      api<Activity[]>("/api/activities"),
      api<EvidenceItem[]>("/api/evidence"),
      api<Approval[]>("/api/approvals")
    ]);
    const visibleRequirements = filterRequirementsForSession(requirements, session);
    const visibleActivities = filterActivitiesForSession(acts, visibleRequirements, session);
    const visibleActivityIds = new Set(visibleActivities.map((item) => item.id));
    setActivities(visibleActivities);
    setEvidence(evs.filter((item) => visibleActivityIds.has(item.activityId)));
    setApprovals(aps.filter((item) => visibleActivityIds.has(item.activityId)));
    setActivityId((current) => current || visibleActivities[0]?.id || "");
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 10000);
    load().catch(() => location.assign("/login"));
    return () => window.clearInterval(timer);
  }, []);

  function pickFile(nextFile?: File | null) {
    if (!nextFile) return;
    if (nextFile.size > 50 * 1024 * 1024) {
      showToast("El archivo no puede superar 50 MB.", "error");
      return;
    }
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploading) return;
    if (!file) {
      showToast("Seleccione o arrastre un archivo.", "error");
      return;
    }
    setIsUploading(true);
    const form = new FormData(event.currentTarget);
    try {
      form.set("file", file);
      form.set("activityId", activityId);
      await api<EvidenceItem>("/api/evidence/upload", {
        method: "POST",
        body: form
      });
      await api(`/api/activities/${activityId}/evidence-attached`, { method: "PATCH" });
      event.currentTarget.reset();
      setFile(null);
      setPreviewUrl("");
      setIsUploadOpen(false);
      showToast("Evidencia adjuntada correctamente.");
      await load();
    } finally {
      setIsUploading(false);
    }
  }

  async function removeEvidence(id: string) {
    if (!window.confirm("¿Eliminar lógicamente esta evidencia? El archivo físico no se borrará.")) return;
    await api(`/api/evidence/${id}`, { method: "DELETE" });
    showToast("Evidencia eliminada lógicamente.");
    await load();
  }

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell">
        {isUploadOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <section className="modal-panel">
              <div className="card-head">
                <h2>Adjuntar evidencia</h2>
                <button className="icon-button" type="button" title="Cerrar carga de evidencia" disabled={isUploading} onClick={() => setIsUploadOpen(false)}><X size={16} /></button>
              </div>
          <form className="form" onSubmit={create}>
            <label className="field">
              <span>Actividad</span>
              <select value={activityId} onChange={(event) => setActivityId(event.target.value)} required>
                {activities.map((item) => <option key={item.id} value={item.id}>{item.productId} - {item.productType}</option>)}
              </select>
            </label>
            <div className="field field-wide">
              <span>Archivo</span>
              <label
                className={dragging ? "drop-zone active" : "drop-zone"}
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  pickFile(event.dataTransfer.files[0]);
                }}
              >
                <input name="file" type="file" hidden onChange={(event) => pickFile(event.target.files?.[0])} />
                <span><Upload size={18} /> Arrastra un archivo o haz clic para seleccionar. Máximo 50 MB.</span>
              </label>
            </div>
            {file && (
              <div className="file-preview field-wide">
                <strong>{file.name}</strong>
                <span>{Math.round(file.size / 1024)} KB</span>
                {file.type.startsWith("image/") && <img src={previewUrl} alt={file.name} />}
                {file.type === "application/pdf" && <iframe src={previewUrl} title={file.name} />}
                {!file.type.startsWith("image/") && file.type !== "application/pdf" && <span className="badge"><FileText size={14} /> Vista previa no disponible</span>}
              </div>
            )}
            <label className="field"><span>Subido por</span><input name="uploadedBy" required /></label>
            <button className="button compact" title="Adjuntar evidencia a la actividad seleccionada" disabled={!activityId || isUploading}><Upload size={16} /> {isUploading ? "Adjuntando" : "Adjuntar"}</button>
          </form>
            </section>
          </div>
        )}
        <section className="panel">
          <div className="card-head">
            <h2>Evidencias y aprobaciones</h2>
            <div className="actions">
              <button className="icon-button" title="Adjuntar nueva evidencia" onClick={() => setIsUploadOpen(true)}><Plus size={16} /></button>
              <button className="button secondary" title="Actualizar evidencias y aprobaciones" onClick={load}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>
          <div className="split top-space">
            <div className="stack compact-stack">
              {evidence.map((item) => (
                <article className="card compact-card" key={item.id}>
                  <div className="card-head">
                    <div className="compact-title">
                      <h3><FileText size={16} /> {item.fileName}</h3>
                      <p>{activityLabel(activities, item.activityId)}</p>
                    </div>
                    <div className="card-meta">
                      <span className="badge">{item.uploadedBy}</span>
                      <div className="actions">
                        <button className="icon-button danger" title="Eliminar lógicamente la evidencia" onClick={() => removeEvidence(item.id)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                  <div className="detail-grid compact-detail-grid">
                    <div className="detail-item"><span>Tipo</span><strong>{item.contentType || "Archivo"}</strong></div>
                    <div className="detail-item"><span>Ruta</span><strong>{item.storageUrl}</strong></div>
                  </div>
                  <EvidencePreview item={item} />
                </article>
              ))}
            </div>
            <div className="stack compact-stack">
              {approvals.map((item) => (
                <article className="card compact-card" key={item.id}>
                  <div className="card-head">
                    <div className="compact-title">
                      <h3>{item.decision}</h3>
                      <p>{item.comments}</p>
                    </div>
                    <div className="card-meta">
                      <span className="badge">{item.approvedBy}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function EvidencePreview({ item }: { item: EvidenceItem }) {
  const href = item.storageUrl;
  const lowerName = item.fileName.toLowerCase();
  const isImage = item.contentType?.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp)$/i.test(lowerName);
  const isPdf = item.contentType === "application/pdf" || lowerName.endsWith(".pdf");
  const canPreview = href.startsWith("/api/files/") || href.startsWith("http");
  if (!canPreview) return <span className="badge top-space"><FileText size={14} /> Vista previa no disponible para almacenamiento externo</span>;
  return (
    <div className="file-preview top-space">
      {isImage && <img src={href} alt={item.fileName} />}
      {isPdf && <iframe src={href} title={item.fileName} />}
      {!isImage && !isPdf && <span className="badge"><FileText size={14} /> Vista previa no disponible</span>}
      <a className="button secondary compact-button" href={href} target="_blank" rel="noreferrer" title="Abrir archivo en una nueva pestaña"><Eye size={16} /> Abrir</a>
    </div>
  );
}

function activityLabel(activities: Activity[], activityId: string) {
  const activity = activities.find((item) => item.id === activityId);
  return activity ? `${activity.productId} - ${activity.productType}` : "Producto no visible";
}

function filterRequirementsForSession(requirements: Requirement[], session: ReturnType<typeof getSession>) {
  if (!session || session.user.roles.some((role) => ["Administrador", "Auditor"].includes(role))) return requirements;
  const userKeys = [session.user.name, session.user.email].map((value) => value.toLowerCase());
  return requirements.filter((item) => userKeys.includes(item.requestedBy.toLowerCase()));
}

function filterActivitiesForSession(activities: Activity[], visibleRequirements: Requirement[], session: ReturnType<typeof getSession>) {
  if (!session || session.user.roles.some((role) => ["Administrador", "Auditor"].includes(role))) return activities;
  const userKeys = [session.user.name, session.user.email].map((value) => value.toLowerCase());
  const visibleRequirementIds = new Set(visibleRequirements.map((item) => item.id));
  return activities.filter((item) => userKeys.includes(item.productResponsible.toLowerCase()) || visibleRequirementIds.has(item.requirementId));
}

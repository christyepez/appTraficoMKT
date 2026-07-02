"use client";

import { AppNav } from "../nav";
import { Activity, Requirement, api, getSession, showToast } from "../lib";
import { PaginationControls, paginate, type PaginationState } from "../pagination";
import { ChevronDown, ChevronRight, Eye, FileText, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react";
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
  const [attachmentMode, setAttachmentMode] = useState<"file" | "url">("file");
  const [externalUrl, setExternalUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });

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
    const attachableActivities = visibleActivities.filter((item) => !isFinalActivity(item.status));
    setActivityId((current) => attachableActivities.some((item) => item.id === current) ? current : attachableActivities[0]?.id || "");
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 10000);
    const refresh = () => load().catch(() => undefined);
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    load().catch(() => location.assign("/login"));
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
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
    const selectedActivity = activities.find((item) => item.id === activityId);
    if (!selectedActivity || isFinalActivity(selectedActivity.status)) {
      showToast("El producto está finalizado y no admite nuevos adjuntos.", "error");
      return;
    }
    if ((attachmentMode === "file" && !file) || (attachmentMode === "url" && !externalUrl.trim())) {
      showToast("Complete el origen del adjunto.", "error");
      return;
    }
    setIsUploading(true);
    const form = new FormData(event.currentTarget);
    try {
      if (attachmentMode === "file" && file) {
        form.set("file", file);
        form.set("activityId", activityId);
        await api<EvidenceItem>("/api/evidence/upload", { method: "POST", body: form });
      } else {
        const url = new URL(externalUrl.trim());
        await api<EvidenceItem>("/api/evidence", { method: "POST", body: JSON.stringify({ activityId, fileName: form.get("urlName") || url.pathname.split("/").filter(Boolean).pop() || url.hostname, contentType: "text/uri-list", storageUrl: url.toString(), uploadedBy: form.get("uploadedBy") }) });
      }
      await api(`/api/activities/${activityId}/evidence-attached`, { method: "PATCH" });
      event.currentTarget.reset();
      setFile(null);
      setPreviewUrl("");
      setExternalUrl("");
      setAttachmentMode("file");
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
                {activities.filter((item) => !isFinalActivity(item.status)).map((item) => <option key={item.id} value={item.id}>{item.productId} - {item.productType}</option>)}
              </select>
            </label>
            <label className="field"><span>Origen del adjunto</span><select value={attachmentMode} onChange={(event) => { setAttachmentMode(event.target.value as "file" | "url"); setFile(null); setPreviewUrl(""); setExternalUrl(""); }}><option value="file">Subir archivo</option><option value="url">Ingresar URL</option></select></label>
            {attachmentMode === "file" && <div className="field field-wide">
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
            </div>}
            {attachmentMode === "url" && <><label className="field field-wide"><span>URL del adjunto</span><input type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://..." required /></label><label className="field"><span>Nombre descriptivo</span><input name="urlName" maxLength={240} /></label></>}
            {attachmentMode === "file" && file && (
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
            <div>
              <h2>Evidencias y aprobaciones</h2>
              <p>{evidence.length} adjuntos registrados sobre {activities.length} productos visibles.</p>
            </div>
            <div className="actions">
              <button className="icon-button" title="Adjuntar nueva evidencia" disabled={!activities.some((item) => !isFinalActivity(item.status))} onClick={() => setIsUploadOpen(true)}><Plus size={16} /></button>
              <button className="button secondary" title="Actualizar evidencias y aprobaciones" onClick={load}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>
          <div className="detail-grid compact-detail-grid top-space">
            <div className="detail-item"><span>Productos visibles</span><strong>{activities.length}</strong></div>
            <div className="detail-item"><span>Adjuntos</span><strong>{evidence.length}</strong></div>
            <div className="detail-item"><span>Aprobaciones</span><strong>{approvals.length}</strong></div>
          </div>
          <div className="stack compact-stack top-space">
              {paginate(activities, pagination).items.map((activity) => {
                const files = evidence.filter((item) => item.activityId === activity.id);
                const activityApprovals = approvals.filter((approval) => approval.activityId === activity.id);
                const isExpanded = expandedProducts.includes(activity.id);
                return (
                  <article className="card compact-card" key={activity.id}>
                    <div className="card-head">
                      <button className="collapse-title" type="button" title="Mostrar u ocultar adjuntos del producto" onClick={() => toggleExpanded(activity.id, setExpandedProducts)}>
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <span>{activity.productId} - {activity.productType}</span>
                      </button>
                      <div className="card-meta">
                        <span className="badge">{files.length} adjunto(s)</span>
                        <span className="badge">{activityApprovals.length} aprobación(es)</span>
                        <button className={isFinalActivity(activity.status) ? "icon-button success" : "icon-button"} disabled={isFinalActivity(activity.status)} title={isFinalActivity(activity.status) ? "Producto finalizado: no admite nuevos adjuntos" : "Adjuntar evidencia a este producto"} onClick={() => { setActivityId(activity.id); setIsUploadOpen(true); }}><Plus size={16} /></button>
                      </div>
                    </div>
                    <div className="detail-grid compact-detail-grid">
                      <div className="detail-item"><span>Responsable</span><strong>{activity.productResponsible}</strong></div>
                      <div className="detail-item"><span>Canal</span><strong>{activity.diffusionChannel}</strong></div>
                      <div className="detail-item"><span>KPI</span><strong>{activity.mainKpi}</strong></div>
                    </div>
                    {isExpanded && (
                      <div className="nested-detail top-space">
                        {files.map((item) => (
                          <article className="card compact-card" key={item.id}>
                            <div className="card-head">
                              <div className="compact-title">
                                <h3><FileText size={16} /> {item.fileName}</h3>
                                <p>{item.uploadedBy || "Equipo técnico"} | {item.contentType || "Archivo"}</p>
                              </div>
                              <div className="actions">
                                <a className="icon-button" href={item.storageUrl} target="_blank" rel="noreferrer" title="Abrir adjunto"><Eye size={16} /></a>
                                <button className="icon-button danger" title="Eliminar lógicamente la evidencia" onClick={() => removeEvidence(item.id)}><Trash2 size={16} /></button>
                              </div>
                            </div>
                            <EvidencePreview item={item} />
                          </article>
                        ))}
                        {files.length === 0 && <div className="empty">Este producto aún no tiene adjuntos.</div>}
                        {activityApprovals.length > 0 && (
                          <div className="inline-facts">
                            {activityApprovals.map((approval) => (
                              <span key={approval.id}>{approval.decision} | {approval.approvedBy}{approval.comments ? ` | ${approval.comments}` : ""}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
              {activities.length === 0 && <div className="empty">No hay productos visibles para revisar adjuntos.</div>}
          </div>
          <PaginationControls state={pagination} totalItems={activities.length} onChange={setPagination} />
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

function toggleExpanded(id: string, setExpandedProducts: (value: string[] | ((current: string[]) => string[])) => void) {
  setExpandedProducts((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
}

function isFinalActivity(status: string) {
  return ["Approved", "Completed"].includes(status);
}

function filterRequirementsForSession(requirements: Requirement[], session: ReturnType<typeof getSession>) {
  if (!session || session.user.roles.some((role) => ["Administrador", "Auditor", "Coordinador"].includes(role))) return requirements;
  const userKeys = [session.user.name, session.user.email].map((value) => value.toLowerCase());
  return requirements.filter((item) => userKeys.includes(item.requestedBy.toLowerCase()));
}

function filterActivitiesForSession(activities: Activity[], visibleRequirements: Requirement[], session: ReturnType<typeof getSession>) {
  if (!session || session.user.roles.some((role) => ["Administrador", "Auditor", "Coordinador"].includes(role))) return activities;
  const userKeys = [session.user.name, session.user.email].map((value) => value.toLowerCase());
  const visibleRequirementIds = new Set(visibleRequirements.map((item) => item.id));
  return activities.filter((item) => userKeys.includes(item.productResponsible.toLowerCase()) || visibleRequirementIds.has(item.requirementId));
}

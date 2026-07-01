"use client";

import { AppNav } from "../nav";
import { Activity, Requirement, api, defaultBrandSettings, getSession, showToast, type BrandSettings } from "../lib";
import { PaginationControls, paginate, type PaginationState } from "../pagination";
import { Highlight } from "../search";
import { Edit3, Eye, FileText, Paperclip, Play, Plus, RefreshCw, Save, Send, Trash2, Upload, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type CatalogItem = {
  id: string;
  type: string;
  code: string;
  name: string;
  isActive: boolean;
};

type Catalogs = {
  tipoRequerimiento: CatalogItem[];
  publicoObjetivo: CatalogItem[];
  tipoProducto: CatalogItem[];
  canalDifusion: CatalogItem[];
  kpiPrincipal: CatalogItem[];
};

type EvidenceItem = {
  id: string;
  activityId: string;
  fileName: string;
  storageUrl: string;
  uploadedBy: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
};

type Approval = {
  id: string;
  activityId: string;
  decision: string;
  approvedBy: string;
  comments: string;
  createdAt: string;
};

export default function ActivitiesPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [catalogs, setCatalogs] = useState<Catalogs>({
    tipoRequerimiento: [],
    publicoObjetivo: [],
    tipoProducto: [],
    canalDifusion: [],
    kpiPrincipal: []
  });
  const [requirementId, setRequirementId] = useState("");
  const [editing, setEditing] = useState<Activity | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [attachmentActivityId, setAttachmentActivityId] = useState("");
  const [attachmentDetailActivityId, setAttachmentDetailActivityId] = useState("");
  const [approvalVersionsActivityId, setApprovalVersionsActivityId] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [attachmentMode, setAttachmentMode] = useState<"file" | "url">("file");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [suggestedProductId, setSuggestedProductId] = useState("PROD-0001");
  const [showProductIdField, setShowProductIdField] = useState(defaultBrandSettings.showProductIdField);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });

  async function load() {
    const session = getSession();
    const [reqs, acts, evs, aps, users, nextProduct, brand, tipoRequerimiento, publicoObjetivo, tipoProducto, canalDifusion, kpiPrincipal] = await Promise.all([
      api<Requirement[]>("/api/requirements"),
      api<Activity[]>("/api/activities"),
      api<EvidenceItem[]>("/api/evidence"),
      api<Approval[]>("/api/approvals").catch(() => []),
      api<User[]>("/api/identity/users/technicians").catch(() => []),
      api<{ productId: string }>("/api/activities/next-product-id").catch(() => null),
      api<BrandSettings>("/api/identity/brand-settings").catch(() => defaultBrandSettings),
      api<CatalogItem[]>("/api/admin/catalogs/by-type/TipoRequerimiento"),
      api<CatalogItem[]>("/api/admin/catalogs/by-type/PublicoObjetivo"),
      api<CatalogItem[]>("/api/admin/catalogs/by-type/TipoProducto"),
      api<CatalogItem[]>("/api/admin/catalogs/by-type/CanalDifusion"),
      api<CatalogItem[]>("/api/admin/catalogs/by-type/KpiPrincipal")
    ]);
    const visibleRequirements = filterRequirementsForSession(reqs, session);
    const visibleActivities = filterActivitiesForSession(acts, visibleRequirements, session);
    setRequirements(visibleRequirements);
    setActivities(visibleActivities);
    setEvidence(evs.filter((item) => visibleActivities.some((activity) => activity.id === item.activityId)));
    setApprovals(aps.filter((item) => visibleActivities.some((activity) => activity.id === item.activityId)));
    const fallbackUser = session
      ? [{ id: session.user.id, name: session.user.name, email: session.user.email, roles: session.user.roles, isActive: true }]
      : [];
    const technicalUsers = users.filter((user) => user.isActive && user.roles.some((role) => role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "tecnico"));
    setTechnicians(technicalUsers.length ? technicalUsers : fallbackUser);
    setCatalogs({
      tipoRequerimiento: tipoRequerimiento.filter((item) => item.isActive),
      publicoObjetivo: publicoObjetivo.filter((item) => item.isActive),
      tipoProducto: tipoProducto.filter((item) => item.isActive),
      canalDifusion: canalDifusion.filter((item) => item.isActive),
      kpiPrincipal: kpiPrincipal.filter((item) => item.isActive)
    });
    setSuggestedProductId(nextProduct?.productId ?? nextProductId(acts));
    setShowProductIdField(Boolean(brand.showProductIdField));
    setRequirementId((current) => current && visibleRequirements.some((item) => item.id === current) ? current : "");
  }

  async function openEditor(activity: Activity | null = null) {
    await load().catch(() => undefined);
    setEditing(activity);
    if (activity) setRequirementId(activity.requirementId);
    setIsEditorOpen(true);
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 15000);
    load().catch((error) => {
      showToast(error instanceof Error ? error.message : "No se pudo cargar productos.", "error");
      if (!getSession()) location.assign("/login");
    });
    return () => window.clearInterval(timer);
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const requirementTypeId = String(form.get("requirementTypeId") ?? "");
      const targetAudienceId = String(form.get("targetAudienceId") ?? "");
      const productTypeId = String(form.get("productTypeId") ?? "");
      const diffusionChannelId = String(form.get("diffusionChannelId") ?? "");
      const mainKpiId = String(form.get("mainKpiId") ?? "");
      const requirementType = catalogs.tipoRequerimiento.find((item) => item.id === requirementTypeId);
      const targetAudience = catalogs.publicoObjetivo.find((item) => item.id === targetAudienceId);
      const productType = catalogs.tipoProducto.find((item) => item.id === productTypeId);
      const diffusionChannel = catalogs.canalDifusion.find((item) => item.id === diffusionChannelId);
      const mainKpi = catalogs.kpiPrincipal.find((item) => item.id === mainKpiId);
      const productResponsible = String(form.get("productResponsible") ?? "").trim();
      if (!requirementId || !requirementType || !targetAudience || !productType || !diffusionChannel || !mainKpi || !productResponsible) {
        showToast("Complete los combos requeridos y el responsable antes de guardar.", "error");
        setMessage("Complete los combos requeridos y el responsable antes de guardar.");
        return;
      }
      await api<Activity>(`/api/activities${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          requirementId,
          productId: form.get("productId"),
          requirementTypeId,
          requirementType: requirementType?.name ?? "",
          strategicObjective: form.get("strategicObjective"),
          targetAudienceId,
          targetAudience: targetAudience?.name ?? "",
          productTypeId,
          productType: productType?.name ?? "",
          diffusionChannelId,
          diffusionChannel: diffusionChannel?.name ?? "",
          mainKpiId,
          mainKpi: mainKpi?.name ?? "",
          productResponsible,
          productDeliveryDate: form.get("productDeliveryDate") || null,
          observations: form.get("observations")
        })
      });
      event.currentTarget.reset();
      setEditing(null);
      setIsEditorOpen(false);
      const okMessage = editing ? "Producto editado correctamente." : "Producto creado correctamente.";
      setMessage(okMessage);
      showToast(okMessage);
      await load();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo guardar el producto.";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function patch(url: string) {
    try {
      await api(url, { method: "PATCH" });
      setMessage("Estado actualizado correctamente.");
      showToast("Estado actualizado correctamente.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar el estado.");
    }
  }

  async function removeActivity(id: string) {
    if (!window.confirm("¿Eliminar este producto? El registro quedará eliminado de forma lógica.")) return;
    try {
      await api(`/api/activities/${id}`, { method: "DELETE" });
      setMessage("Producto eliminado correctamente.");
      showToast("Producto eliminado correctamente.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar el producto.");
    }
  }

  async function removeEvidence(id: string) {
    if (!window.confirm("¿Eliminar este adjunto? El archivo quedará inactivo.")) return;
    try {
      await api(`/api/evidence/${id}`, { method: "DELETE" });
      showToast("Adjunto eliminado correctamente.");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No se pudo eliminar el adjunto.", "error");
    }
  }

  function pickAttachment(nextFile?: File | null) {
    if (!nextFile) return;
    if (nextFile.size > 50 * 1024 * 1024) {
      showToast("El archivo no puede superar 50 MB.", "error");
      return;
    }
    setAttachmentFile(nextFile);
    setAttachmentPreview(URL.createObjectURL(nextFile));
  }

  function clearSelectedAttachment() {
    if (!attachmentFile) return;
    if (!window.confirm("¿Quitar el archivo seleccionado antes de subirlo?")) return;
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentFile(null);
    setAttachmentPreview("");
  }

  async function uploadAttachment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploading) return;
    if (!attachmentActivityId || (attachmentMode === "file" && !attachmentFile) || (attachmentMode === "url" && !attachmentUrl.trim())) {
      showToast("Seleccione un producto y complete el origen del adjunto.", "error");
      return;
    }
    setIsUploading(true);
    const form = new FormData(event.currentTarget);
    try {
      if (attachmentMode === "file" && attachmentFile) {
        form.set("activityId", attachmentActivityId);
        form.set("file", attachmentFile);
        await api<EvidenceItem>("/api/evidence/upload", { method: "POST", body: form });
      } else {
        const url = new URL(attachmentUrl.trim());
        await api<EvidenceItem>("/api/evidence", {
          method: "POST",
          body: JSON.stringify({
            activityId: attachmentActivityId,
            fileName: form.get("urlName") || url.pathname.split("/").filter(Boolean).pop() || url.hostname,
            contentType: "text/uri-list",
            storageUrl: url.toString(),
            uploadedBy: form.get("uploadedBy")
          })
        });
      }
      await api(`/api/activities/${attachmentActivityId}/evidence-attached`, { method: "PATCH" });
      setAttachmentActivityId("");
      setAttachmentFile(null);
      setAttachmentPreview("");
      setAttachmentUrl("");
      setAttachmentMode("file");
      showToast("Adjunto cargado en el producto.");
      await load();
    } finally {
      setIsUploading(false);
    }
  }

  const filtered = activities
    .filter((item) => showCompleted ? normalizedActivityStatus(item.status) === "Approved" : normalizedActivityStatus(item.status) !== "Approved")
    .filter((item) => matchesSearch(item, searchTerm));

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell tracking-layout">
        {isEditorOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <section className="modal-panel">
              <div className="card-head">
                <h2>{editing ? "Editar producto" : "Producto o actividad"}</h2>
              <button className="icon-button" type="button" title="Cerrar formulario" disabled={isSaving} onClick={() => { setEditing(null); setIsEditorOpen(false); }}><X size={16} /></button>
              </div>
          <form className="form" onSubmit={save} key={editing?.id ?? `new-${suggestedProductId}`}>
            <label className="field">
              <span>Id requerimiento</span>
              <select value={requirementId} onChange={(event) => setRequirementId(event.target.value)} required>
                <option value="">Seleccione...</option>
                {requirements.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.activityOrEvent}</option>)}
              </select>
            </label>
            {showProductIdField && <label className="field"><span>Id producto</span><input name="productId" required readOnly value={editing?.productId ?? suggestedProductId} title="Código secuencial generado automáticamente" /></label>}
            <SelectField label="Tipo requerimiento" name="requirementTypeId" items={catalogs.tipoRequerimiento} defaultValue={editing?.requirementTypeId} />
            <label className="field field-wide"><span>Objetivo estratégico</span><textarea name="strategicObjective" defaultValue={editing?.strategicObjective ?? ""} /></label>
            <SelectField label="Público objetivo" name="targetAudienceId" items={catalogs.publicoObjetivo} defaultValue={editing?.targetAudienceId} />
            <SelectField label="Tipo producto" name="productTypeId" items={catalogs.tipoProducto} defaultValue={editing?.productTypeId} />
            <SelectField label="Canal difusión" name="diffusionChannelId" items={catalogs.canalDifusion} defaultValue={editing?.diffusionChannelId} />
            <SelectField label="KPI principal" name="mainKpiId" items={catalogs.kpiPrincipal} defaultValue={editing?.mainKpiId} />
            <label className="field">
              <span>Responsable producto</span>
              <select name="productResponsible" required defaultValue={editing?.productResponsible ?? ""}>
                <option value="">Seleccione...</option>
                {editing?.productResponsible && !technicians.some((user) => [user.email, user.name].includes(editing.productResponsible)) && <option value={editing.productResponsible}>{editing.productResponsible}</option>}
                {technicians.map((user) => <option key={user.id} value={user.email}>{user.name} - {user.email}</option>)}
              </select>
            </label>
            <label className="field"><span>Fecha entrega producto</span><input name="productDeliveryDate" type="date" defaultValue={editing?.productDeliveryDate ?? ""} /></label>
            <label className="field field-wide"><span>Observaciones</span><textarea name="observations" defaultValue={editing?.observations ?? ""} /></label>
            <div className="form-actions">
              <button className="button" title={editing ? "Guardar cambios del producto" : "Crear producto para el requerimiento seleccionado"} disabled={!requirementId || isSaving}>{editing ? <Save size={16} /> : <Plus size={16} />} {isSaving ? "Guardando" : editing ? "Guardar" : "Crear producto"}</button>
              <button className="button secondary" type="button" title="Cancelar edición" disabled={isSaving} onClick={() => { setEditing(null); setIsEditorOpen(false); }}><X size={16} /> Cancelar</button>
            </div>
          </form>
            </section>
          </div>
        )}
        <section className="panel">
          <div className="card-head">
            <h2>Seguimiento de productos</h2>
            <div className="actions">
              <button className="icon-button" title="Crear producto" onClick={() => openEditor(null)}><Plus size={16} /></button>
              <button className="button secondary" title="Actualizar seguimiento de productos" onClick={load}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>
          {message && <span className="badge">{message}</span>}
          <label className="field top-space">
            <span>Buscar en seguimiento</span>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por producto, responsable, KPI, canal, estado..." />
          </label>
          <label className="check-field top-space"><input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} /> Ver productos finalizados</label>
          {attachmentActivityId && (
            <form className="attachment-panel top-space" onSubmit={uploadAttachment}>
              <div className="card-head">
                <div>
                  <h3>Adjunto de producto</h3>
                  <p>{activities.find((item) => item.id === attachmentActivityId)?.productId ?? "Producto seleccionado"}</p>
                </div>
                <button className="icon-button" type="button" title="Cerrar carga de adjunto" onClick={() => { setAttachmentActivityId(""); setAttachmentFile(null); setAttachmentPreview(""); }}><X size={16} /></button>
              </div>
              <label className="field"><span>Origen del adjunto</span><select value={attachmentMode} onChange={(event) => { setAttachmentMode(event.target.value as "file" | "url"); setAttachmentFile(null); setAttachmentPreview(""); setAttachmentUrl(""); }}><option value="file">Subir archivo</option><option value="url">Ingresar URL</option></select></label>
              {attachmentMode === "file" && <label
                className={dragging ? "drop-zone active" : "drop-zone"}
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  pickAttachment(event.dataTransfer.files[0]);
                }}
              >
                <input name="file" type="file" hidden onChange={(event) => pickAttachment(event.target.files?.[0])} />
                <span><Upload size={18} /> Arrastra un archivo o haz clic para seleccionar. Máximo 50 MB.</span>
              </label>}
              {attachmentMode === "url" && <><label className="field field-wide"><span>URL del adjunto</span><input type="url" value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} placeholder="https://..." required /></label><label className="field"><span>Nombre descriptivo</span><input name="urlName" maxLength={240} placeholder="Video, diseño o archivo externo" /></label></>}
              {attachmentMode === "file" && attachmentFile && (
                <div className="file-preview">
                  <div className="card-head">
                    <div>
                      <strong>{attachmentFile.name}</strong>
                      <span>{Math.round(attachmentFile.size / 1024)} KB</span>
                    </div>
                    <button className="icon-button danger" type="button" title="Quitar archivo seleccionado" onClick={clearSelectedAttachment}><Trash2 size={16} /></button>
                  </div>
                  {attachmentFile.type.startsWith("image/") && <img src={attachmentPreview} alt={attachmentFile.name} />}
                  {attachmentFile.type === "application/pdf" && <iframe src={attachmentPreview} title={attachmentFile.name} />}
                  {!attachmentFile.type.startsWith("image/") && attachmentFile.type !== "application/pdf" && <span className="badge"><FileText size={14} /> Vista previa no disponible</span>}
                </div>
              )}
              <label className="field"><span>Subido por</span><input name="uploadedBy" required defaultValue="Equipo técnico" /></label>
              <button className="button compact" title="Cargar adjunto al producto seleccionado" disabled={(attachmentMode === "file" ? !attachmentFile : !attachmentUrl.trim()) || isUploading}><Upload size={16} /> {isUploading ? "Cargando" : "Agregar adjunto"}</button>
            </form>
          )}
          {attachmentDetailActivityId && (
            <div className="modal-backdrop" role="dialog" aria-modal="true">
              <section className="modal-panel">
                <div className="card-head">
                  <div>
                    <h2>Adjuntos del producto</h2>
                    <p>{activities.find((item) => item.id === attachmentDetailActivityId)?.productId ?? "Producto seleccionado"}</p>
                  </div>
                  <span className="badge">{activityStatusLabel(activities.find((item) => item.id === attachmentDetailActivityId)?.status ?? "")}</span>
                  <button className="icon-button" type="button" title="Cerrar detalle de adjuntos" onClick={() => setAttachmentDetailActivityId("")}><X size={16} /></button>
                </div>
                <div className="stack compact-stack top-space">
                  {evidence.filter((file) => file.activityId === attachmentDetailActivityId).map((file) => (
                    <details className="card compact-card" key={file.id}>
                      <summary className="card-head collapse-title">
                        <div className="compact-title">
                          <h3><FileText size={16} /> {file.fileName}</h3>
                          <p>Subido por {file.uploadedBy || "Equipo técnico"}</p>
                        </div>
                      </summary>
                      <div className="actions top-space">
                        <a className="icon-button" href={file.storageUrl} target="_blank" rel="noreferrer" title="Abrir adjunto"><Eye size={16} /></a>
                        <button className="icon-button danger" type="button" title="Eliminar adjunto" onClick={() => removeEvidence(file.id)}><Trash2 size={16} /></button>
                      </div>
                      <EvidencePreview item={file} />
                    </details>
                  ))}
                  {evidence.filter((file) => file.activityId === attachmentDetailActivityId).length === 0 && <div className="empty">Sin adjuntos.</div>}
                </div>
              </section>
            </div>
          )}
          {approvalVersionsActivityId && (
            <div className="modal-backdrop" role="dialog" aria-modal="true">
              <section className="modal-panel">
                <div className="card-head">
                  <div>
                    <h2>Versiones enviadas a aprobación</h2>
                    <p>{activities.find((item) => item.id === approvalVersionsActivityId)?.productId ?? "Producto seleccionado"}</p>
                  </div>
                  <button className="icon-button" type="button" title="Cerrar versiones de aprobación" onClick={() => setApprovalVersionsActivityId("")}><X size={16} /></button>
                </div>
                <div className="stack compact-stack top-space">
                  {approvals
                    .filter((approval) => approval.activityId === approvalVersionsActivityId)
                    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
                    .map((approval, index) => (
                    <article className="card compact-card" key={approval.id}>
                      <div className="card-head">
                        <div className="compact-title">
                          <h3>Versión {index + 1} - {approvalDecisionLabel(approval.decision)}</h3>
                          <p>{formatDate(approval.createdAt)} | {approval.approvedBy}</p>
                        </div>
                        <span className="badge">{approvalDecisionLabel(approval.decision)}</span>
                      </div>
                      <div className="inline-facts">
                        <span>{approval.comments || "Sin comentarios."}</span>
                        <button className="button secondary compact-button" type="button" title="Ver adjuntos enviados para esta aprobación" onClick={() => setAttachmentDetailActivityId(approval.activityId)}>
                          <Paperclip size={14} /> Ver adjuntos
                        </button>
                      </div>
                    </article>
                  ))}
                  {approvals.filter((approval) => approval.activityId === approvalVersionsActivityId).length === 0 && <div className="empty">Este producto aún no tiene versiones enviadas a aprobación.</div>}
                </div>
              </section>
            </div>
          )}
          <div className="stack compact-stack top-space">
            {paginate(filtered, pagination).items.map((item) => (
              <article className="card compact-card" key={item.id}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3>{highlight(`${item.productId} - ${item.productType}`, searchTerm)}</h3>
                    <p>{highlight(`${item.requirementType} | ${item.productResponsible} | ${item.diffusionChannel}`, searchTerm)}</p>
                  </div>
                  <div className="card-meta">
                    <span className="badge">{activityStatusLabel(item.status)}</span>
                    <div className="actions">
                      <button className={workflowButtonClass(activityStepState(item, "start"))} disabled={activityStepState(item, "start") !== "ready"} title="Cambiar producto a en progreso" onClick={() => patch(`/api/activities/${item.id}/start`)}><Play size={16} /></button>
                      <button className={workflowButtonClass(activityStepState(item, "evidence"))} disabled={activityStepState(item, "evidence") !== "ready"} title="Adjuntar evidencia o archivo a este producto" onClick={() => setAttachmentActivityId(item.id)}><Paperclip size={16} /></button>
                      <button className={workflowButtonClass(activityStepState(item, "approval"))} disabled={activityStepState(item, "approval") !== "ready"} title="Enviar producto a aprobación" onClick={() => patch(`/api/activities/${item.id}/submit-approval`)}><Send size={16} /></button>
                      <button className="icon-button" title="Ver detalle y adjuntos del producto" onClick={() => setAttachmentDetailActivityId(item.id)}><Eye size={16} /></button>
                      <button className="icon-button" title="Ver versiones enviadas a aprobación" onClick={() => setApprovalVersionsActivityId(item.id)}><FileText size={16} /></button>
                      <button className="icon-button" title="Editar datos del producto" onClick={() => openEditor(item)}><Edit3 size={16} /></button>
                      <button className="icon-button danger" title="Eliminar lógicamente el producto" onClick={() => removeActivity(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
                <div className="detail-grid compact-detail-grid">
                  <div className="detail-item"><span>KPI</span><strong>{highlight(item.mainKpi || "N/A", searchTerm)}</strong></div>
                  <div className="detail-item"><span>Entrega</span><strong>{item.productDeliveryDate ?? "Sin fecha"}</strong></div>
                  <div className="detail-item">
                    <span>Adjuntos</span>
                    <button className="link-button" type="button" title="Ver detalle de adjuntos" onClick={() => setAttachmentDetailActivityId(item.id)}>
                      {evidence.filter((file) => file.activityId === item.id).length}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <PaginationControls state={pagination} totalItems={filtered.length} onChange={setPagination} />
        </section>
      </section>
    </main>
  );
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function activityStatusLabel(status: string) {
  const normalized = normalizedActivityStatus(status);
  const labels: Record<string, string> = {
    Todo: "Por hacer",
    InProgress: "Producto en proceso",
    EvidenceAttached: "Evidencia adjunta",
    PendingApproval: "Pendiente de aprobación",
    Approved: "Aprobado",
    Rejected: "Producto en proceso"
  };
  return labels[normalized] ?? normalized;
}

function approvalDecisionLabel(decision: string) {
  return decision === "Approved" ? "Aprobado" : decision === "Rejected" ? "Rechazado" : decision;
}

function normalizedActivityStatus(status: string) {
  return status === "Rejected" ? "InProgress" : status;
}

function EvidencePreview({ item }: { item: EvidenceItem }) {
  const lowerName = item.fileName.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp)$/i.test(lowerName)) return <div className="file-preview"><img src={item.storageUrl} alt={item.fileName} /></div>;
  if (lowerName.endsWith(".pdf")) return <div className="file-preview"><iframe src={item.storageUrl} title={item.fileName} /></div>;
  return <div className="inline-facts"><span><FileText size={14} /> Vista previa no disponible para este tipo de archivo.</span></div>;
}

function SelectField({ label, name, items, defaultValue = "" }: { label: string; name: string; items: CatalogItem[]; defaultValue?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} required defaultValue={defaultValue}>
        <option value="">Seleccione...</option>
        {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
  );
}

function nextProductId(activities: Activity[]) {
  const max = activities.reduce((current, item) => {
    const match = /^PROD-(\d+)$/i.exec(item.productId.trim());
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `PROD-${String(max + 1).padStart(4, "0")}`;
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

function matchesSearch(item: Activity, term: string) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return [
    item.productId,
    item.productType,
    item.requirementType,
    item.productResponsible,
    item.diffusionChannel,
    item.mainKpi,
    activityStatusLabel(item.status),
    item.observations
  ].join(" ").toLowerCase().includes(query);
}

function highlight(text: string, term: string) {
  return <Highlight search={term}>{text}</Highlight>;
}

type StepState = "pending" | "ready" | "done";

function activityStepState(item: Activity, step: "start" | "evidence" | "approval"): StepState {
  const order = ["Todo", "InProgress", "EvidenceAttached", "PendingApproval", "Approved", "Rejected"];
  const current = order.indexOf(normalizedActivityStatus(item.status));
  if (step === "start") return current <= 0 ? "ready" : "done";
  if (step === "evidence") {
    if (current <= 0) return "pending";
    return current === 1 ? "ready" : "done";
  }
  if (current < 2) return "pending";
  return current === 2 ? "ready" : "done";
}

function workflowButtonClass(state: StepState) {
  if (state === "done") return "icon-button success";
  if (state === "ready") return "icon-button warning";
  return "icon-button pending";
}

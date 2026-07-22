"use client";

import { AppNav } from "../nav";
import { Activity, Requirement, defaultBrandSettings, getSession, showToast } from "../lib";
import { PaginationControls, paginate, type PaginationState } from "../pagination";
import { Highlight } from "../search";
import { ProductForm } from "../../features/products/components/ProductForm";
import type { Approval, EvidenceItem, ProductCatalogs, Technician } from "../../features/products/models/product.models";
import { createExternalProductEvidence, deleteProduct, deleteProductEvidence, getProductWorkspace, saveProduct, updateProductStatus, uploadProductEvidence } from "../../features/products/services/product.service";
import { approvalDecisionLabel, buildNextProductId, filterProductsForSession, filterRequirementsForSession, matchesProductSearch, normalizeProductStatus, productStatusLabel, productStepState, workflowButtonClass } from "../../features/products/utils/product.utils";
import { Edit3, Eye, FileText, Paperclip, Play, Plus, RefreshCw, Send, Trash2, Upload, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export default function ActivitiesPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [catalogs, setCatalogs] = useState<ProductCatalogs>({
    requirementTypes: [],
    targetAudiences: [],
    productTypes: [],
    diffusionChannels: [],
    mainKpis: []
  });
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
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });

  async function load() {
    const session = getSession();
    const workspace = await getProductWorkspace();
    const visibleRequirements = filterRequirementsForSession(workspace.requirements, session);
    const visibleActivities = filterProductsForSession(workspace.products, visibleRequirements, session);
    setRequirements(visibleRequirements);
    setActivities(visibleActivities);
    setEvidence(workspace.evidence.filter((item) => visibleActivities.some((activity) => activity.id === item.activityId)));
    setApprovals(workspace.approvals.filter((item) => visibleActivities.some((activity) => activity.id === item.activityId)));
    const fallbackUser = session
      ? [{ id: session.user.id, name: session.user.name, email: session.user.email, roles: session.user.roles, isActive: true }]
      : [];
    const technicalUsers = workspace.technicians.filter((user) => user.isActive && user.roles.some((role) => role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "tecnico"));
    setTechnicians(technicalUsers.length ? technicalUsers : fallbackUser);
    setCatalogs(workspace.catalogs);
    setSuggestedProductId(workspace.nextProductId ?? buildNextProductId(workspace.products));
    setShowProductIdField(workspace.showProductIdField);
  }

  async function openEditor(activity: Activity | null = null) {
    await load().catch(() => undefined);
    setEditing(activity);
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

  async function changeStatus(id: string, action: "start" | "submit-approval") {
    try {
      await updateProductStatus(id, action);
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
      await deleteProduct(id);
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
      await deleteProductEvidence(id);
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
        await uploadProductEvidence(form);
      } else {
        const url = new URL(attachmentUrl.trim());
        await createExternalProductEvidence({
            activityId: attachmentActivityId,
            fileName: String(form.get("urlName") || url.pathname.split("/").filter(Boolean).pop() || url.hostname),
            contentType: "text/uri-list",
            storageUrl: url.toString(),
            uploadedBy: form.get("uploadedBy")
        });
      }
      await updateProductStatus(attachmentActivityId, "evidence-attached");
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
    .filter((item) => showCompleted ? normalizeProductStatus(item.status) === "Approved" : normalizeProductStatus(item.status) !== "Approved")
    .filter((item) => matchesProductSearch(item, searchTerm));

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell tracking-layout">
        {isEditorOpen && (
          <ProductForm
            key={editing?.id ?? `new-${suggestedProductId}`}
            product={editing}
            suggestedProductId={suggestedProductId}
            showProductIdField={showProductIdField}
            requirements={requirements}
            catalogs={catalogs}
            technicians={technicians}
            onSave={saveProduct}
            onFeedback={(feedback, type) => showToast(feedback, type === "error" ? "error" : undefined)}
            onSuccess={async (successMessage) => {
              setMessage(successMessage);
              setEditing(null);
              setIsEditorOpen(false);
              await load();
            }}
            onCancel={() => { setEditing(null); setIsEditorOpen(false); }}
          />
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
                  <span className="badge">{productStatusLabel(activities.find((item) => item.id === attachmentDetailActivityId)?.status ?? "")}</span>
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
                        {!approvals.some((approval) => approval.activityId === file.activityId && ["Approved", "Rejected"].includes(approval.decision)) && <button className="icon-button danger" type="button" title="Eliminar adjunto" onClick={() => removeEvidence(file.id)}><Trash2 size={16} /></button>}
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
                    <span className="badge">{productStatusLabel(item.status)}</span>
                    <div className="actions">
                      {normalizeProductStatus(item.status) !== "Approved" && <>
                        <button className={workflowButtonClass(productStepState(item, "start"))} disabled={productStepState(item, "start") !== "ready"} title="Cambiar producto a en progreso" onClick={() => changeStatus(item.id, "start")}><Play size={16} /></button>
                        <button className={workflowButtonClass(productStepState(item, "evidence"))} disabled={productStepState(item, "evidence") !== "ready"} title="Adjuntar evidencia o archivo a este producto" onClick={() => setAttachmentActivityId(item.id)}><Paperclip size={16} /></button>
                        <button className={workflowButtonClass(productStepState(item, "approval"))} disabled={productStepState(item, "approval") !== "ready"} title="Enviar producto a aprobación" onClick={() => changeStatus(item.id, "submit-approval")}><Send size={16} /></button>
                      </>}
                      <button className="icon-button" title="Ver detalle y adjuntos del producto" onClick={() => setAttachmentDetailActivityId(item.id)}><Eye size={16} /></button>
                      <button className="icon-button" title="Ver versiones enviadas a aprobación" onClick={() => setApprovalVersionsActivityId(item.id)}><FileText size={16} /></button>
                      {normalizeProductStatus(item.status) !== "Approved" && <>
                        <button className="icon-button" title="Editar datos del producto" onClick={() => openEditor(item)}><Edit3 size={16} /></button>
                        <button className="icon-button danger" title="Eliminar lógicamente el producto" onClick={() => removeActivity(item.id)}><Trash2 size={16} /></button>
                      </>}
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

function EvidencePreview({ item }: { item: EvidenceItem }) {
  const lowerName = item.fileName.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp)$/i.test(lowerName)) return <div className="file-preview"><img src={item.storageUrl} alt={item.fileName} /></div>;
  if (lowerName.endsWith(".pdf")) return <div className="file-preview"><iframe src={item.storageUrl} title={item.fileName} /></div>;
  return <div className="inline-facts"><span><FileText size={14} /> Vista previa no disponible para este tipo de archivo.</span></div>;
}

function highlight(text: string, term: string) {
  return <Highlight search={term}>{text}</Highlight>;
}

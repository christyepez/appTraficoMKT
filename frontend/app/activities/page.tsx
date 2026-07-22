"use client";

import { AppNav } from "../nav";
import type { Activity } from "../lib";
import { ProductFilters } from "../../features/products/components/ProductFilters";
import { ProductForm } from "../../features/products/components/ProductForm";
import { ProductList } from "../../features/products/components/ProductList";
import { useProductsWorkspace } from "../../features/products/hooks/useProductsWorkspace";
import type { EvidenceItem } from "../../features/products/models/product.models";
import { createExternalProductEvidence, deleteProductEvidence, updateProductStatus, uploadProductEvidence } from "../../features/products/services/product.service";
import { approvalDecisionLabel, productStatusLabel } from "../../features/products/utils/product.utils";
import { Eye, FileText, Paperclip, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { FormEvent, useState } from "react";

export default function ActivitiesPage() {
  const workspace = useProductsWorkspace();
  const { requirements, products: activities, technicians, catalogs, evidence, approvals, suggestedProductId, showProductIdField, isInitialLoading, isRefreshing, loadError, message, pendingProductIds, refresh, save, changeStatus, remove, reportFeedback } = workspace;
  const [editing, setEditing] = useState<Activity | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [attachmentActivityId, setAttachmentActivityId] = useState("");
  const [attachmentDetailActivityId, setAttachmentDetailActivityId] = useState("");
  const [approvalVersionsActivityId, setApprovalVersionsActivityId] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [attachmentMode, setAttachmentMode] = useState<"file" | "url">("file");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  async function openEditor(activity: Activity | null = null) {
    await refresh().catch(() => undefined);
    setEditing(activity);
    setIsEditorOpen(true);
  }

  async function removeEvidence(id: string) {
    if (!window.confirm("¿Eliminar este adjunto? El archivo quedará inactivo.")) return;
    try {
      await deleteProductEvidence(id);
      reportFeedback("Adjunto eliminado correctamente.");
      await refresh();
    } catch (error) {
      reportFeedback(error instanceof Error ? error.message : "No se pudo eliminar el adjunto.", "error");
    }
  }

  function pickAttachment(nextFile?: File | null) {
    if (!nextFile) return;
    if (nextFile.size > 50 * 1024 * 1024) {
      reportFeedback("El archivo no puede superar 50 MB.", "error");
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
      reportFeedback("Seleccione un producto y complete el origen del adjunto.", "error");
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
      reportFeedback("Adjunto cargado en el producto.");
      await refresh();
    } finally {
      setIsUploading(false);
    }
  }

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
            onSave={save}
            onFeedback={reportFeedback}
            onSuccess={() => {
              setEditing(null);
              setIsEditorOpen(false);
            }}
            onCancel={() => { setEditing(null); setIsEditorOpen(false); }}
          />
        )}
        <section className="panel">
          <div className="card-head">
            <h2>Seguimiento de productos</h2>
            <div className="actions">
              <button className="icon-button" title="Crear producto" onClick={() => openEditor(null)}><Plus size={16} /></button>
              <button className="button secondary" title="Actualizar seguimiento de productos" disabled={isRefreshing} onClick={() => void refresh().catch(() => undefined)}><RefreshCw size={16} /> {isRefreshing ? "Actualizando" : "Actualizar"}</button>
            </div>
          </div>
          {message && <span className="badge">{message}</span>}
          <ProductFilters searchTerm={searchTerm} showCompleted={showCompleted} isRefreshing={isRefreshing} onSearchChange={setSearchTerm} onShowCompletedChange={setShowCompleted} />
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
          <ProductList
            products={activities}
            evidence={evidence}
            searchTerm={searchTerm}
            showCompleted={showCompleted}
            isInitialLoading={isInitialLoading}
            loadError={loadError}
            pendingProductIds={pendingProductIds}
            onRetry={() => void refresh().catch(() => undefined)}
            onChangeStatus={(productId, action) => void changeStatus(productId, action)}
            onAttach={setAttachmentActivityId}
            onViewEvidence={setAttachmentDetailActivityId}
            onViewApprovals={setApprovalVersionsActivityId}
            onEdit={(product) => void openEditor(product)}
            onDelete={(productId) => void remove(productId)}
          />
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

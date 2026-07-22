"use client";

import { AppNav } from "../nav";
import type { Activity } from "../lib";
import { ApprovalVersionsDialog } from "../../features/products/components/ApprovalVersionsDialog";
import { EvidenceGallery } from "../../features/products/components/EvidenceGallery";
import { ProductAttachmentPanel } from "../../features/products/components/ProductAttachmentPanel";
import { ProductFilters } from "../../features/products/components/ProductFilters";
import { ProductForm } from "../../features/products/components/ProductForm";
import { ProductList } from "../../features/products/components/ProductList";
import { useProductsWorkspace } from "../../features/products/hooks/useProductsWorkspace";
import { Plus, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function ActivitiesPage() {
  const workspace = useProductsWorkspace();
  const { requirements, products: activities, technicians, catalogs, evidence, approvals, suggestedProductId, showProductIdField, isInitialLoading, isRefreshing, loadError, message, pendingProductIds, pendingEvidenceIds, refresh, save, changeStatus, remove, uploadEvidence, addExternalEvidence, removeEvidence, reportFeedback } = workspace;
  const [editing, setEditing] = useState<Activity | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [attachmentActivityId, setAttachmentActivityId] = useState("");
  const [attachmentDetailActivityId, setAttachmentDetailActivityId] = useState("");
  const [approvalVersionsActivityId, setApprovalVersionsActivityId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  async function openEditor(activity: Activity | null = null) {
    await refresh().catch(() => undefined);
    setEditing(activity);
    setIsEditorOpen(true);
  }

  const attachmentProduct = activities.find((item) => item.id === attachmentActivityId);
  const evidenceProduct = activities.find((item) => item.id === attachmentDetailActivityId);
  const approvalProduct = activities.find((item) => item.id === approvalVersionsActivityId);

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
          {attachmentProduct && <ProductAttachmentPanel product={attachmentProduct} pending={pendingEvidenceIds.has(attachmentProduct.id)} onUploadFile={uploadEvidence} onUploadUrl={addExternalEvidence} onClose={() => setAttachmentActivityId("")} />}
          {evidenceProduct && <EvidenceGallery product={evidenceProduct} evidence={evidence} approvals={approvals} pendingEvidenceIds={pendingEvidenceIds} onDelete={(id) => void removeEvidence(id)} onClose={() => setAttachmentDetailActivityId("")} />}
          {approvalProduct && <ApprovalVersionsDialog product={approvalProduct} approvals={approvals} onViewEvidence={(id) => { setApprovalVersionsActivityId(""); setAttachmentDetailActivityId(id); }} onClose={() => setApprovalVersionsActivityId("")} />}
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

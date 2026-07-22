import { Eye, FileText, Trash2, X } from "lucide-react";
import type { Approval, EvidenceItem, Product } from "../models/product.models";
import { canDeleteEvidence } from "../utils/evidence.utils";
import { productStatusLabel } from "../utils/product.utils";
import { EvidencePreview } from "./EvidencePreview";
import { ProductDialog } from "./ProductDialog";

type EvidenceGalleryProps = {
  product: Product;
  evidence: EvidenceItem[];
  approvals: Approval[];
  pendingEvidenceIds: Set<string>;
  onDelete: (evidenceId: string) => void;
  onClose: () => void;
};

export function EvidenceGallery({ product, evidence, approvals, pendingEvidenceIds, onDelete, onClose }: EvidenceGalleryProps) {
  const items = evidence.filter((file) => file.activityId === product.id);
  return (
    <ProductDialog labelledBy="evidence-gallery-title" onClose={onClose}>
        <div className="card-head">
          <div><h2 id="evidence-gallery-title">Adjuntos del producto</h2><p>{product.productId}</p></div>
          <span className="badge">{productStatusLabel(product.status)}</span>
          <button autoFocus className="icon-button" type="button" title="Cerrar detalle de adjuntos" aria-label="Cerrar detalle de adjuntos" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="stack compact-stack top-space">
          {items.map((file) => (
            <details className="card compact-card" key={file.id}>
              <summary className="card-head collapse-title"><div className="compact-title"><h3><FileText size={16} /> {file.fileName}</h3><p>Subido por {file.uploadedBy || "Equipo técnico"}</p></div></summary>
              <div className="actions top-space">
                <a className="icon-button" href={file.storageUrl} target="_blank" rel="noreferrer" title="Abrir adjunto" aria-label={`Abrir ${file.fileName}`}><Eye size={16} /></a>
                {canDeleteEvidence(file.activityId, approvals) && <button className="icon-button danger" type="button" title="Eliminar adjunto" aria-label={`Eliminar ${file.fileName}`} disabled={pendingEvidenceIds.has(file.id)} onClick={() => onDelete(file.id)}><Trash2 size={16} /></button>}
              </div>
              <EvidencePreview fileName={file.fileName} source={file.storageUrl} />
            </details>
          ))}
          {items.length === 0 && <div className="empty">Sin adjuntos.</div>}
        </div>
    </ProductDialog>
  );
}

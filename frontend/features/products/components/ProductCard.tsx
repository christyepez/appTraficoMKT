import { Edit3, Eye, FileText, Trash2 } from "lucide-react";
import { Highlight } from "../../../app/search";
import type { Product } from "../models/product.models";
import { normalizeProductStatus, productStatusLabel } from "../utils/product.utils";
import { ProductWorkflowActions } from "./ProductWorkflowActions";

type ProductCardProps = {
  product: Product;
  searchTerm: string;
  evidenceCount: number;
  pending: boolean;
  onChangeStatus: (productId: string, action: "start" | "submit-approval") => void;
  onAttach: (productId: string) => void;
  onViewEvidence: (productId: string) => void;
  onViewApprovals: (productId: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
};

export function ProductCard({ product, searchTerm, evidenceCount, pending, onChangeStatus, onAttach, onViewEvidence, onViewApprovals, onEdit, onDelete }: ProductCardProps) {
  const approved = normalizeProductStatus(product.status) === "Approved";
  const highlight = (text: string) => <Highlight search={searchTerm}>{text}</Highlight>;

  return (
    <article className="card compact-card" aria-label={`${product.productId} - ${product.productType}`}>
      <div className="card-head">
        <div className="compact-title">
          <h3>{highlight(`${product.productId} - ${product.productType}`)}</h3>
          <p>{highlight(`${product.requirementType} | ${product.productResponsible} | ${product.diffusionChannel}`)}</p>
        </div>
        <div className="card-meta">
          <span className="badge">{productStatusLabel(product.status)}</span>
          <div className="actions">
            <ProductWorkflowActions product={product} pending={pending} onChangeStatus={onChangeStatus} onAttach={onAttach} />
            <button className="icon-button" type="button" title="Ver detalle y adjuntos del producto" aria-label="Ver detalle y adjuntos" onClick={() => onViewEvidence(product.id)}><Eye size={16} /></button>
            <button className="icon-button" type="button" title="Ver versiones enviadas a aprobación" aria-label="Ver versiones de aprobación" onClick={() => onViewApprovals(product.id)}><FileText size={16} /></button>
            {!approved && <>
              <button className="icon-button" type="button" disabled={pending} title="Editar datos del producto" aria-label="Editar producto" onClick={() => onEdit(product)}><Edit3 size={16} /></button>
              <button className="icon-button danger" type="button" disabled={pending} title="Eliminar lógicamente el producto" aria-label="Eliminar producto" onClick={() => onDelete(product.id)}><Trash2 size={16} /></button>
            </>}
          </div>
        </div>
      </div>
      <div className="detail-grid compact-detail-grid">
        <div className="detail-item"><span>KPI</span><strong>{highlight(product.mainKpi || "N/A")}</strong></div>
        <div className="detail-item"><span>Entrega</span><strong>{product.productDeliveryDate ?? "Sin fecha"}</strong></div>
        <div className="detail-item">
          <span>Adjuntos</span>
          <button className="link-button" type="button" title="Ver detalle de adjuntos" onClick={() => onViewEvidence(product.id)}>{evidenceCount}</button>
        </div>
      </div>
    </article>
  );
}

import { Paperclip, X } from "lucide-react";
import type { Approval, Product } from "../models/product.models";
import { approvalDecisionLabel } from "../utils/product.utils";

type ApprovalVersionsDialogProps = {
  product: Product;
  approvals: Approval[];
  onViewEvidence: (productId: string) => void;
  onClose: () => void;
};

export function ApprovalVersionsDialog({ product, approvals, onViewEvidence, onClose }: ApprovalVersionsDialogProps) {
  const versions = approvals.filter((approval) => approval.activityId === product.id).sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="approval-versions-title" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <section className="modal-panel">
        <div className="card-head">
          <div><h2 id="approval-versions-title">Versiones enviadas a aprobación</h2><p>{product.productId}</p></div>
          <button autoFocus className="icon-button" type="button" title="Cerrar versiones de aprobación" aria-label="Cerrar versiones de aprobación" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="stack compact-stack top-space">
          {versions.map((approval, index) => (
            <article className="card compact-card" key={approval.id}>
              <div className="card-head"><div className="compact-title"><h3>Versión {index + 1} - {approvalDecisionLabel(approval.decision)}</h3><p>{formatDate(approval.createdAt)} | {approval.approvedBy}</p></div><span className="badge">{approvalDecisionLabel(approval.decision)}</span></div>
              <div className="inline-facts"><span>{approval.comments || "Sin comentarios."}</span><button className="button secondary compact-button" type="button" title="Ver adjuntos enviados para esta aprobación" onClick={() => onViewEvidence(product.id)}><Paperclip size={14} /> Ver adjuntos</button></div>
            </article>
          ))}
          {versions.length === 0 && <div className="empty">Este producto aún no tiene versiones enviadas a aprobación.</div>}
        </div>
      </section>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

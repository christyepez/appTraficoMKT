import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { Highlight } from "../../../app/search";
import type { Activity, Approval } from "../models/approval.models";
import { approvalStatusLabel, formatApprovalDate } from "../utils/approval.utils";
import styles from "../styles/Approval.module.css";

export function ApprovalCard({
  activity,
  approvals,
  search,
  canDecide,
  pending,
  onDecision,
  onEvidence
}: {
  activity: Activity;
  approvals: Approval[];
  search: string;
  canDecide: boolean;
  pending: boolean;
  onDecision: (decision: "Approved" | "Rejected") => void;
  onEvidence: () => void;
}) {
  const versions = approvals.filter((item) => item.activityId === activity.id);
  const hasPendingApproval = versions.some((approval) => (approval.status ?? approval.decision) === "Pending");
  const actionable = activity.status === "PendingApproval" && canDecide && hasPendingApproval;

  return <article className={`card compact-card ${styles.card}`}>
    <div className="card-head">
      <div className="compact-title">
        <h3><Highlight search={search}>{`${activity.productId} - ${activity.productType}`}</Highlight></h3>
        <p><Highlight search={search}>{`${activity.productResponsible} | ${activity.mainKpi}`}</Highlight></p>
      </div>
      <div className="card-meta">
        <span className="badge">{approvalStatusLabel(activity.status)}</span>
        <div className="actions">
          {actionable && <>
            <button className="icon-button success" type="button" aria-label={`Aprobar ${activity.productId}`} disabled={pending} onClick={() => onDecision("Approved")}><CheckCircle2 size={16} /></button>
            <button className="icon-button danger" type="button" aria-label={`Rechazar ${activity.productId}`} disabled={pending} onClick={() => onDecision("Rejected")}><XCircle size={16} /></button>
          </>}
          <button className="icon-button" type="button" aria-label={`Ver adjuntos de ${activity.productId}`} onClick={onEvidence}><Eye size={16} /></button>
        </div>
      </div>
    </div>
    <div className="detail-grid compact-detail-grid">
      <div className="detail-item"><span>Responsable</span><strong>{activity.productResponsible}</strong></div>
      <div className="detail-item"><span>Entrega</span><strong>{activity.productDeliveryDate ?? "Sin fecha"}</strong></div>
      <div className="detail-item"><span>Tipo</span><strong>{activity.requirementType}</strong></div>
      <div className="detail-item"><span>Canal</span><strong>{activity.diffusionChannel}</strong></div>
      <div className="detail-item"><span>KPI</span><strong>{activity.mainKpi || "N/A"}</strong></div>
      <div className="detail-item"><span>Objetivo estratégico</span><strong>{activity.strategicObjective || "Sin detalle"}</strong></div>
    </div>
    {versions.map((approval) => <div className="inline-facts" key={approval.id}>
      <span>{approvalLabel(approval)} por {approval.decidedByEmail || approval.approvedBy || approval.approverEmail || "Pendiente"}</span>
      <span>Enviado: {formatApprovalDate(approval.submittedAt ?? approval.createdAt)}</span>
      {approval.decidedAt && <span>Decisión: {formatApprovalDate(approval.decidedAt)}</span>}
      <span>Canal: {approval.decisionSource || "web"}</span>
      {approval.comments && <span>{approval.comments}</span>}
    </div>)}
  </article>;
}

function approvalLabel(approval: Approval) {
  const status = approval.status ?? approval.decision;
  if (status === "Pending") return "Pendiente";
  if (approval.decision === "Approved") return "Aprobado";
  if (approval.decision === "Rejected") return "Rechazado";
  return status;
}

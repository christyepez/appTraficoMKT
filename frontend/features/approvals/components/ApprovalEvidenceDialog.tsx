import { Eye, FileText, X } from "lucide-react";
import { AccessibleDialog } from "../../../shared/components/AccessibleDialog";
import { EvidencePreview } from "../../../shared/components/EvidencePreview";
import type { Activity, EvidenceItem } from "../models/approval.models";
import { approvalStatusLabel } from "../utils/approval.utils";
import styles from "../styles/Approval.module.css";

export function ApprovalEvidenceDialog({ activity, evidence, onClose }: { activity: Activity; evidence: EvidenceItem[]; onClose: () => void }) {
  const files = evidence.filter((item) => item.activityId === activity.id);
  return <AccessibleDialog labelledBy="approval-evidence-title" onClose={onClose} backdropClassName={styles.dialogBackdrop} panelClassName={styles.dialogPanel}><div className="card-head"><div><h2 id="approval-evidence-title">Adjuntos del producto</h2><p>{activity.productId}</p></div><span className="badge">{approvalStatusLabel(activity.status)}</span><button autoFocus className="icon-button" type="button" aria-label="Cerrar adjuntos" onClick={onClose}><X size={16} /></button></div><div className="stack compact-stack top-space">{files.map((file) => <article className="card compact-card" key={file.id}><div className="card-head"><span><FileText size={14} /> {file.fileName}</span><a className="button secondary compact-button" href={file.storageUrl} target="_blank" rel="noreferrer"><Eye size={14} /> Abrir</a></div><EvidencePreview fileName={file.fileName} source={file.storageUrl} contentType={file.contentType} className={styles.preview} /></article>)}{files.length === 0 && <div className="empty">Este producto no tiene adjuntos.</div>}</div></AccessibleDialog>;
}

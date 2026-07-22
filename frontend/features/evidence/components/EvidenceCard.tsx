import { ChevronDown, ChevronRight, Eye, FileText } from "lucide-react";
import { CrudActionButton } from "../../../shared/components/CrudActionButton";
import { canDeleteEvidence } from "../../../shared/utils/evidence.utils";
import type { Activity, Approval, EvidenceItem } from "../models/evidence.models";
import { isFinalActivity } from "../utils/evidence-workspace.utils";
import { EvidencePreview } from "./EvidencePreview";
import styles from "../styles/Evidence.module.css";

type EvidenceCardProps = {
  activity: Activity;
  evidence: EvidenceItem[];
  approvals: Approval[];
  expanded: boolean;
  pendingIds: Set<string>;
  onToggle: () => void;
  onAttach: () => void;
  onDelete: (evidenceId: string) => void;
};

export function EvidenceCard({ activity, evidence, approvals, expanded, pendingIds, onToggle, onAttach, onDelete }: EvidenceCardProps) {
  const files = evidence.filter((item) => item.activityId === activity.id);
  const decisions = approvals.filter((item) => item.activityId === activity.id);
  return (
    <article className={`card compact-card ${styles.card}`}>
      <div className="card-head">
        <button className="collapse-title" type="button" aria-expanded={expanded} onClick={onToggle}>{expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}<span>{activity.productId} - {activity.productType}</span></button>
        <div className="card-meta"><span className="badge">{files.length} adjunto(s)</span><span className="badge">{decisions.length} aprobación(es)</span><CrudActionButton action="create" label={`Adjuntar evidencia a ${activity.productId}`} disabled={isFinalActivity(activity.status)} onClick={onAttach} /></div>
      </div>
      <div className="detail-grid compact-detail-grid"><div className="detail-item"><span>Responsable</span><strong>{activity.productResponsible}</strong></div><div className="detail-item"><span>Canal</span><strong>{activity.diffusionChannel}</strong></div><div className="detail-item"><span>KPI</span><strong>{activity.mainKpi}</strong></div></div>
      {expanded && <div className="nested-detail top-space">
        {files.map((item) => <article className="card compact-card" key={item.id}><div className="card-head"><div className="compact-title"><h3><FileText size={16} /> {item.fileName}</h3><p>{item.uploadedBy || "Equipo técnico"} | {item.contentType || "Archivo"}</p></div><div className="actions"><a className="icon-button" href={item.storageUrl} target="_blank" rel="noreferrer" aria-label={`Abrir ${item.fileName}`}><Eye size={16} /></a>{canDeleteEvidence(activity.id, approvals) && <CrudActionButton action="delete" label={`Eliminar ${item.fileName}`} disabled={pendingIds.has(item.id)} onClick={() => onDelete(item.id)} />}</div></div><EvidencePreview fileName={item.fileName} source={item.storageUrl} contentType={item.contentType} /></article>)}
        {files.length === 0 && <div className="empty">Este producto aún no tiene adjuntos.</div>}
        {decisions.length > 0 && <div className="inline-facts">{decisions.map((item) => <span key={item.id}>{item.decision} | {item.approvedBy}{item.comments ? ` | ${item.comments}` : ""}</span>)}</div>}
      </div>}
    </article>
  );
}

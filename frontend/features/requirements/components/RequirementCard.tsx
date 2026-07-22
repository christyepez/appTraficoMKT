import { Edit3, Eye, Trash2 } from "lucide-react";
import { Highlight } from "../../../app/search";
import type { Requirement, RequirementStatusAction } from "../models/requirement.models";
import { isFinalRequirement, requirementStatusLabel } from "../utils/requirement.utils";
import { RequirementWorkflowActions } from "./RequirementWorkflowActions";
import styles from "../styles/Requirements.module.css";

type Props = { requirement: Requirement; search: string; pending: boolean; canManage: boolean; onProducts: (value: Requirement) => void; onStatus: (id: string, action: RequirementStatusAction) => void; onEdit: (value: Requirement) => void; onDelete: (id: string) => void };

export function RequirementCard({ requirement, search, pending, canManage, onProducts, onStatus, onEdit, onDelete }: Props) {
  const highlight = (value: string) => <Highlight search={search}>{value}</Highlight>;
  const editable = canManage && !isFinalRequirement(requirement.status);
  return (
    <article className={`card compact-card ${styles.card}`} aria-label={`${requirement.code} - ${requirement.activityOrEvent}`}>
      <div className="card-head">
        <div className="compact-title"><h3>{highlight(`${requirement.code} - ${requirement.activityOrEvent}`)}</h3><p>{highlight(`${requirement.requestedBy} | ${requirement.faculty} | ${requirement.career}`)}</p></div>
        <div className="card-meta"><span className="badge">{requirementStatusLabel(requirement.status)}</span><div className="actions">
          <button className="icon-button" type="button" title="Ver productos relacionados" aria-label="Ver productos relacionados" onClick={() => onProducts(requirement)}><Eye size={16} /></button>
          {editable && <><RequirementWorkflowActions requirement={requirement} pending={pending} onChangeStatus={onStatus} /><button className="icon-button" type="button" disabled={pending} title="Editar datos del requerimiento" aria-label="Editar requerimiento" onClick={() => onEdit(requirement)}><Edit3 size={16} /></button><button className="icon-button danger" type="button" disabled={pending} title="Eliminar lógicamente el requerimiento" aria-label="Eliminar requerimiento" onClick={() => onDelete(requirement.id)}><Trash2 size={16} /></button></>}
        </div></div>
      </div>
      <div className="inline-facts"><span>{requirement.campus} - {requirement.place}</span><span>{requirement.startDate} a {requirement.endDate}</span></div>
    </article>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { AccessibleDialog } from "../../../shared/components/AccessibleDialog";
import type { Activity, ApprovalDecision } from "../models/approval.models";
import { approvalDecisionSchema, type ApprovalDecisionValues } from "../schemas/approval.schema";
import styles from "../styles/Approval.module.css";

export function ApprovalDecisionForm({ activity, initialDecision, pending, onSubmit, onClose }: { activity: Activity; initialDecision: ApprovalDecision; pending: boolean; onSubmit: (decision: ApprovalDecision, comments: string) => Promise<boolean>; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ApprovalDecisionValues>({ resolver: zodResolver(approvalDecisionSchema), defaultValues: { decision: initialDecision, comments: initialDecision === "Approved" ? "Producto aprobado." : "Producto rechazado." } });
  async function submit(values: ApprovalDecisionValues) { if (await onSubmit(values.decision, values.comments)) onClose(); }
  return <AccessibleDialog labelledBy="approval-decision-title" onClose={onClose} closeDisabled={pending} backdropClassName={styles.dialogBackdrop} panelClassName={styles.dialogPanel}><div className="card-head"><div><h2 id="approval-decision-title">Registrar decisión</h2><p>{activity.productId} - {activity.productType}</p></div><button autoFocus className="icon-button" type="button" aria-label="Cerrar decisión" disabled={pending} onClick={onClose}><X size={16} /></button></div><form className="form" onSubmit={handleSubmit(submit)} noValidate><label className="field"><span>Decisión</span><select {...register("decision")} disabled={pending}><option value="Approved">Aprobar</option><option value="Rejected">Rechazar</option></select></label><label className="field field-wide"><span>Comentarios</span><textarea {...register("comments")} disabled={pending} rows={4} />{errors.comments && <small role="alert">{errors.comments.message}</small>}</label><button className="button compact" disabled={pending}><CheckCircle2 size={16} /> {pending ? "Registrando" : "Confirmar decisión"}</button></form></AccessibleDialog>;
}

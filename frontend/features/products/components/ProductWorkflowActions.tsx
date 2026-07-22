import { Paperclip, Play, Send } from "lucide-react";
import type { Product } from "../models/product.models";
import { normalizeProductStatus, productStepState, workflowButtonClass } from "../utils/product.utils";
import styles from "../styles/Product.module.css";

type ProductWorkflowActionsProps = {
  product: Product;
  pending: boolean;
  onChangeStatus: (productId: string, action: "start" | "submit-approval") => void;
  onAttach: (productId: string) => void;
};

export function ProductWorkflowActions({ product, pending, onChangeStatus, onAttach }: ProductWorkflowActionsProps) {
  if (normalizeProductStatus(product.status) === "Approved") return null;
  const startState = productStepState(product, "start");
  const evidenceState = productStepState(product, "evidence");
  const approvalState = productStepState(product, "approval");

  return (
    <span className={styles.workflowActions} role="group" aria-label="Acciones del workflow">
      <button className={workflowButtonClass(startState)} type="button" disabled={pending || startState !== "ready"} title="Cambiar producto a en progreso" aria-label="Cambiar producto a en progreso" onClick={() => onChangeStatus(product.id, "start")}><Play size={16} /></button>
      <button className={workflowButtonClass(evidenceState)} type="button" disabled={pending || evidenceState !== "ready"} title="Adjuntar evidencia o archivo a este producto" aria-label="Adjuntar evidencia o archivo" onClick={() => onAttach(product.id)}><Paperclip size={16} /></button>
      <button className={workflowButtonClass(approvalState)} type="button" disabled={pending || approvalState !== "ready"} title="Enviar producto a aprobación" aria-label="Enviar producto a aprobación" onClick={() => onChangeStatus(product.id, "submit-approval")}><Send size={16} /></button>
    </span>
  );
}

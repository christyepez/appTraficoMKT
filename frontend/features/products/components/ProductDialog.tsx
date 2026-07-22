import { type ReactNode } from "react";
import { AccessibleDialog } from "../../../shared/components/AccessibleDialog";
import styles from "../styles/Product.module.css";

type ProductDialogProps = {
  labelledBy: string;
  children: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
};

export function ProductDialog({ labelledBy, children, onClose, closeDisabled = false }: ProductDialogProps) {
  return <AccessibleDialog labelledBy={labelledBy} onClose={onClose} closeDisabled={closeDisabled} backdropClassName={styles.dialogBackdrop} panelClassName={styles.dialogPanel}>{children}</AccessibleDialog>;
}

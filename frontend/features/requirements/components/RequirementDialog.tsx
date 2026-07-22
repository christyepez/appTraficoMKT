import type { ReactNode } from "react";
import { AccessibleDialog } from "../../../shared/components/AccessibleDialog";
import styles from "../styles/Requirements.module.css";

export function RequirementDialog({ labelledBy, children, onClose, closeDisabled = false, wide = false }: { labelledBy: string; children: ReactNode; onClose: () => void; closeDisabled?: boolean; wide?: boolean }) {
  return <AccessibleDialog labelledBy={labelledBy} onClose={onClose} closeDisabled={closeDisabled} backdropClassName={styles.backdrop} panelClassName={`${styles.dialog} ${wide ? styles.wideDialog : ""}`}>{children}</AccessibleDialog>;
}

import type { AuditRow } from "../models/audit.models";
import { prettyAuditValue } from "../utils/audit.utils";
import styles from "../styles/Audit.module.css";

export function AuditEventDetail({ row }: { row: AuditRow }) {
  const value = row.payloadJson || row.comments; if (!value) return null;
  return <details className="top-space"><summary>Ver detalle del evento</summary><pre className={styles.json}>{prettyAuditValue(value)}</pre></details>;
}

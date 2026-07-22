import type { AuditRow } from "../models/audit.models";
import { prettyAuditValue } from "../utils/audit.utils";

export function AuditEventDetail({ row }: { row: AuditRow }) {
  const value = row.payloadJson || row.comments; if (!value) return null;
  return <details className="top-space"><summary>Ver detalle del evento</summary><pre className="json-preview">{prettyAuditValue(value)}</pre></details>;
}

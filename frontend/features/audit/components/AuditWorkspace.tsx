import type { AuditLogWorkspace } from "../hooks/useAuditLog";
import { formatAuditDate } from "../utils/audit.utils";
import { AuditFilters } from "./AuditFilters";
import { AuditList } from "./AuditList";
import styles from "../styles/Audit.module.css";

export function AuditWorkspace({ workspace }: { workspace: AuditLogWorkspace }) {
  return <section className={`content-shell ${styles.shell}`}><section className="panel"><div className="card-head"><div><span className="eyebrow">Trazabilidad</span><h2>Auditorías</h2><p>Tracking administrativo de requerimientos, productos y aprobaciones.</p></div><AuditFilters source={workspace.source} search={workspace.search} refreshing={workspace.isRefreshing} onSource={workspace.setSource} onSearch={workspace.setSearch} onRefresh={() => void workspace.refresh().catch(() => undefined)} /></div>{workspace.warnings.length > 0 && workspace.warnings.length < 3 && <p className={styles.warning} role="status">Datos parciales: {workspace.warnings.join(" ")}</p>}<div className="detail-grid compact-detail-grid top-space"><div className="detail-item"><span>Total eventos</span><strong>{workspace.rows.length}</strong></div><div className="detail-item"><span>Filtrados</span><strong>{workspace.filteredRows.length}</strong></div><div className="detail-item"><span>Último evento</span><strong>{formatAuditDate(workspace.rows[0]?.occurredAt)}</strong></div></div><AuditList rows={workspace.filteredRows} loading={workspace.isLoading} error={workspace.loadError} onRetry={() => void workspace.refresh().catch(() => undefined)} /></section></section>;
}

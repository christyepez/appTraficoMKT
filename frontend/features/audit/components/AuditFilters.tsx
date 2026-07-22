import { RefreshCw } from "lucide-react";
import type { AuditSource } from "../models/audit.models";

export function AuditFilters({ source, search, refreshing, onSource, onSearch, onRefresh }: { source: AuditSource; search: string; refreshing: boolean; onSource: (value: AuditSource) => void; onSearch: (value: string) => void; onRefresh: () => void }) {
  return <><div className="actions"><label className="field compact-field"><span>Tracking</span><select value={source} onChange={(event) => onSource(event.target.value as AuditSource)}>{["Todas", "Requerimientos", "Productos", "Aprobaciones"].map((item) => <option key={item}>{item}</option>)}</select></label><button className="button secondary" type="button" disabled={refreshing} onClick={onRefresh}><RefreshCw size={16} /> {refreshing ? "Actualizando" : "Actualizar"}</button></div><label className="field top-space"><span>Buscar</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Acción, usuario, estado, decisión…" /></label></>;
}

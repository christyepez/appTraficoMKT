import { BarChart3, RefreshCw } from "lucide-react";
import type { MetricsConcept } from "../models/metrics.models";

export function MetricsToolbar({ concept, refreshing, onConcept, onRefresh }: { concept: MetricsConcept; refreshing: boolean; onConcept: (value: MetricsConcept) => void; onRefresh: () => void }) {
  return <div className="card-head"><div><h2>Métricas</h2><p className="hint"><BarChart3 size={16} /> Indicadores de carga, ejecución, tiempos, incidencia y participación.</p></div><div className="actions"><label className="field compact-field"><span>Concepto</span><select value={concept} onChange={(event) => onConcept(event.target.value as MetricsConcept)}><option value="summary">Resumen ejecutivo</option><option value="workload">Carga operativa</option><option value="times">Tiempos y esfuerzo</option><option value="impact">Incidencia institucional</option><option value="participation">Participación por áreas</option><option value="usage">Usabilidad de usuarios</option></select></label><button className="button secondary" type="button" disabled={refreshing} onClick={onRefresh}><RefreshCw size={16} /> {refreshing ? "Actualizando" : "Actualizar"}</button></div></div>;
}

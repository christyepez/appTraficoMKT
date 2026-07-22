import type { StageMetric } from "../models/metrics.models";

export function StageSection({ title, items }: { title: string; items: StageMetric[] }) {
  return <section className="panel"><h2>{title}</h2><div className="stack">{items.length === 0 && <div className="empty">Sin datos históricos suficientes.</div>}{items.map((item) => <div className="detail-grid compact-detail-grid" key={item.stage}><div className="detail-item"><span>Etapa</span><strong>{item.stage}</strong></div><div className="detail-item"><span>Horas promedio</span><strong>{item.averageHours}</strong></div><div className="detail-item"><span>Eventos</span><strong>{item.events}</strong></div></div>)}</div></section>;
}

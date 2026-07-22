import type { MetricSlice } from "../models/metrics.models";
import { metricBarPercentage, visibleSlices } from "../utils/metrics.utils";

export function MetricSection({ title, items }: { title: string; items: MetricSlice[] }) {
  const visible = visibleSlices(items);
  return <section className="panel"><h2>{title}</h2><div className="stack">{visible.length === 0 && <div className="empty">Sin datos.</div>}{visible.map((item) => <div className="metric-row" key={item.name}><div><strong>{item.name}</strong><span>{item.count} registros</span></div><div className="metric-bar"><span style={{ width: `${metricBarPercentage(item.percentage)}%` }} /></div><b>{item.percentage}%</b></div>)}</div></section>;
}

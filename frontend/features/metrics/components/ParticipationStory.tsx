import type { MetricSlice, RequirementMetrics } from "../models/metrics.models";
import { metricBarPercentage, visibleSlices } from "../utils/metrics.utils";

export function ParticipationStory({ requirements }: { requirements: RequirementMetrics | null }) {
  return <section className="panel story-panel"><h2>Participación por áreas</h2><p className="hint">Distribución de la demanda institucional.</p><div className="story-stack"><StoryMetric title="1. Área con mayor demanda" items={requirements?.byFaculty ?? []} empty="Sin datos de facultades." /><StoryMetric title="2. Sede con mayor operación" items={requirements?.byCampus ?? []} empty="Sin datos de sedes." /><StoryMetric title="3. Formato más utilizado" items={requirements?.byFormat ?? []} empty="Sin datos de formatos." /></div></section>;
}

function StoryMetric({ title, items, empty }: { title: string; items: MetricSlice[]; empty: string }) {
  const visible = visibleSlices(items, 5), leader = visible[0];
  return <article className="story-card"><div><h3>{title}</h3>{leader ? <p><strong>{leader.name}</strong> concentra {leader.count} registros, equivalente al {leader.percentage}%.</p> : <p>{empty}</p>}</div><div className="story-bars">{visible.map((item) => <div className="story-bar" key={item.name}><span>{item.name}</span><div><b style={{ width: `${metricBarPercentage(item.percentage)}%` }} /></div><em>{item.count}</em></div>)}</div></article>;
}

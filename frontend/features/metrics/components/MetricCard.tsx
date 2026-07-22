export function MetricCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <article className="card metric-card"><span>{label}</span><strong>{Number.isFinite(value) ? value : 0}</strong><p>{detail}</p></article>;
}

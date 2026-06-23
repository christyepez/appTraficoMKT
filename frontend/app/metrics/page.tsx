"use client";

import { AppNav } from "../nav";
import { api, t } from "../lib";
import { BarChart3, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

type MetricSlice = {
  name: string;
  count: number;
  percentage: number;
};

type StageMetric = {
  stage: string;
  averageHours: number;
  events: number;
};

type RequirementMetrics = {
  totalRequirements: number;
  completedRequirements: number;
  activeRequirements: number;
  averageCycleDays: number;
  byStatus: MetricSlice[];
  byFaculty: MetricSlice[];
  byCampus: MetricSlice[];
  byFormat: MetricSlice[];
  averageHoursByStage: StageMetric[];
};

type ProductMetrics = {
  totalProducts: number;
  approvedProducts: number;
  activeProducts: number;
  averageCycleDays: number;
  byStatus: MetricSlice[];
  workloadByResponsible: MetricSlice[];
  byProductType: MetricSlice[];
  byDiffusionChannel: MetricSlice[];
  byMainKpi: MetricSlice[];
  byTargetAudience: MetricSlice[];
  averageHoursByStage: StageMetric[];
};

type ApprovalMetrics = {
  totalApprovals: number;
  approvedApprovals: number;
  rejectedApprovals: number;
  auditEvents: number;
  byDecision: MetricSlice[];
  lastAuditAt?: string;
};

export default function MetricsPage() {
  const [requirements, setRequirements] = useState<RequirementMetrics | null>(null);
  const [products, setProducts] = useState<ProductMetrics | null>(null);
  const [approvals, setApprovals] = useState<ApprovalMetrics | null>(null);
  const [concept, setConcept] = useState("resumen");

  async function load() {
    const [requirementData, productData, approvalData] = await Promise.all([
      api<RequirementMetrics>("/api/requirements/metrics"),
      api<ProductMetrics>("/api/activities/metrics"),
      api<ApprovalMetrics>("/api/approvals/metrics")
    ]);
    setRequirements(requirementData);
    setProducts(productData);
    setApprovals(approvalData);
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 30000);
    load().catch(() => location.assign("/login"));
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell tracking-layout">
        <section className="panel">
          <div className="card-head">
            <div>
              <h2>{t("Métricas")}</h2>
              <p className="hint"><BarChart3 size={16} /> Indicadores para carga operativa, ejecución anual, tiempos, incidencia y participación del equipo.</p>
            </div>
            <div className="actions">
              <label className="field compact-field">
                <span>Concepto</span>
                <select value={concept} onChange={(event) => setConcept(event.target.value)}>
                  <option value="resumen">Resumen ejecutivo</option>
                  <option value="carga">Carga operativa</option>
                  <option value="tiempos">Tiempos y esfuerzo</option>
                  <option value="incidencia">Incidencia institucional</option>
                  <option value="participacion">Participación por áreas</option>
                </select>
              </label>
              <button className="button secondary" title="Actualizar métricas" onClick={load}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>
          <div className="metric-grid top-space">
            <MetricCard label="Requerimientos" value={requirements?.totalRequirements ?? 0} detail={`${requirements?.completedRequirements ?? 0} completados`} />
            <MetricCard label="Productos" value={products?.totalProducts ?? 0} detail={`${products?.approvedProducts ?? 0} aprobados`} />
            <MetricCard label="Ciclo req." value={requirements?.averageCycleDays ?? 0} detail="días promedio" />
            <MetricCard label="Ciclo prod." value={products?.averageCycleDays ?? 0} detail="días promedio" />
            <MetricCard label="Eventos auditados" value={auditEvents(requirements, products, approvals)} detail="acciones registradas" />
            <MetricCard label="Esfuerzo estimado" value={estimatedEffortHours(requirements, products)} detail="horas por auditoría" />
          </div>
        </section>

        <section className="metrics-sections">
          {concept === "resumen" && (
            <>
              <MetricSection title="Proyectos por estado" items={requirements?.byStatus ?? []} />
              <MetricSection title="Productos por estado" items={products?.byStatus ?? []} />
              <MetricSection title="Aprobaciones por decisión" items={approvals?.byDecision ?? []} />
            </>
          )}
          {concept === "carga" && (
            <>
              <MetricSection title="Carga operativa del equipo" items={products?.workloadByResponsible ?? []} />
              <MetricSection title="Productos por tipo" items={products?.byProductType ?? []} />
            </>
          )}
          {concept === "tiempos" && (
            <>
              <StageSection title="Tiempo promedio por etapa de requerimiento" items={requirements?.averageHoursByStage ?? []} />
              <StageSection title="Tiempo promedio por etapa de producto" items={products?.averageHoursByStage ?? []} />
            </>
          )}
          {concept === "incidencia" && (
            <>
              <MetricSection title="Incidencia por canal de difusión" items={products?.byDiffusionChannel ?? []} />
              <MetricSection title="Incidencia por KPI principal" items={products?.byMainKpi ?? []} />
              <MetricSection title="Público objetivo" items={products?.byTargetAudience ?? []} />
              <MetricSection title="Control de aprobaciones" items={approvals?.byDecision ?? []} />
            </>
          )}
          {concept === "participacion" && (
            <ParticipationStory requirements={requirements} />
          )}
        </section>
      </section>
    </main>
  );
}

function ParticipationStory({ requirements }: { requirements: RequirementMetrics | null }) {
  return (
    <section className="panel story-panel">
      <h2>Participación por áreas</h2>
      <p className="hint">Lectura vertical para entender dónde se concentra la demanda institucional y cómo se distribuye la participación.</p>
      <div className="story-stack">
        <StoryMetric title="1. Área con mayor demanda" items={requirements?.byFaculty ?? []} empty="Sin datos de facultades." />
        <StoryMetric title="2. Sede con mayor operación" items={requirements?.byCampus ?? []} empty="Sin datos de sedes." />
        <StoryMetric title="3. Formato más utilizado" items={requirements?.byFormat ?? []} empty="Sin datos de formatos." />
      </div>
    </section>
  );
}

function StoryMetric({ title, items, empty }: { title: string; items: MetricSlice[]; empty: string }) {
  const [leader, ...rest] = items;
  const visible = [leader, ...rest].filter((item): item is MetricSlice => Boolean(item)).slice(0, 5);
  return (
    <article className="story-card">
      <div>
        <h3>{title}</h3>
        {!leader && <p>{empty}</p>}
        {leader && <p><strong>{leader.name}</strong> concentra {leader.count} registros, equivalente al {leader.percentage}% del total.</p>}
      </div>
      <div className="story-bars">
        {visible.map((item) => (
          <div className="story-bar" key={item.name}>
            <span>{item.name}</span>
            <div><b style={{ width: `${Math.min(item.percentage, 100)}%` }} /></div>
            <em>{item.count}</em>
          </div>
        ))}
      </div>
    </article>
  );
}

function auditEvents(requirements: RequirementMetrics | null, products: ProductMetrics | null, approvals: ApprovalMetrics | null) {
  return [...(requirements?.averageHoursByStage ?? []), ...(products?.averageHoursByStage ?? [])]
    .reduce((total, item) => total + item.events, approvals?.auditEvents ?? 0);
}

function estimatedEffortHours(requirements: RequirementMetrics | null, products: ProductMetrics | null) {
  return Number([...(requirements?.averageHoursByStage ?? []), ...(products?.averageHoursByStage ?? [])]
    .reduce((total, item) => total + item.averageHours * item.events, 0)
    .toFixed(1));
}

function MetricCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="card metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function MetricSection({ title, items }: { title: string; items: MetricSlice[] }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="stack">
        {items.length === 0 && <div className="empty">Sin datos.</div>}
        {items.slice(0, 8).map((item) => (
          <div className="metric-row" key={item.name}>
            <div>
              <strong>{item.name}</strong>
              <span>{item.count} registros</span>
            </div>
            <div className="metric-bar"><span style={{ width: `${Math.min(item.percentage, 100)}%` }} /></div>
            <b>{item.percentage}%</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function StageSection({ title, items }: { title: string; items: StageMetric[] }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="stack">
        {items.length === 0 && <div className="empty">Sin datos históricos suficientes.</div>}
        {items.map((item) => (
          <div className="detail-grid compact-detail-grid" key={item.stage}>
            <div className="detail-item"><span>Etapa</span><strong>{item.stage}</strong></div>
            <div className="detail-item"><span>Horas promedio</span><strong>{item.averageHours}</strong></div>
            <div className="detail-item"><span>Eventos</span><strong>{item.events}</strong></div>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { AppNav } from "../nav";
import { Activity, api, t } from "../lib";
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

type UsageMetrics = {
  totalUsers: number;
  activeUsers: number;
  usersLoggedLast7Days: number;
  averageHoursSinceLastLogin: number;
  recentUsers: { name: string; email: string; roles: string; lastLoginAt?: string; isActive: boolean }[];
};

export default function MetricsPage() {
  const [requirements, setRequirements] = useState<RequirementMetrics | null>(null);
  const [products, setProducts] = useState<ProductMetrics | null>(null);
  const [approvals, setApprovals] = useState<ApprovalMetrics | null>(null);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [concept, setConcept] = useState("resumen");

  async function load() {
    const [requirementData, productData, approvalData, usageData, activityData] = await Promise.all([
      api<RequirementMetrics>("/api/requirements/metrics"),
      api<ProductMetrics>("/api/activities/metrics"),
      api<ApprovalMetrics>("/api/approvals/metrics"),
      api<UsageMetrics>("/api/identity/usage-metrics"),
      api<Activity[]>("/api/activities").catch(() => [])
    ]);
    setRequirements(requirementData);
    setProducts(productData);
    setApprovals(approvalData);
    setUsage(usageData);
    setActivities(activityData);
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
                  <option value="usabilidad">Usabilidad de usuarios</option>
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
            <MetricCard label="Usuarios activos" value={usage?.activeUsers ?? 0} detail={`${usage?.usersLoggedLast7Days ?? 0} con ingreso en 7 días`} />
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
          {concept === "usabilidad" && (
            <UsageSection usage={usage} activities={activities} />
          )}
        </section>
      </section>
    </main>
  );
}

function UsageSection({ usage, activities }: { usage: UsageMetrics | null; activities: Activity[] }) {
  const users = usage?.recentUsers ?? [];
  const grouped = users.map((user) => {
    const keys = [user.email, user.name].map((value) => value.toLowerCase());
    const assigned = activities.filter((activity) => keys.includes(activity.productResponsible.toLowerCase()));
    const approved = assigned.filter((activity) => activity.status === "Approved").length;
    const inProgress = assigned.filter((activity) => activity.status !== "Approved").length;
    return { user, assigned, approved, inProgress };
  });

  return (
    <section className="panel">
      <h2>Usabilidad de usuarios</h2>
      <div className="metric-grid top-space">
        <MetricCard label="Usuarios" value={usage?.totalUsers ?? 0} detail="registrados" />
        <MetricCard label="Activos" value={usage?.activeUsers ?? 0} detail="habilitados" />
        <MetricCard label="Uso reciente" value={usage?.usersLoggedLast7Days ?? 0} detail="últimos 7 días" />
        <MetricCard label="Horas sin uso" value={usage?.averageHoursSinceLastLogin ?? 0} detail="promedio desde último login" />
      </div>
      <div className="stack compact-stack top-space">
        {grouped.map(({ user, assigned, approved, inProgress }) => (
          <article className="card compact-card" key={user.email}>
            <div className="card-head">
              <div className="compact-title">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
              <span className="badge">{user.isActive ? "Activo" : "Inactivo"}</span>
            </div>
            <div className="detail-grid compact-detail-grid">
              <div className="detail-item"><span>Roles</span><strong>{user.roles}</strong></div>
              <div className="detail-item"><span>Último ingreso</span><strong>{user.lastLoginAt ? formatDate(user.lastLoginAt) : "Sin ingreso"}</strong></div>
              <div className="detail-item"><span>Productos asignados</span><strong>{assigned.length}</strong></div>
              <div className="detail-item"><span>En gestión</span><strong>{inProgress}</strong></div>
              <div className="detail-item"><span>Aprobados</span><strong>{approved}</strong></div>
            </div>
            {assigned.length > 0 && (
              <div className="nested-detail top-space">
                {assigned.slice(0, 5).map((activity) => (
                  <div className="inline-facts" key={activity.id}>
                    <span>{activity.productId}</span>
                    <span>{activity.productType}</span>
                    <span>{activity.status}</span>
                    <span>{activity.productDeliveryDate ?? "Sin entrega"}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
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

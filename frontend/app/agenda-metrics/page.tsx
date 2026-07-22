"use client";
import { CapacityIndicator } from "../../features/agenda-metrics/components/CapacityIndicator";
import { MetricSummary } from "../../features/agenda-metrics/components/MetricSummary";
import { MetricsFilters } from "../../features/agenda-metrics/components/MetricsFilters";
import { OperationalDetail } from "../../features/agenda-metrics/components/OperationalDetail";
import { TechnicianWorkload } from "../../features/agenda-metrics/components/TechnicianWorkload";
import { useAgendaMetrics } from "../../features/agenda-metrics/hooks/useAgendaMetrics";
import styles from "../../features/agenda-metrics/styles/Metrics.module.css";
import calendarPatterns from "../../shared/styles/CalendarPatterns.module.css";
import { AppNav } from "../nav";

export default function AgendaMetricsPage() {
  const workspace = useAgendaMetrics();

  return (
    <main className="app-shell">
      <AppNav />
      <section className={`content-shell ${calendarPatterns.root} ${styles.shell}`}>
        <section className="calendar-hero">
          <div className="calendar-page-head">
            <div>
              <span className="eyebrow">Operación de marketing</span>
              <h2>Métricas de agenda</h2>
              <p>Capacidad, carga operativa, planificación pendiente y riesgo.</p>
            </div>
          </div>
        </section>

        <section className={`panel calendar-command-panel ${styles.commandPanel}`}>
          <MetricsFilters
            technicians={workspace.technicians}
            campuses={workspace.campuses}
            statuses={workspace.statuses}
            period={workspace.period}
            cursorDate={workspace.cursorDate}
            technician={workspace.selectedTechnician}
            campus={workspace.selectedCampus}
            status={workspace.selectedStatus}
            search={workspace.search}
            refreshing={workspace.isRefreshing}
            onPeriod={workspace.setPeriod}
            onTechnician={workspace.setSelectedTechnician}
            onCampus={workspace.setSelectedCampus}
            onStatus={workspace.setSelectedStatus}
            onSearch={workspace.setSearch}
            onMove={workspace.movePeriod}
            onToday={workspace.today}
            onRefresh={() => void workspace.refresh().catch(() => undefined)}
          />
          {workspace.metrics && <MetricSummary value={workspace.metrics.summary} />}
        </section>

        {workspace.isLoading ? (
          <div className={`panel ${styles.state}`} role="status">Cargando métricas…</div>
        ) : workspace.loadError && !workspace.metrics ? (
          <div className={`panel ${styles.state}`} role="alert">
            {workspace.loadError}
            <button className="button secondary compact-button" onClick={() => void workspace.refresh().catch(() => undefined)}>
              Reintentar
            </button>
          </div>
        ) : workspace.metrics ? (
          <>
            <div className={styles.dashboard}>
              <TechnicianWorkload title="Carga por sede" items={workspace.metrics.campusLoad} />
              <TechnicianWorkload title="Carga por técnico" items={workspace.metrics.technicianLoad} />
              <CapacityIndicator value={workspace.metrics.summary} />
            </div>
            <OperationalDetail metrics={workspace.metrics} />
          </>
        ) : null}
      </section>
    </main>
  );
}

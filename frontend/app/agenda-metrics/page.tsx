"use client";

import { AppNav } from "../nav";
import { Activity, api, getSession, Requirement, showToast } from "../lib";
import { BarChart3, ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type User = { id: string; name: string; email: string; roles: string[]; isActive: boolean };
type MetricPeriod = "day" | "week" | "month";
type AgendaItem = {
  id: string;
  activityId: string;
  requirementId: string;
  productId: string;
  productType: string;
  technicianName: string;
  technicianEmail: string;
  startAt: string;
  endAt: string;
  title: string;
  notes: string;
};

export default function AgendaMetricsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [period, setPeriod] = useState<MetricPeriod>("week");
  const [cursorDate, setCursorDate] = useState(startOfDay(new Date()));
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    const session = getSession();
    const [activityData, requirementData, userData, agendaData] = await Promise.all([
      api<Activity[]>("/api/activities"),
      api<Requirement[]>("/api/requirements"),
      api<User[]>("/api/identity/users/technicians").catch(() => []),
      api<AgendaItem[]>("/api/agenda").catch(() => [])
    ]);
    const canSeeAll = session?.user.roles.includes("Administrador") || session?.user.roles.includes("Coordinador");
    const visibleTechnicians = canSeeAll ? userData : userData.filter((user) => user.email.toLowerCase() === session?.user.email.toLowerCase());
    const fallback = session ? [{ id: session.user.id, name: session.user.name, email: session.user.email, roles: session.user.roles, isActive: true }] : [];
    const techs = visibleTechnicians.length ? visibleTechnicians : fallback;
    setTechnicians(techs);
    setSelectedTechnician((current) => current || (canSeeAll ? "" : techs[0]?.email || ""));
    setActivities(filterActivities(activityData, session));
    setRequirements(requirementData);
    setItems(agendaData);
  }

  useEffect(() => {
    load().catch((error) => {
      showToast(error instanceof Error ? error.message : "No se pudo cargar métricas de agenda.", "error");
      if (!getSession()) location.assign("/login");
    });
  }, []);

  const requirementById = useMemo(() => new Map(requirements.map((item) => [item.id, item])), [requirements]);
  const activityById = useMemo(() => new Map(activities.map((item) => [item.id, item])), [activities]);
  const campusOptions = useMemo(() => uniqueOptions(requirements.map((item) => item.campus).filter(Boolean)), [requirements]);
  const statusOptions = useMemo(() => uniqueOptions(activities.map((item) => item.status).filter(Boolean)), [activities]);
  const periodDays = period === "day" ? [cursorDate] : period === "week" ? weekDays(cursorDate) : monthDays(cursorDate);
  const agendaItems = useMemo(() => mergeManualAndActivityReservations(items, activities, requirementById, technicians), [items, activities, requirementById, technicians]);
  const visibleItems = useMemo(() => agendaItems
    .filter((item) => !selectedTechnician || item.technicianEmail.toLowerCase() === selectedTechnician.toLowerCase())
    .filter((item) => {
      const activity = activityById.get(item.activityId);
      const requirement = requirementById.get(item.requirementId);
      return (!selectedCampus || requirement?.campus === selectedCampus)
        && (!selectedStatus || activity?.status === selectedStatus);
    })
    .filter((item) => matchesAgenda(item, search, activityById.get(item.activityId), requirementById.get(item.requirementId))), [agendaItems, selectedTechnician, selectedCampus, selectedStatus, search, activityById, requirementById]);
  const periodItems = visibleItems.filter((item) => isInPeriod(item, periodDays));
  const scheduledActivityIds = new Set(periodItems.map((item) => item.activityId));
  const filteredActivities = activities
    .filter((item) => {
      const requirement = requirementById.get(item.requirementId);
      return (!selectedTechnician || item.productResponsible.toLowerCase() === selectedTechnician.toLowerCase())
        && (!selectedCampus || requirement?.campus === selectedCampus)
        && (!selectedStatus || item.status === selectedStatus);
    })
    .filter((item) => matchesActivity(item, search, requirementById.get(item.requirementId)));
  const plannedHours = periodItems.reduce((total, item) => total + duration(item), 0);
  const capacityHours = Math.max(1, (selectedTechnician ? 1 : Math.max(technicians.length, 1)) * capacityByPeriod(period));
  const occupancy = Math.min(100, Math.round((plannedHours / capacityHours) * 100));
  const availability = Math.max(0, capacityHours - plannedHours);
  const pendingPlanning = filteredActivities.filter((item) => !scheduledActivityIds.has(item.id) && !isClosed(item.status)).length;
  const atRisk = filteredActivities.filter((item) => {
    if (!item.productDeliveryDate || isClosed(item.status)) return false;
    const delivery = new Date(item.productDeliveryDate);
    return !scheduledActivityIds.has(item.id) && delivery.getTime() <= addDays(new Date(), 7).getTime();
  }).length;

  function movePeriod(direction: number) {
    setCursorDate((current) => period === "day" ? addDays(current, direction) : period === "week" ? addDays(current, direction * 7) : addMonths(current, direction));
  }

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell calendar-shell">
        <section className="calendar-hero">
          <div className="calendar-page-head">
            <div>
              <span className="eyebrow">Operación de marketing</span>
              <h2>Métricas de agenda</h2>
              <p>Capacidad, carga operativa, planificación pendiente y riesgo de entrega del equipo técnico.</p>
            </div>
          </div>
        </section>

        <section className="panel calendar-command-panel">
          <div className="calendar-actions-left">
            <button className="button secondary compact" type="button" title="Periodo anterior" onClick={() => movePeriod(-1)}><ChevronLeft size={16} /> Anterior</button>
            <button className="button secondary compact" type="button" title="Volver a hoy" onClick={() => setCursorDate(startOfDay(new Date()))}>Hoy</button>
            <button className="button secondary compact" type="button" title="Periodo siguiente" onClick={() => movePeriod(1)}>Siguiente <ChevronRight size={16} /></button>
            <button className="button secondary compact" type="button" title="Actualizar métricas de agenda" onClick={() => load()}><RefreshCw size={16} /> Actualizar</button>
          </div>

          <label className="field calendar-search top-space">
            <span>Buscar</span>
            <div className="input-with-icon"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Producto, requerimiento, técnico, sede, estado..." /></div>
          </label>

          <div className="calendar-filter-strip top-space">
            <label className="field">
              <span>Técnico</span>
              <select value={selectedTechnician} onChange={(event) => setSelectedTechnician(event.target.value)}>
                {technicians.length > 1 && <option value="">Todos los técnicos</option>}
                {technicians.map((item) => <option key={item.id} value={item.email}>{item.name} - {item.email}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Sede</span>
              <select value={selectedCampus} onChange={(event) => setSelectedCampus(event.target.value)}>
                <option value="">Todas las sedes</option>
                {campusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Estado</span>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                <option value="">Todos los estados</option>
                {statusOptions.map((item) => <option key={item} value={item}>{activityStatusLabel(item)}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Periodo</span>
              <select value={period} onChange={(event) => setPeriod(event.target.value as MetricPeriod)}>
                <option value="day">Día</option>
                <option value="week">Semana laboral</option>
                <option value="month">Mes</option>
              </select>
            </label>
            <div className="detail-item">
              <span>Rango analizado</span>
              <strong>{periodLabel(cursorDate, period)}</strong>
            </div>
          </div>

          <div className="calendar-kpis top-space">
            <div className="detail-item accent-blue"><span>Ocupación del periodo</span><strong>{occupancy}%</strong><small>{plannedHours.toFixed(1)} de {capacityHours} horas</small></div>
            <div className="detail-item accent-green"><span>Disponibilidad</span><strong>{availability.toFixed(1)} h</strong><small>Capacidad filtrada</small></div>
            <div className="detail-item accent-orange"><span>Pendientes</span><strong>{pendingPlanning}</strong><small>Requieren planificación</small></div>
            <div className="detail-item accent-red"><span>En riesgo</span><strong>{atRisk}</strong><small>Entrega próxima sin agenda</small></div>
          </div>
        </section>

        <section className="dashboard-grid top-space">
          <div className="panel agenda-load-panel">
            <h2>Carga por sede</h2>
            <div className="agenda-load-list top-space">
              {loadByCampus(periodItems, requirementById, selectedCampus).map((item) => <ProgressRow key={item.label} label={item.label} value={item.value} max={Math.max(1, periodItems.length)} />)}
              {periodItems.length === 0 && <div className="empty">Sin agenda para calcular carga por sede.</div>}
            </div>
          </div>
          <div className="panel agenda-attention-panel">
            <h2>Atención del coordinador</h2>
            <div className="attention-list top-space">
              <AttentionItem tone="danger" title={`${atRisk} productos en riesgo`} detail="Entrega próxima sin planificación visible." />
              <AttentionItem tone="warning" title={`${pendingPlanning} pendientes de agenda`} detail="Requieren bloque de trabajo técnico." />
              <AttentionItem tone="success" title={`${periodItems.length} bloques planificados`} detail={`${plannedHours.toFixed(1)} horas registradas en agenda.`} />
            </div>
          </div>
        </section>

        <section className="panel top-space">
          <div className="card-head">
            <div>
              <h2>Detalle operativo</h2>
              <p>Productos filtrados para revisar planificación, sede, estado y responsable.</p>
            </div>
            <span className="badge"><BarChart3 size={14} /> {filteredActivities.length} productos</span>
          </div>
          <div className="table-scroll top-space">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Requerimiento</th>
                  <th>Sede</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th>Entrega</th>
                  <th>Agenda</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity) => {
                  const requirement = requirementById.get(activity.requirementId);
                  const agenda = periodItems.filter((item) => item.activityId === activity.id);
                  return (
                    <tr key={activity.id}>
                      <td><strong>{activity.productId}</strong><br />{activity.productType}</td>
                      <td>{requirement?.code ?? activity.requirementId}<br />{requirement?.activityOrEvent ?? "Sin requerimiento"}</td>
                      <td>{requirement?.campus ?? "Sin sede"}</td>
                      <td>{activity.productResponsible}</td>
                      <td>{activityStatusLabel(activity.status)}</td>
                      <td>{activity.productDeliveryDate ? shortDate(new Date(activity.productDeliveryDate)) : "Sin fecha"}</td>
                      <td>{agenda.length ? `${agenda.length} bloque(s), ${agenda.reduce((total, item) => total + duration(item), 0).toFixed(1)} h` : "Sin planificación"}</td>
                    </tr>
                  );
                })}
                {filteredActivities.length === 0 && <tr><td colSpan={7}>No hay productos para los filtros seleccionados.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function ProgressRow({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = Math.round((value / max) * 100);
  return <div className="agenda-progress-row"><span>{label}</span><div><b style={{ width: `${percent}%` }} /></div><strong>{percent}%</strong></div>;
}

function AttentionItem({ tone, title, detail }: { tone: "danger" | "warning" | "success"; title: string; detail: string }) {
  return <div className={`attention-item ${tone}`}><span /><div><strong>{title}</strong><small>{detail}</small></div></div>;
}

function mergeManualAndActivityReservations(manualItems: AgendaItem[], activities: Activity[], requirements: Map<string, Requirement>, technicians: User[]) {
  const manualActivityIds = new Set(manualItems.map((item) => item.activityId));
  const generated = activities
    .filter((activity) => !manualActivityIds.has(activity.id) && !isClosed(activity.status))
    .flatMap((activity) => buildActivityReservations(activity, requirements.get(activity.requirementId), technicians));
  return [...manualItems, ...generated];
}

function buildActivityReservations(activity: Activity, requirement: Requirement | undefined, technicians: User[]) {
  const start = parseRequirementDate(requirement?.startDate);
  const end = parseRequirementDate(requirement?.endDate || activity.productDeliveryDate || requirement?.startDate);
  if (!start || !end) return [];
  const responsible = resolveTechnician(activity.productResponsible, technicians);
  const days = daysBetween(start, end);
  return days.map((day) => ({
    id: `auto-${activity.id}-${day.toISOString().slice(0, 10)}`,
    activityId: activity.id,
    requirementId: activity.requirementId,
    productId: activity.productId,
    productType: activity.productType,
    technicianName: responsible.name,
    technicianEmail: responsible.email,
    startAt: withTime(day, 8, 0).toISOString(),
    endAt: withTime(day, 17, 0).toISOString(),
    title: `${activity.productId} - ${activity.productType}`,
    notes: "Reserva automática por fechas del requerimiento."
  }));
}

function parseRequirementDate(date?: string | null) {
  if (!date) return null;
  const value = new Date(`${date.slice(0, 10)}T08:00`);
  return Number.isNaN(value.getTime()) ? null : startOfDay(value);
}

function resolveTechnician(value: string, technicians: User[]) {
  const key = value.toLowerCase();
  const technician = technicians.find((item) => item.email.toLowerCase() === key || item.name.toLowerCase() === key);
  return { name: technician?.name ?? value, email: technician?.email ?? value };
}

function filterActivities(activities: Activity[], session: ReturnType<typeof getSession>) {
  if (!session) return [];
  if (session.user.roles.includes("Administrador") || session.user.roles.includes("Coordinador")) return activities;
  const keys = [session.user.email, session.user.name].map((value) => value.toLowerCase());
  return activities.filter((item) => keys.includes(item.productResponsible.toLowerCase()));
}

function matchesAgenda(item: AgendaItem, term: string, activity?: Activity, requirement?: Requirement) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return [item.title, item.notes, item.productId, item.productType, item.technicianName, item.technicianEmail, activity?.status ?? "", requirement?.campus ?? "", requirement?.activityOrEvent ?? ""]
    .some((value) => value.toLowerCase().includes(query));
}

function matchesActivity(item: Activity, term: string, requirement?: Requirement) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return [item.productId, item.productType, item.productResponsible, item.status, item.observations, requirement?.campus ?? "", requirement?.activityOrEvent ?? "", requirement?.code ?? ""]
    .some((value) => value.toLowerCase().includes(query));
}

function isInPeriod(item: AgendaItem, days: Date[]) {
  return days.some((day) => isSameDay(new Date(item.startAt), day));
}

function duration(item: AgendaItem) {
  return Math.max(0, (new Date(item.endAt).getTime() - new Date(item.startAt).getTime()) / 3600000);
}

function capacityByPeriod(period: MetricPeriod) {
  if (period === "day") return 8;
  if (period === "month") return 160;
  return 40;
}

function isClosed(status: string) {
  return ["Approved", "Completed"].includes(status);
}

function daysBetween(start: Date, end: Date) {
  const first = startOfDay(start);
  const last = startOfDay(end);
  const days: Date[] = [];
  for (let day = first; day.getTime() <= last.getTime(); day = addDays(day, 1)) days.push(day);
  return days;
}

function withTime(value: Date, hour: number, minute: number) {
  const date = new Date(value);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function loadByCampus(items: AgendaItem[], requirements: Map<string, Requirement>, selectedCampus: string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const campus = requirements.get(item.requirementId)?.campus || "Sin sede";
    if (selectedCampus && campus !== selectedCampus) continue;
    counts.set(campus, (counts.get(campus) ?? 0) + 1);
  }
  return Array.from(counts, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function periodLabel(value: Date, period: MetricPeriod) {
  if (period === "day") return formatFullDate(value);
  if (period === "week") {
    const days = weekDays(value);
    return `${shortDate(days[0])} - ${shortDate(days[days.length - 1])}`;
  }
  return value.toLocaleDateString("es-EC", { month: "long", year: "numeric" });
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, amount: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return startOfDay(date);
}

function addMonths(value: Date, amount: number) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + amount);
  return startOfDay(date);
}

function weekDays(value: Date) {
  const day = startOfDay(value);
  const mondayOffset = (day.getDay() + 6) % 7;
  const monday = addDays(day, -mondayOffset);
  return Array.from({ length: 5 }, (_, index) => addDays(monday, index));
}

function monthDays(value: Date) {
  const start = new Date(value.getFullYear(), value.getMonth(), 1);
  const end = new Date(value.getFullYear(), value.getMonth() + 1, 0);
  return Array.from({ length: end.getDate() }, (_, index) => startOfDay(new Date(value.getFullYear(), value.getMonth(), index + 1)));
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function shortDate(value: Date) {
  return value.toLocaleDateString("es-EC", { day: "2-digit", month: "short" });
}

function formatFullDate(value: Date) {
  return value.toLocaleDateString("es-EC", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function activityStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Draft: "Borrador",
    InProgress: "En proceso",
    PendingApproval: "Pendiente aprobación",
    Approved: "Aprobado",
    Rejected: "Rechazado",
    Completed: "Completado"
  };
  return labels[status] ?? (status || "Sin estado");
}

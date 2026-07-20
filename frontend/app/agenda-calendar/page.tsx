"use client";

import { AppNav } from "../nav";
import { Activity, api, getSession, Requirement, showToast, type BrandSettings, defaultBrandSettings } from "../lib";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Edit3, ExternalLink, ListFilter, RefreshCw, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type User = { id: string; name: string; email: string; roles: string[]; isActive: boolean };
type CalendarMode = "day" | "week" | "month" | "list";
type WeekScope = "workdays" | "full";
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

export default function AgendaCalendarPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [mode, setMode] = useState<CalendarMode>("week");
  const [weekScope, setWeekScope] = useState<WeekScope>("workdays");
  const [cursorDate, setCursorDate] = useState(startOfDay(new Date()));
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [workdayStartTime, setWorkdayStartTime] = useState(defaultBrandSettings.workdayStartTime);
  const [workdayEndTime, setWorkdayEndTime] = useState(defaultBrandSettings.workdayEndTime);
  const [replanningWindowDays, setReplanningWindowDays] = useState(defaultBrandSettings.replanningWindowDays);

  async function load() {
    const session = getSession();
    const [activityData, requirementData, userData, agendaData, brandData] = await Promise.all([
      api<Activity[]>("/api/activities"),
      api<Requirement[]>("/api/requirements"),
      api<User[]>("/api/identity/users/technicians").catch(() => []),
      api<AgendaItem[]>("/api/agenda").catch(() => []),
      api<Partial<BrandSettings>>("/api/identity/brand-settings").catch(() => defaultBrandSettings)
    ]);
    const visibleTechnicians = session?.user.roles.includes("Administrador") || session?.user.roles.includes("Coordinador")
      ? userData
      : userData.filter((user) => user.email.toLowerCase() === session?.user.email.toLowerCase());
    const fallback = session ? [{ id: session.user.id, name: session.user.name, email: session.user.email, roles: session.user.roles, isActive: true }] : [];
    const techs = visibleTechnicians.length ? visibleTechnicians : fallback;
    setTechnicians(techs);
    const canSeeAll = session?.user.roles.includes("Administrador") || session?.user.roles.includes("Coordinador");
    setSelectedTechnician((current) => current || (canSeeAll ? "" : techs[0]?.email || ""));
    setActivities(filterActivities(activityData, session));
    setRequirements(requirementData);
    setItems(agendaData);
    setWorkdayStartTime(normalizeTime(brandData.workdayStartTime, defaultBrandSettings.workdayStartTime));
    setWorkdayEndTime(normalizeTime(brandData.workdayEndTime, defaultBrandSettings.workdayEndTime));
    setReplanningWindowDays(Number.isFinite(brandData.replanningWindowDays) ? Number(brandData.replanningWindowDays) : defaultBrandSettings.replanningWindowDays);
  }

  useEffect(() => {
    load().catch((error) => {
      showToast(error instanceof Error ? error.message : "No se pudo cargar el calendario técnico.", "error");
      if (!getSession()) location.assign("/login");
    });
  }, []);

  const activityById = useMemo(() => new Map(activities.map((item) => [item.id, item])), [activities]);
  const requirementById = useMemo(() => new Map(requirements.map((item) => [item.id, item])), [requirements]);
  const campusOptions = useMemo(() => uniqueOptions(requirements.map((item) => item.campus).filter(Boolean)), [requirements]);
  const statusOptions = useMemo(() => uniqueOptions(activities.map((item) => item.status).filter(Boolean)), [activities]);
  const workdayRange = useMemo(() => buildWorkdayRange(workdayStartTime, workdayEndTime), [workdayStartTime, workdayEndTime]);
  const dayHours = useMemo(() => buildDayHours(workdayRange.startHour, workdayRange.endHour), [workdayRange]);
  const agendaItems = useMemo(() => mergeManualAndActivityReservations(items, activities, requirementById, technicians, workdayRange), [items, activities, requirementById, technicians, workdayRange]);
  const visibleItems = useMemo(() => agendaItems
    .filter((item) => !selectedTechnician || item.technicianEmail.toLowerCase() === selectedTechnician.toLowerCase())
    .filter((item) => {
      const activity = activityById.get(item.activityId);
      const requirement = requirementById.get(item.requirementId);
      const campusMatches = !selectedCampus || requirement?.campus === selectedCampus;
      const statusMatches = !selectedStatus || activity?.status === selectedStatus;
      return campusMatches && statusMatches;
    })
    .filter((item) => matchesAgenda(item, search, activityById.get(item.activityId), requirementById.get(item.requirementId))), [agendaItems, selectedTechnician, selectedCampus, selectedStatus, search, activityById, requirementById]);
  const includeWeekend = weekScope === "full";
  const periodDays = mode === "month" ? monthGrid(cursorDate) : mode === "week" || mode === "list" ? weekDays(cursorDate, includeWeekend) : [startOfDay(cursorDate)];
  const periodItems = visibleItems.filter((item) => isInPeriod(item, periodDays));

  function movePeriod(direction: number) {
    setCursorDate((current) => {
      if (mode === "day") return addDays(current, direction);
      if (mode === "week" || mode === "list") return addDays(current, direction * 7);
      return addMonths(current, direction);
    });
  }

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell calendar-shell">
        <section className="calendar-hero">
          <div className="calendar-page-head">
            <div>
              <span className="eyebrow">Operación de marketing</span>
              <h2>Calendario técnico</h2>
              <p>Planifica requerimientos, compromisos y capacidad disponible del equipo técnico.</p>
            </div>
          </div>
        </section>

        <section className="panel calendar-command-panel">
          <div className="calendar-toolbar">
            <div className="calendar-actions-left">
              <button className="button secondary compact" type="button" title="Volver a hoy" onClick={() => setCursorDate(startOfDay(new Date()))}>Hoy</button>
              <button className="button secondary compact" type="button" title="Actualizar calendario" onClick={() => load()}><RefreshCw size={16} /> Actualizar</button>
              <Link className="button compact" href="/agenda" title="Ir al maestro detalle de agenda"><Edit3 size={16} /> Gestionar agenda</Link>
            </div>
            <div className="calendar-actions-right">
              <div className="segmented-control" aria-label="Modo de calendario">
                <button className={mode === "day" ? "active" : ""} type="button" onClick={() => setMode("day")}>Día</button>
                <button className={mode === "week" ? "active" : ""} type="button" onClick={() => setMode("week")}>Semana</button>
                <button className={mode === "month" ? "active" : ""} type="button" onClick={() => setMode("month")}>Mes</button>
                <button className={mode === "list" ? "active" : ""} type="button" onClick={() => setMode("list")}>Lista</button>
              </div>
              <div className="period-navigation">
                <button className="icon-button" type="button" title="Periodo anterior" onClick={() => movePeriod(-1)}><ChevronLeft size={16} /></button>
                <label className="calendar-date-field">
                  <span>Fecha</span>
                  <input type="date" value={toDateInput(cursorDate)} onChange={(event) => setCursorDate(startOfDay(new Date(`${event.target.value}T00:00`)))} />
                </label>
                <button className="icon-button" type="button" title="Periodo siguiente" onClick={() => movePeriod(1)}><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>

          <label className="field calendar-search top-space">
            <span>Buscar</span>
            <div className="input-with-icon"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Producto, título, técnico, notas..." /></div>
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
          </div>

        </section>

        <section className="panel calendar-panel top-space">
          <div className="card-head calendar-visual-head">
            <div>
              <h2>{mode === "list" ? "Próximos compromisos" : "Visual de agenda"}</h2>
              <p>{periodLabel(cursorDate, mode, includeWeekend)} | {calendarSummary(periodItems, mode)} | Jornada {workdayStartTime}-{workdayEndTime} | Replanificación {replanningWindowDays} días</p>
            </div>
            <div className="calendar-visual-actions">
              <label className="check-field calendar-week-toggle">
                <input type="checkbox" checked={weekScope === "full"} disabled={mode === "day" || mode === "month"} onChange={(event) => setWeekScope(event.target.checked ? "full" : "workdays")} />
                Mostrar días semanales
              </label>
              <span className="badge"><ListFilter size={14} /> {mode === "day" ? "Vista día" : mode === "week" ? "Vista semana" : mode === "month" ? "Vista mes" : "Vista lista"}</span>
            </div>
          </div>
          {mode === "day" && <DayView date={cursorDate} items={periodItems} hours={dayHours} onOpen={setSelectedItem} />}
          {mode === "week" && <WeekView days={periodDays} items={periodItems} hours={dayHours} onOpen={setSelectedItem} />}
          {mode === "month" && <MonthView cursorDate={cursorDate} days={periodDays} items={periodItems} onOpen={setSelectedItem} />}
          {mode === "list" && <ListView items={periodItems} onOpen={setSelectedItem} />}
        </section>

        {selectedItem && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <section className="modal-panel">
              <div className="card-head">
                <div>
                  <h2>{selectedItem.title}</h2>
                  <p>{selectedItem.productId} | {selectedItem.productType}</p>
                </div>
                <button className="icon-button" type="button" title="Cerrar detalle de agenda" onClick={() => setSelectedItem(null)}><X size={16} /></button>
              </div>
              <div className="detail-grid top-space">
                <div className="detail-item"><span>Inicio</span><strong>{formatDateTime(selectedItem.startAt)}</strong></div>
                <div className="detail-item"><span>Fin</span><strong>{formatDateTime(selectedItem.endAt)}</strong></div>
                <div className="detail-item"><span>Duración</span><strong>{duration(selectedItem).toFixed(1)} h</strong></div>
                <div className="detail-item"><span>Técnico</span><strong>{selectedItem.technicianName}</strong></div>
                <div className="detail-item"><span>Sede</span><strong>{requirementById.get(selectedItem.requirementId)?.campus ?? "Sin sede"}</strong></div>
                <div className="detail-item"><span>Estado producto</span><strong>{activityStatusLabel(activityById.get(selectedItem.activityId)?.status ?? "")}</strong></div>
                <div className="detail-item"><span>Requerimiento</span><strong>{selectedItem.requirementId}</strong></div>
                <div className="detail-item"><span>Producto</span><strong>{selectedItem.productId}</strong></div>
              </div>
              {selectedItem.notes && <p className="muted-text top-space">{selectedItem.notes}</p>}
              <div className="form-actions top-space">
                <Link className="button" href="/agenda" title="Abrir gestión de agenda"><ExternalLink size={16} /> Abrir gestión</Link>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function DayView({ date, items, hours, onOpen }: { date: Date; items: AgendaItem[]; hours: number[]; onOpen: (item: AgendaItem) => void }) {
  return (
    <div className="day-calendar top-space">
      <div className="day-calendar-head">
        <CalendarDays size={18} />
        <strong>{formatFullDate(date)}</strong>
      </div>
      <div className="day-timeline">
        {hours.map((hour) => {
          const hourItems = items.filter((item) => new Date(item.startAt).getHours() === hour);
          return (
            <div className="day-hour-row" key={hour}>
              <span>{String(hour).padStart(2, "0")}:00</span>
              <div>
                {hourItems.map((item) => <CalendarEvent key={item.id} item={item} onOpen={onOpen} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ days, items, hours, onOpen }: { days: Date[]; items: AgendaItem[]; hours: number[]; onOpen: (item: AgendaItem) => void }) {
  return (
    <div className={`week-calendar top-space ${days.length === 5 ? "workweek" : ""}`}>
      <div className="week-grid-head empty-cell">Hora</div>
      {days.map((day) => <div className="week-grid-head" key={day.toISOString()}><strong>{weekday(day)}</strong><span>{shortDate(day)}</span></div>)}
      {hours.map((hour) => (
        <div className="week-grid-row" key={hour}>
          <div className="week-time-cell">{String(hour).padStart(2, "0")}:00</div>
          {days.map((day) => {
            const hourItems = itemsForDay(items, day).filter((item) => new Date(item.startAt).getHours() === hour);
            return (
              <div className="week-slot-cell" key={`${day.toISOString()}-${hour}`}>
                {hourItems.map((item) => <CalendarEvent key={item.id} item={item} onOpen={onOpen} />)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ListView({ items, onOpen }: { items: AgendaItem[]; onOpen: (item: AgendaItem) => void }) {
  const ordered = [...items].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return (
    <div className="booking-list top-space">
      {ordered.map((item) => (
        <button className="booking-list-row" type="button" key={item.id} onClick={() => onOpen(item)}>
          <span>{shortWeekdayDate(new Date(item.startAt))}</span>
          <strong>{item.title}</strong>
          <em>{duration(item).toFixed(1)} h · {item.productType}</em>
          <b>Confirmado</b>
        </button>
      ))}
      {ordered.length === 0 && <div className="calendar-empty">No hay compromisos para el periodo seleccionado.</div>}
    </div>
  );
}

function MonthView({ cursorDate, days, items, onOpen }: { cursorDate: Date; days: Date[]; items: AgendaItem[]; onOpen: (item: AgendaItem) => void }) {
  return (
    <div className="month-calendar top-space">
      {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => <strong className="month-weekday" key={day}>{day}</strong>)}
      {days.map((day) => {
        const dayItems = itemsForDay(items, day);
        return (
          <section className={`month-day ${day.getMonth() === cursorDate.getMonth() ? "" : "outside-month"}`} key={day.toISOString()}>
            <div className="month-day-number">{day.getDate()}</div>
            <div className="month-events">
              {dayItems.slice(0, 3).map((item) => <CalendarEvent compact key={item.id} item={item} onOpen={onOpen} />)}
              {dayItems.length > 3 && <button className="calendar-more" type="button" onClick={() => onOpen(dayItems[3])}>+{dayItems.length - 3} más</button>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CalendarEvent({ item, compact = false, onOpen }: { item: AgendaItem; compact?: boolean; onOpen: (item: AgendaItem) => void }) {
  return (
    <button className={`calendar-event ${compact ? "compact" : ""} ${item.id.startsWith("auto-") ? "auto-reserved" : ""}`} type="button" title="Ver detalle de agenda" onClick={() => onOpen(item)}>
      <strong>{compact ? item.productId : item.title}</strong>
      {!compact && <span>{item.productId} | {item.productType}</span>}
      <small><Clock size={12} /> {timeRange(item)}</small>
      {item.id.startsWith("auto-") && <small>Jornada completa</small>}
      {!compact && <em><UserRound size={12} /> {item.technicianName}</em>}
    </button>
  );
}

function mergeManualAndActivityReservations(manualItems: AgendaItem[], activities: Activity[], requirements: Map<string, Requirement>, technicians: User[], workdayRange: WorkdayRange) {
  const manualActivityIds = new Set(manualItems.map((item) => item.activityId));
  const generated = activities
    .filter((activity) => !manualActivityIds.has(activity.id) && !isClosed(activity.status))
    .flatMap((activity) => buildActivityReservations(activity, requirements.get(activity.requirementId), technicians, workdayRange));
  return [...manualItems, ...generated];
}

type WorkdayRange = { startHour: number; startMinute: number; endHour: number; endMinute: number };

function buildActivityReservations(activity: Activity, requirement: Requirement | undefined, technicians: User[], workdayRange: WorkdayRange) {
  const start = parseRequirementDate(requirement?.startDate, requirement?.startTime);
  const end = parseRequirementDate(requirement?.endDate || activity.productDeliveryDate || requirement?.startDate, requirement?.endTime);
  if (!start || !end) return [];
  const responsible = resolveTechnician(activity.productResponsible, technicians);
  const days = daysBetween(start, end);
  return days.map((day) => {
    const startAt = withTime(day, workdayRange.startHour, workdayRange.startMinute);
    const endAt = withTime(day, workdayRange.endHour, workdayRange.endMinute);
    return {
      id: `auto-${activity.id}-${day.toISOString().slice(0, 10)}`,
      activityId: activity.id,
      requirementId: activity.requirementId,
      productId: activity.productId,
      productType: activity.productType,
      technicianName: responsible.name,
      technicianEmail: responsible.email,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      title: `${activity.productId} - ${activity.productType}`,
      notes: "Reserva automática por fechas del requerimiento."
    };
  });
}

function parseRequirementDate(date?: string | null, time?: string | null) {
  if (!date) return null;
  const value = new Date(`${date.slice(0, 10)}T${time || "08:00"}`);
  return Number.isNaN(value.getTime()) ? null : startOfDay(value);
}

function buildWorkdayRange(startValue: string, endValue: string): WorkdayRange {
  const start = parseTimeParts(startValue, "08:00");
  const end = parseTimeParts(endValue, "17:00");
  if (end.hour < start.hour || (end.hour === start.hour && end.minute <= start.minute)) return { startHour: 8, startMinute: 0, endHour: 17, endMinute: 0 };
  return { startHour: start.hour, startMinute: start.minute, endHour: end.hour, endMinute: end.minute };
}

function buildDayHours(startHour: number, endHour: number) {
  const safeStart = Math.max(0, Math.min(23, startHour));
  const safeEnd = Math.max(safeStart + 1, Math.min(24, endHour));
  return Array.from({ length: safeEnd - safeStart + 1 }, (_, index) => safeStart + index);
}

function parseTimeParts(value: string | undefined, fallback: string) {
  const match = normalizeTime(value, fallback).match(/^(\d{2}):(\d{2})$/);
  return { hour: Number(match?.[1] ?? fallback.slice(0, 2)), minute: Number(match?.[2] ?? fallback.slice(3, 5)) };
}

function normalizeTime(value: string | undefined, fallback: string) {
  return value && /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function resolveTechnician(value: string, technicians: User[]) {
  const key = value.toLowerCase();
  const technician = technicians.find((item) => item.email.toLowerCase() === key || item.name.toLowerCase() === key);
  return {
    name: technician?.name ?? value,
    email: technician?.email ?? value
  };
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

function filterActivities(activities: Activity[], session: ReturnType<typeof getSession>) {
  if (!session) return [];
  if (session.user.roles.includes("Administrador") || session.user.roles.includes("Coordinador")) return activities;
  const keys = [session.user.email, session.user.name].map((value) => value.toLowerCase());
  return activities.filter((item) => keys.includes(item.productResponsible.toLowerCase()));
}

function matchesAgenda(item: AgendaItem, term: string, activity?: Activity, requirement?: Requirement) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return [item.title, item.notes, item.productId, item.productType, item.technicianName, item.technicianEmail, activity?.status ?? "", requirement?.campus ?? ""].some((value) => value.toLowerCase().includes(query));
}

function isInPeriod(item: AgendaItem, days: Date[]) {
  return days.some((day) => isSameDay(new Date(item.startAt), day));
}

function itemsForDay(items: AgendaItem[], day: Date) {
  return items
    .filter((item) => isSameDay(new Date(item.startAt), day))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

function duration(item: AgendaItem) {
  return Math.max(0, (new Date(item.endAt).getTime() - new Date(item.startAt).getTime()) / 3600000);
}

function timeRange(item: AgendaItem) {
  return `${new Date(item.startAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })} - ${new Date(item.endAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-EC", { dateStyle: "medium", timeStyle: "short" });
}

function formatFullDate(value: Date) {
  return value.toLocaleDateString("es-EC", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function periodLabel(value: Date, mode: CalendarMode, includeWeekend = true) {
  if (mode === "day") return formatFullDate(value);
  if (mode === "week" || mode === "list") {
    const days = weekDays(value, includeWeekend);
    return `${shortDate(days[0])} - ${shortDate(days[days.length - 1])}`;
  }
  return value.toLocaleDateString("es-EC", { month: "long", year: "numeric" });
}

function calendarSummary(items: AgendaItem[], mode: CalendarMode) {
  const label = mode === "day" ? "del día" : mode === "week" || mode === "list" ? "de la semana" : "del mes";
  const hours = items.reduce((total, item) => total + duration(item), 0);
  return `${items.length} bloques ${label}, ${hours.toFixed(1)} horas planificadas.`;
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

function weekDays(value: Date, includeWeekend = true) {
  const day = startOfDay(value);
  const mondayOffset = (day.getDay() + 6) % 7;
  const monday = addDays(day, -mondayOffset);
  return Array.from({ length: includeWeekend ? 7 : 5 }, (_, index) => addDays(monday, index));
}

function monthGrid(value: Date) {
  const first = new Date(value.getFullYear(), value.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = addDays(first, -mondayOffset);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function shortDate(value: Date) {
  return value.toLocaleDateString("es-EC", { day: "2-digit", month: "short" });
}

function weekday(value: Date) {
  return value.toLocaleDateString("es-EC", { weekday: "short" });
}

function shortWeekdayDate(value: Date) {
  return value.toLocaleDateString("es-EC", { weekday: "short", day: "numeric" }) + ` · ${value.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}`;
}

function toDateInput(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function isClosed(status: string) {
  return ["Approved", "Completed"].includes(status);
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

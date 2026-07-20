"use client";

import { AppNav } from "../nav";
import { Activity, api, getSession, showToast } from "../lib";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Edit3, ExternalLink, ListFilter, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type User = { id: string; name: string; email: string; roles: string[]; isActive: boolean };
type CalendarMode = "day" | "week" | "month";
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

const dayHours = Array.from({ length: 14 }, (_, index) => index + 7);

export default function AgendaCalendarPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [mode, setMode] = useState<CalendarMode>("week");
  const [cursorDate, setCursorDate] = useState(startOfDay(new Date()));
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);

  async function load() {
    const session = getSession();
    const [activityData, userData, agendaData] = await Promise.all([
      api<Activity[]>("/api/activities"),
      api<User[]>("/api/identity/users/technicians").catch(() => []),
      api<AgendaItem[]>("/api/agenda").catch(() => [])
    ]);
    const visibleTechnicians = session?.user.roles.includes("Administrador") || session?.user.roles.includes("Coordinador")
      ? userData
      : userData.filter((user) => user.email.toLowerCase() === session?.user.email.toLowerCase());
    const fallback = session ? [{ id: session.user.id, name: session.user.name, email: session.user.email, roles: session.user.roles, isActive: true }] : [];
    const techs = visibleTechnicians.length ? visibleTechnicians : fallback;
    setTechnicians(techs);
    setSelectedTechnician((current) => current || techs[0]?.email || "");
    setActivities(filterActivities(activityData, session));
    setItems(agendaData);
  }

  useEffect(() => {
    load().catch((error) => {
      showToast(error instanceof Error ? error.message : "No se pudo cargar el calendario técnico.", "error");
      if (!getSession()) location.assign("/login");
    });
  }, []);

  const visibleItems = useMemo(() => items
    .filter((item) => !selectedTechnician || item.technicianEmail.toLowerCase() === selectedTechnician.toLowerCase())
    .filter((item) => matchesAgenda(item, search)), [items, selectedTechnician, search]);
  const selectedTechnicianName = technicians.find((item) => item.email === selectedTechnician)?.name ?? "Equipo técnico";
  const periodDays = mode === "month" ? monthGrid(cursorDate) : mode === "week" ? weekDays(cursorDate) : [startOfDay(cursorDate)];
  const periodItems = visibleItems.filter((item) => isInPeriod(item, periodDays));
  const assignedProducts = activities.filter((item) => !selectedTechnician || item.productResponsible.toLowerCase() === selectedTechnician.toLowerCase());
  const plannedHours = periodItems.reduce((total, item) => total + duration(item), 0);

  function movePeriod(direction: number) {
    setCursorDate((current) => {
      if (mode === "day") return addDays(current, direction);
      if (mode === "week") return addDays(current, direction * 7);
      return addMonths(current, direction);
    });
  }

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell calendar-shell">
        <section className="panel">
          <div className="card-head calendar-page-head">
            <div>
              <h2>Calendario técnico</h2>
              <p>Vista de planificación por día, semana y mes para revisar carga, disponibilidad y entregables.</p>
            </div>
            <div className="actions">
              <Link className="button secondary" href="/agenda" title="Ir al maestro detalle de agenda"><Edit3 size={16} /> Gestionar agenda</Link>
            </div>
          </div>

          <div className="calendar-controls top-space">
            <div className="segmented-control" aria-label="Modo de calendario">
              <button className={mode === "day" ? "active" : ""} type="button" onClick={() => setMode("day")}>Día</button>
              <button className={mode === "week" ? "active" : ""} type="button" onClick={() => setMode("week")}>Semana</button>
              <button className={mode === "month" ? "active" : ""} type="button" onClick={() => setMode("month")}>Mes</button>
            </div>
            <div className="period-navigation">
              <button className="icon-button" type="button" title="Periodo anterior" onClick={() => movePeriod(-1)}><ChevronLeft size={16} /></button>
              <strong>{periodLabel(cursorDate, mode)}</strong>
              <button className="icon-button" type="button" title="Periodo siguiente" onClick={() => movePeriod(1)}><ChevronRight size={16} /></button>
              <button className="button secondary compact" type="button" title="Volver a hoy" onClick={() => setCursorDate(startOfDay(new Date()))}>Hoy</button>
            </div>
          </div>

          <div className="agenda-summary top-space">
            <label className="field">
              <span>Técnico</span>
              <select value={selectedTechnician} onChange={(event) => setSelectedTechnician(event.target.value)}>
                {technicians.map((item) => <option key={item.id} value={item.email}>{item.name} - {item.email}</option>)}
              </select>
            </label>
            <div className="detail-item"><span>Productos asignados</span><strong>{assignedProducts.length}</strong></div>
            <div className="detail-item"><span>Bloques del periodo</span><strong>{periodItems.length}</strong></div>
            <div className="detail-item"><span>Horas planificadas</span><strong>{plannedHours.toFixed(1)}</strong></div>
          </div>

          <label className="field top-space">
            <span>Buscar en calendario</span>
            <div className="input-with-icon"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Producto, titulo, tecnico, notas..." /></div>
          </label>
        </section>

        <section className="panel calendar-panel top-space">
          <div className="card-head">
            <div>
              <h2>{selectedTechnicianName}</h2>
              <p>{calendarSummary(periodItems, mode)}</p>
            </div>
            <span className="badge"><ListFilter size={14} /> {mode === "day" ? "Vista día" : mode === "week" ? "Vista semana" : "Vista mes"}</span>
          </div>
          {mode === "day" && <DayView date={cursorDate} items={periodItems} onOpen={setSelectedItem} />}
          {mode === "week" && <WeekView days={periodDays} items={periodItems} onOpen={setSelectedItem} />}
          {mode === "month" && <MonthView cursorDate={cursorDate} days={periodDays} items={periodItems} onOpen={setSelectedItem} />}
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

function DayView({ date, items, onOpen }: { date: Date; items: AgendaItem[]; onOpen: (item: AgendaItem) => void }) {
  return (
    <div className="day-calendar top-space">
      <div className="day-calendar-head">
        <CalendarDays size={18} />
        <strong>{formatFullDate(date)}</strong>
      </div>
      <div className="day-timeline">
        {dayHours.map((hour) => {
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

function WeekView({ days, items, onOpen }: { days: Date[]; items: AgendaItem[]; onOpen: (item: AgendaItem) => void }) {
  return (
    <div className="week-calendar top-space">
      {days.map((day) => (
        <section className="week-day" key={day.toISOString()}>
          <div className="week-day-head">
            <strong>{weekday(day)}</strong>
            <span>{shortDate(day)}</span>
          </div>
          <div className="week-day-events">
            {itemsForDay(items, day).map((item) => <CalendarEvent key={item.id} item={item} onOpen={onOpen} />)}
            {itemsForDay(items, day).length === 0 && <span className="calendar-empty">Libre</span>}
          </div>
        </section>
      ))}
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
    <button className={`calendar-event ${compact ? "compact" : ""}`} type="button" title="Ver detalle de agenda" onClick={() => onOpen(item)}>
      <strong>{compact ? item.productId : item.title}</strong>
      {!compact && <span>{item.productId} | {item.productType}</span>}
      <small><Clock size={12} /> {timeRange(item)}</small>
      {!compact && <em><UserRound size={12} /> {item.technicianName}</em>}
    </button>
  );
}

function filterActivities(activities: Activity[], session: ReturnType<typeof getSession>) {
  if (!session) return [];
  if (session.user.roles.includes("Administrador") || session.user.roles.includes("Coordinador")) return activities;
  const keys = [session.user.email, session.user.name].map((value) => value.toLowerCase());
  return activities.filter((item) => keys.includes(item.productResponsible.toLowerCase()));
}

function matchesAgenda(item: AgendaItem, term: string) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return [item.title, item.notes, item.productId, item.productType, item.technicianName, item.technicianEmail].some((value) => value.toLowerCase().includes(query));
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

function periodLabel(value: Date, mode: CalendarMode) {
  if (mode === "day") return formatFullDate(value);
  if (mode === "week") {
    const days = weekDays(value);
    return `${shortDate(days[0])} - ${shortDate(days[6])}`;
  }
  return value.toLocaleDateString("es-EC", { month: "long", year: "numeric" });
}

function calendarSummary(items: AgendaItem[], mode: CalendarMode) {
  const label = mode === "day" ? "del día" : mode === "week" ? "de la semana" : "del mes";
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

function weekDays(value: Date) {
  const day = startOfDay(value);
  const mondayOffset = (day.getDay() + 6) % 7;
  const monday = addDays(day, -mondayOffset);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
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

"use client";
import { ListFilter } from "lucide-react";
import { CalendarEventDialog } from "../../features/agenda-calendar/components/CalendarEventDialog";
import { CalendarFilters } from "../../features/agenda-calendar/components/CalendarFilters";
import { CalendarToolbar } from "../../features/agenda-calendar/components/CalendarToolbar";
import { DayView, ListView, MonthView, WeekView } from "../../features/agenda-calendar/components/CalendarViews";
import { useAgendaCalendar } from "../../features/agenda-calendar/hooks/useAgendaCalendar";
import { calendarSummary, periodLabel } from "../../features/agenda-calendar/utils/calendar.utils";
import styles from "../../features/agenda-calendar/styles/Calendar.module.css";
import { AppNav } from "../nav";

export default function AgendaCalendarPage() {
  const calendar = useAgendaCalendar(); const includeWeekend = calendar.weekScope === "full";
  const view = calendar.mode === "day" ? <DayView date={calendar.cursorDate} items={calendar.items} hours={calendar.hours} onOpen={calendar.setSelectedItem} /> : calendar.mode === "week" ? <WeekView days={calendar.period} items={calendar.items} hours={calendar.hours} onOpen={calendar.setSelectedItem} /> : calendar.mode === "month" ? <MonthView cursorDate={calendar.cursorDate} days={calendar.period} items={calendar.items} onOpen={calendar.setSelectedItem} /> : <ListView items={calendar.items} onOpen={calendar.setSelectedItem} />;
  return <main className="app-shell"><AppNav /><section className={`content-shell calendar-shell ${styles.shell}`}>
    {calendar.selectedItem && <CalendarEventDialog item={calendar.selectedItem} activity={calendar.activityById.get(calendar.selectedItem.activityId)} requirement={calendar.requirementById.get(calendar.selectedItem.requirementId)} onClose={() => calendar.setSelectedItem(null)} />}
    <section className="calendar-hero"><div className="calendar-page-head"><div><span className="eyebrow">Operación de marketing</span><h2>Calendario técnico</h2><p>Planifica requerimientos, compromisos y capacidad disponible.</p></div></div></section>
    <section className={`panel calendar-command-panel ${styles.commandPanel}`}><CalendarToolbar mode={calendar.mode} cursorDate={calendar.cursorDate} refreshing={calendar.isRefreshing} onMode={calendar.setMode} onDate={calendar.setCursorDate} onMove={calendar.movePeriod} onToday={calendar.today} onRefresh={() => void calendar.refresh().catch(() => undefined)} /><CalendarFilters technicians={calendar.technicians} campuses={calendar.campuses} statuses={calendar.statuses} technician={calendar.selectedTechnician} campus={calendar.selectedCampus} status={calendar.selectedStatus} search={calendar.search} onTechnician={calendar.setSelectedTechnician} onCampus={calendar.setSelectedCampus} onStatus={calendar.setSelectedStatus} onSearch={calendar.setSearch} /></section>
    <section className={`panel calendar-panel ${styles.visualPanel}`}><div className="card-head calendar-visual-head"><div><h2>{calendar.mode === "list" ? "Próximos compromisos" : "Visual de agenda"}</h2><p>{periodLabel(calendar.cursorDate, calendar.mode, includeWeekend)} | {calendarSummary(calendar.items, calendar.mode)} | Jornada {calendar.workdayStartTime}-{calendar.workdayEndTime} | Replanificación {calendar.replanningWindowDays} días</p></div><div className="calendar-visual-actions"><label className="check-field"><input type="checkbox" checked={includeWeekend} disabled={calendar.mode === "day" || calendar.mode === "month"} onChange={(event) => calendar.setWeekScope(event.target.checked ? "full" : "workdays")} /> Mostrar fin de semana</label><span className="badge"><ListFilter size={14} /> Vista {calendar.mode}</span></div></div>{calendar.isLoading ? <div className={`calendar-empty ${styles.feedback}`} role="status">Cargando calendario…</div> : calendar.loadError && calendar.items.length === 0 ? <div className={`calendar-empty ${styles.feedback}`} role="alert">{calendar.loadError} <button className="button secondary compact-button" onClick={() => void calendar.refresh().catch(() => undefined)}>Reintentar</button></div> : <div className={styles.grid}>{view}</div>}</section>
  </section></main>;
}

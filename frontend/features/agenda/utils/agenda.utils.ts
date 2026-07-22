import type { AuthSession } from "../../../app/lib";
import type { Activity, AgendaItem, Requirement, Technician, WorkdayRange } from "../models/agenda.models";

export function filterAgendaActivities(activities: Activity[], session: AuthSession | null) {
  if (!session) return [];
  if (session.user.roles.some((role) => ["Administrador", "Coordinador"].includes(role))) return activities;
  const keys = [session.user.email, session.user.name].map((value) => value.toLowerCase());
  return activities.filter((item) => keys.includes(item.productResponsible.toLowerCase()));
}
export function filterAgendaTechnicians(technicians: Technician[], session: AuthSession | null) {
  if (!session) return [];
  if (session.user.roles.some((role) => ["Administrador", "Coordinador"].includes(role))) return technicians.filter((item) => item.isActive);
  return technicians.filter((item) => item.isActive && item.email.toLowerCase() === session.user.email.toLowerCase());
}
export function matchesAgenda(item: AgendaItem, term: string) { const query = term.trim().toLowerCase(); return !query || [item.title, item.notes, item.productId, item.productType, item.technicianName, item.technicianEmail].some((value) => value.toLowerCase().includes(query)); }
export function mergeAgendaReservations(manual: AgendaItem[], activities: Activity[], requirements: Map<string, Requirement>, technicians: Technician[], range: WorkdayRange) {
  const manualActivityIds = new Set(manual.map((item) => item.activityId));
  const generated = activities.filter((item) => !manualActivityIds.has(item.id) && !isClosed(item.status)).flatMap((item) => buildActivityReservations(item, requirements.get(item.requirementId), technicians, range));
  return [...manual, ...generated].sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime());
}
export function buildActivityReservations(activity: Activity, requirement: Requirement | undefined, technicians: Technician[], range: WorkdayRange): AgendaItem[] {
  const start = parseDate(requirement?.startDate); const end = parseDate(requirement?.endDate || activity.productDeliveryDate || requirement?.startDate);
  if (!start || !end || end < start) return [];
  const responsible = resolveTechnician(activity.productResponsible, technicians);
  return daysBetween(start, end).map((day) => ({ id: `auto-${activity.id}-${day.toISOString().slice(0, 10)}`, activityId: activity.id, requirementId: activity.requirementId, productId: activity.productId, productType: activity.productType, technicianName: responsible.name, technicianEmail: responsible.email, startAt: withTime(day, range.startHour, range.startMinute).toISOString(), endAt: withTime(day, range.endHour, range.endMinute).toISOString(), title: `${activity.productId} - ${activity.productType}`, notes: "Reserva automática por fechas del requerimiento." }));
}
export function buildWorkdayRange(startValue?: string, endValue?: string): WorkdayRange { const start = timeParts(startValue, "08:00"); const end = timeParts(endValue, "17:00"); return end.hour < start.hour || (end.hour === start.hour && end.minute <= start.minute) ? { startHour: 8, startMinute: 0, endHour: 17, endMinute: 0 } : { startHour: start.hour, startMinute: start.minute, endHour: end.hour, endMinute: end.minute }; }
export function durationHours(item: AgendaItem) { return Math.max(0, (new Date(item.endAt).getTime() - new Date(item.startAt).getTime()) / 3_600_000); }
export function formatAgendaDate(value: string) { return new Date(value).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" }); }
export function toDateTimeInput(value?: string) { if (!value) return ""; const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
function parseDate(value?: string | null) { if (!value) return null; const date = new Date(`${value.slice(0, 10)}T08:00`); if (Number.isNaN(date.getTime())) return null; date.setHours(0, 0, 0, 0); return date; }
function daysBetween(start: Date, end: Date) { const values: Date[] = []; for (let day = new Date(start); day <= end; day = addDays(day, 1)) values.push(new Date(day)); return values; }
function addDays(value: Date, amount: number) { const result = new Date(value); result.setDate(result.getDate() + amount); result.setHours(0, 0, 0, 0); return result; }
function withTime(value: Date, hour: number, minute: number) { const result = new Date(value); result.setHours(hour, minute, 0, 0); return result; }
function resolveTechnician(value: string, technicians: Technician[]) { const key = value.toLowerCase(); const match = technicians.find((item) => item.email.toLowerCase() === key || item.name.toLowerCase() === key); return { name: match?.name ?? value, email: match?.email ?? value }; }
function isClosed(status: string) { return ["Approved", "Completed"].includes(status); }
function timeParts(value: string | undefined, fallback: string) { const safe = value && /^\d{2}:\d{2}$/.test(value) ? value : fallback; return { hour: Number(safe.slice(0, 2)), minute: Number(safe.slice(3, 5)) }; }

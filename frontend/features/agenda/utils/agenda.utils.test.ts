import { describe, expect, it } from "vitest";
import { agendaSchema } from "../schemas/agenda.schema";
import { buildActivityReservations, buildWorkdayRange, durationHours, filterAgendaActivities, filterAgendaTechnicians, matchesAgenda, mergeAgendaReservations, toDateTimeInput } from "./agenda.utils";

describe("agenda rules", () => {
  it("normaliza jornadas válidas e inválidas", () => {
    expect(buildWorkdayRange("09:30", "18:15")).toEqual({ startHour: 9, startMinute: 30, endHour: 18, endMinute: 15 });
    expect(buildWorkdayRange("18:00", "08:00")).toEqual({ startHour: 8, startMinute: 0, endHour: 17, endMinute: 0 });
    expect(buildWorkdayRange("bad", undefined)).toEqual({ startHour: 8, startMinute: 0, endHour: 17, endMinute: 0 });
  });

  it("genera reservas por cada día del requerimiento", () => {
    const result = buildActivityReservations(activity(), requirement(), [technician()], buildWorkdayRange("08:00", "17:00"));
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ technicianEmail: "tech@example.com", title: "PROD-1 - Video" });
    expect(durationHours(result[0])).toBe(9);
  });

  it("combina manuales, omite duplicados/cerrados y ordena", () => {
    const manual = agendaItem();
    const activities = [activity(), activity({ id: "p2", productId: "PROD-2", status: "Approved" }), activity({ id: "p3", productId: "PROD-3" })];
    const result = mergeAgendaReservations([manual], activities, new Map([["r1", requirement()]]), [technician()], buildWorkdayRange("08:00", "17:00"));
    expect(result.some((item) => item.id.startsWith("auto-p1"))).toBe(false);
    expect(result.some((item) => item.id.startsWith("auto-p2"))).toBe(false);
    expect(result.some((item) => item.id.startsWith("auto-p3"))).toBe(true);
  });

  it("filtra permisos, técnicos y búsqueda", () => {
    const session = (roles: string[]) => ({ accessToken: "t", expiresAt: "x", user: { id: "u", name: "Tech", email: "tech@example.com", roles, screenPermissions: [] } });
    expect(filterAgendaActivities([activity(), activity({ id: "x", productResponsible: "other@x" })], session(["Tecnico"]))).toHaveLength(1);
    expect(filterAgendaActivities([activity()], session(["Coordinador"]))).toHaveLength(1);
    expect(filterAgendaTechnicians([technician(), technician({ id: "x", email: "x@x", isActive: false })], session(["Tecnico"]))).toHaveLength(1);
    expect(matchesAgenda(agendaItem(), "campaña")).toBe(true);
    expect(matchesAgenda(agendaItem(), "otro")).toBe(false);
    expect(filterAgendaActivities([activity()], null)).toEqual([]);
    expect(filterAgendaTechnicians([technician()], null)).toEqual([]);
  });

  it("tolera datos incompletos y responsables sin catálogo", () => {
    expect(buildActivityReservations(activity(), undefined, [], buildWorkdayRange())).toEqual([]);
    const result = buildActivityReservations(activity({ productResponsible: "externo@x" }), requirement(), [], buildWorkdayRange());
    expect(result[0].technicianEmail).toBe("externo@x");
    expect(durationHours({ ...agendaItem(), startAt: "2026-01-01T10:00:00Z", endAt: "2026-01-01T08:00:00Z" })).toBe(0);
  });

  it("valida cruces de fechas y convierte inputs", () => {
    expect(agendaSchema.safeParse({ technicianEmail: "tech@example.com", activityId: "p1", startAt: "2026-01-02T10:00", endAt: "2026-01-02T09:00", title: "", notes: "" }).success).toBe(false);
    expect(toDateTimeInput()).toBe("");
    expect(toDateTimeInput("inválido")).toBe("");
    expect(toDateTimeInput("2026-01-02T10:00:00Z")).toMatch(/^2026-01-02T/);
  });
});

function activity(overrides: Record<string, unknown> = {}) { return { id: "p1", requirementId: "r1", productId: "PROD-1", requirementTypeId: "r", requirementType: "R", strategicObjective: "O", targetAudienceId: "t", targetAudience: "T", productTypeId: "p", productType: "Video", diffusionChannelId: "d", diffusionChannel: "Web", mainKpiId: "k", mainKpi: "K", productResponsible: "tech@example.com", observations: "", status: "InProgress", statusId: "s", ...overrides } as never; }
function requirement() { return { id: "r1", code: "R", activityOrEvent: "E", requestedBy: "u", facultyId: "f", faculty: "F", career: "C", campusId: "c", campus: "C", place: "P", startDate: "2026-01-01", endDate: "2026-01-02", eventObjective: "O", eventFormatId: "e", eventFormat: "E", requestDate: "2025-01-01", status: "InProgress", statusId: "s" }; }
function technician(overrides: Record<string, unknown> = {}) { return { id: "t1", name: "Tech", email: "tech@example.com", roles: ["Tecnico"], isActive: true, ...overrides } as never; }
function agendaItem() { return { id: "a1", activityId: "p1", requirementId: "r1", productId: "PROD-1", productType: "Video", technicianName: "Tech", technicianEmail: "tech@example.com", startAt: "2026-01-01T08:00:00Z", endAt: "2026-01-01T10:00:00Z", title: "Campaña", notes: "Diseño campaña" }; }

import { describe, expect, it } from "vitest";
import { isPublicFeatureActive, mapPublicRequirementPayload } from "./public-requirement.utils";

describe("public requirement utils", () => {
  it("evalúa límites inclusivos y configuración inválida", () => {
    const availability = { enabled: true, activeFrom: "2026-01-01T00:00:00Z", activeUntil: "2026-01-31T23:59:59Z" };
    expect(isPublicFeatureActive(availability, Date.parse(availability.activeFrom))).toBe(true);
    expect(isPublicFeatureActive(availability, Date.parse(availability.activeUntil))).toBe(true);
    expect(isPublicFeatureActive(availability, Date.parse("2026-02-01T00:00:00Z"))).toBe(false);
    expect(isPublicFeatureActive({ enabled: false })).toBe(false);
    expect(isPublicFeatureActive({ enabled: true, activeFrom: "fecha-inválida" })).toBe(false);
  });

  it("construye el contrato existente con nombres de catálogo", () => {
    const catalogs = { faculties: [{ id: "f1", name: "Ingeniería", isActive: true }], careers: [{ id: "c1", name: "Sistemas", isActive: true, facultyId: "f1" }], campuses: [{ id: "s1", name: "Quito", isActive: true }], eventFormats: [{ id: "e1", name: "Presencial", isActive: true }] };
    const values = { activityOrEvent: " Evento ", requestedBy: " ana@example.com ", facultyId: "f1", careerId: "c1", campusId: "s1", place: " Auditorio ", startDate: "2026-01-10", startTime: "", endDate: "2026-01-10", endTime: "", eventObjective: " Objetivo ", eventFormatId: "e1" };
    expect(mapPublicRequirementPayload(values, catalogs, "2026-01-01")).toEqual(expect.objectContaining({ activityOrEvent: "Evento", faculty: "Ingeniería", career: "Sistemas", campus: "Quito", eventFormat: "Presencial", startTime: null, requestDate: "2026-01-01" }));
  });
});

import { describe, expect, it, vi } from "vitest";
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
    vi.spyOn(crypto, "randomUUID").mockReturnValue("idem-1");
    const catalogs = { faculties: [{ id: "f1", name: "Ingeniería", isActive: true }], careers: [{ id: "c1", name: "Sistemas", isActive: true, facultyId: "f1" }], campuses: [{ id: "s1", name: "Quito", isActive: true }], eventFormats: [{ id: "e1", name: "Presencial", isActive: true }] };
    const values = { activityOrEvent: " Evento ", requesterName: " Ana ", requesterEmail: " ana@example.com ", facultyId: "f1", faculty: "", careerId: "c1", career: "", campusId: "s1", campus: "", place: " Auditorio ", startAt: "2026-01-10T09:00", endAt: "2026-01-10T10:00", audienceType: "mixed" as const, eventObjective: " Objetivo ", eventFormatId: "e1", eventFormat: "", activityFormatDescription: " Dinámica ", attachments: [] };
    expect(mapPublicRequirementPayload(values, catalogs, "2026-01-01")).toEqual(expect.objectContaining({ activityOrEvent: "Evento", requestedBy: "ana@example.com", requesterName: "Ana", requesterEmail: "ana@example.com", faculty: "Ingeniería", career: "Sistemas", campus: "Quito", eventFormat: "Presencial", startTime: "09:00", requestDate: "2026-01-01", idempotencyKey: "idem-1" }));
  });
});

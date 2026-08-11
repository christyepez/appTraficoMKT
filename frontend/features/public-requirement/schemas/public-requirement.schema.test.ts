import { describe, expect, it } from "vitest";
import { publicRequirementSchema } from "./public-requirement.schema";

const valid = {
  activityOrEvent: "Evento",
  requesterName: "Ana",
  requesterEmail: "ana@example.com",
  facultyId: "f1",
  faculty: "",
  careerId: "c1",
  career: "",
  campusId: "s1",
  campus: "",
  place: "Auditorio",
  startAt: "2026-01-10T09:00",
  endAt: "2026-01-10T10:00",
  audienceType: "internal",
  eventObjective: "Objetivo",
  eventFormatId: "e1",
  eventFormat: "",
  activityFormatDescription: "Exposición",
  attachments: []
};

describe("public requirement schema", () => {
  it("acepta un requerimiento válido", () => expect(publicRequirementSchema.safeParse(valid).success).toBe(true));
  it("rechaza correo, fechas y horas inválidas", () => {
    expect(publicRequirementSchema.safeParse({ ...valid, requesterEmail: "correo" }).success).toBe(false);
    expect(publicRequirementSchema.safeParse({ ...valid, endAt: "2026-01-09T10:00" }).success).toBe(false);
    expect(publicRequirementSchema.safeParse({ ...valid, endAt: "2026-01-10T08:00" }).success).toBe(false);
  });
});

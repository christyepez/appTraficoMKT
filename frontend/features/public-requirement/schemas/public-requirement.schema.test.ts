import { describe, expect, it } from "vitest";
import { publicRequirementSchema } from "./public-requirement.schema";

const valid = { activityOrEvent: "Evento", requestedBy: "ana@example.com", facultyId: "f1", careerId: "c1", campusId: "s1", place: "Auditorio", startDate: "2026-01-10", startTime: "09:00", endDate: "2026-01-10", endTime: "10:00", eventObjective: "Objetivo", eventFormatId: "e1" };

describe("public requirement schema", () => {
  it("acepta un requerimiento válido", () => expect(publicRequirementSchema.safeParse(valid).success).toBe(true));
  it("rechaza correo, fechas y horas inválidas", () => {
    expect(publicRequirementSchema.safeParse({ ...valid, requestedBy: "correo" }).success).toBe(false);
    expect(publicRequirementSchema.safeParse({ ...valid, endDate: "2026-01-09" }).success).toBe(false);
    expect(publicRequirementSchema.safeParse({ ...valid, endTime: "08:00" }).success).toBe(false);
  });
});

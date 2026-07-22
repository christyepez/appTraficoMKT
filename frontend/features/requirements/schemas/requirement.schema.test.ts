import { describe, expect, it } from "vitest";
import type { RequirementCatalogs } from "../models/requirement.models";
import { mapRequirementFormToPayload, requirementDefaults, requirementFormSchema } from "./requirement.schema";

const valid = { activityOrEvent: " Feria ", requestedBy: "owner@example.com", facultyId: "f", careerId: "cr", campusId: "c", place: " Auditorio ", startDate: "2026-08-01", startTime: "08:00", endDate: "2026-08-02", endTime: "09:00", eventObjective: " Objetivo ", eventFormatId: "e", requestDate: "2026-07-01" };
const item = (id: string, name: string) => ({ id, code: id, name, isActive: true });
const catalogs: RequirementCatalogs = { faculties: [item("f", "Facultad")], careers: [{ ...item("cr", "Carrera"), facultyId: "f" }], campuses: [item("c", "Centro")], eventFormats: [item("e", "Presencial")] };

describe("requirement schema", () => {
  it("acepta y mapea el contrato vigente", () => {
    const values = requirementFormSchema.parse(valid);
    expect(mapRequirementFormToPayload(values, catalogs)).toEqual(expect.objectContaining({ activityOrEvent: "Feria", faculty: "Facultad", career: "Carrera", campus: "Centro", eventFormat: "Presencial" }));
  });
  it("convierte horas vacías a null", () => { const payload = mapRequirementFormToPayload(requirementFormSchema.parse({ ...valid, startTime: "", endTime: "" }), catalogs); expect(payload.startTime).toBeNull(); expect(payload.endTime).toBeNull(); });
  it("rechaza fechas y horas invertidas", () => {
    expect(requirementFormSchema.safeParse({ ...valid, endDate: "2026-07-31" }).success).toBe(false);
    const result = requirementFormSchema.safeParse({ ...valid, endDate: valid.startDate, endTime: "07:00" });
    expect(result.success).toBe(false);
  });
  it("valida correo y campos requeridos", () => { expect(requirementFormSchema.safeParse({ ...valid, requestedBy: "no-email", facultyId: "" }).success).toBe(false); });
  it("construye valores iniciales de alta y edición", () => {
    expect(requirementDefaults(null).activityOrEvent).toBe("");
    expect(requirementDefaults({ ...valid, id: "r", code: "REQ", faculty: "Facultad", career: "Carrera", campus: "Centro", eventFormat: "Presencial", status: "Draft", statusId: "s", startTime: null, endTime: null } as never)).toEqual(expect.objectContaining({ activityOrEvent: " Feria ", facultyId: "f", startTime: "", endTime: "" }));
  });
  it("usa nombres seguros si un catálogo quedó inactivo", () => {
    const payload = mapRequirementFormToPayload(requirementFormSchema.parse(valid), { faculties: [], careers: [], campuses: [], eventFormats: [] });
    expect(payload).toEqual(expect.objectContaining({ faculty: "", career: "", campus: "", eventFormat: "" }));
  });
});

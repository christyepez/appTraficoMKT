import { describe, expect, it } from "vitest";
import { buildRequirementFormSchema, requirementFormSchema } from "./requirement-form.schema";
import { mapRequirementFormToLegacyPayload, requirementFormDefaults } from "./requirement-form.mappers";
import { validateRequirementFile, validateRequirementFiles, wordCount } from "./requirement-form.utils";
import type { RequirementFormCatalogs, RequirementFormValues } from "./requirement-form.types";

const catalogs: RequirementFormCatalogs = {
  faculties: [{ id: "fac1", name: "Facultad de Ingeniería" }],
  careers: [{ id: "car1", name: "Software", facultyId: "fac1" }],
  campuses: [{ id: "sed1", name: "Quito" }],
  eventFormats: [{ id: "fmt1", name: "Presencial" }]
};

describe("requirement form domain", () => {
  it("valida el modelo canónico mínimo", () => {
    expect(buildRequirementFormSchema(catalogs).safeParse(validValues()).success).toBe(true);
  });

  it("rechaza correo inválido, fechas invertidas y más de 70 palabras", () => {
    const values = validValues({
      requesterEmail: "correo",
      endAt: "2026-01-10T08:00",
      eventObjective: Array.from({ length: 71 }, (_, index) => `palabra${index}`).join(" ")
    });
    const result = requirementFormSchema.safeParse(values);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(expect.arrayContaining(["requesterEmail", "endAt", "eventObjective"]));
  });

  it("valida que la carrera pertenezca a la facultad", () => {
    const result = buildRequirementFormSchema(catalogs).safeParse(validValues({ careerId: "otra" }));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["careerId"]);
  });

  it("mapea hacia el payload legacy conservando requestedBy como correo", () => {
    const payload = mapRequirementFormToLegacyPayload(validValues(), catalogs, "2026-01-01");
    expect(payload).toMatchObject({
      requestedBy: "ana@uti.edu.ec",
      requesterName: "Ana Solicitante",
      requesterEmail: "ana@uti.edu.ec",
      faculty: "Facultad de Ingeniería",
      career: "Software",
      campus: "Quito",
      startDate: "2026-01-10",
      startTime: "09:30",
      activityFormatDescription: "Charla presencial con registro de asistentes."
    });
  });

  it("crea defaults desde datos históricos con requestedBy", () => {
    expect(requirementFormDefaults({ requestedBy: "historico@uti.edu.ec", startDate: "2026-01-10", endDate: "2026-01-11" })).toMatchObject({
      requesterName: "historico@uti.edu.ec",
      requesterEmail: "historico@uti.edu.ec",
      startAt: "2026-01-10T00:00",
      endAt: "2026-01-11T00:00"
    });
  });

  it("valida archivos permitidos y rechaza SVG, ejecutables, path traversal y más de 5 archivos", () => {
    expect(validateRequirementFile(new File(["a"], "brief.pdf", { type: "application/pdf" })).valid).toBe(true);
    expect(validateRequirementFile(new File(["a"], "foto.jpg", { type: "image/jpeg" })).valid).toBe(true);
    expect(validateRequirementFile(new File(["a"], "arte.png", { type: "image/png" })).valid).toBe(true);
    expect(validateRequirementFile(new File(["a"], "mock.webp", { type: "image/webp" })).valid).toBe(true);
    expect(validateRequirementFile(new File(["a"], "vector.svg", { type: "image/svg+xml" })).valid).toBe(false);
    expect(validateRequirementFile(new File(["a"], "setup.exe", { type: "application/x-msdownload" })).valid).toBe(false);
    expect(validateRequirementFile(new File(["a"], "../foto.png", { type: "image/png" })).valid).toBe(true);
    expect(validateRequirementFiles(Array.from({ length: 6 }, (_, index) => new File(["a"], `${index}.pdf`, { type: "application/pdf" }))).valid).toBe(false);
  });

  it("calcula palabras de forma estable", () => {
    expect(wordCount("  uno   dos tres  ")).toBe(3);
  });
});

function validValues(overrides: Partial<RequirementFormValues> = {}): RequirementFormValues {
  return {
    activityOrEvent: "Feria de innovación",
    requesterName: "Ana Solicitante",
    requesterEmail: "ana@uti.edu.ec",
    facultyId: "fac1",
    faculty: "",
    careerId: "car1",
    career: "",
    campusId: "sed1",
    campus: "",
    place: "Auditorio",
    startAt: "2026-01-10T09:30",
    endAt: "2026-01-10T11:00",
    audienceType: "internal",
    eventFormatId: "fmt1",
    eventFormat: "",
    eventObjective: "Presentar el portafolio académico.",
    activityFormatDescription: "Charla presencial con registro de asistentes.",
    attachments: [],
    ...overrides
  };
}

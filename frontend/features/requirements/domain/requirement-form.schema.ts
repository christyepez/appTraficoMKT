import { z } from "zod";
import { audienceTypes, REQUIREMENT_WORD_LIMIT } from "./requirement-form.constants";
import type { RequirementFormCatalogs } from "./requirement-form.types";
import { careerBelongsToFaculty, isWithinWordLimit, validateRequirementFiles } from "./requirement-form.utils";

const required = (message: string) => z.string().trim().min(1, message);
const dateTime = (message: string) => required(message).regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, message);

export const requirementFormSchema = z.object({
  activityOrEvent: required("Ingrese la actividad o evento."),
  requesterName: required("Ingrese el nombre del solicitante."),
  requesterEmail: z.string().trim().email("Ingrese un correo válido."),
  facultyId: required("Seleccione una facultad."),
  faculty: z.string(),
  careerId: z.string().optional(),
  career: z.string(),
  campusId: required("Seleccione una sede."),
  campus: z.string(),
  place: required("Ingrese el lugar."),
  startAt: dateTime("Ingrese fecha y hora de inicio."),
  endAt: dateTime("Ingrese fecha y hora de fin."),
  audienceType: z.enum(audienceTypes, { message: "Seleccione el público del requerimiento." }),
  eventFormatId: z.string().optional(),
  eventFormat: z.string().optional(),
  eventObjective: required("Ingrese el objetivo del evento."),
  activityFormatDescription: required("Ingrese el formato o dinámica de la actividad."),
  attachments: z.custom<File[]>((value) => Array.isArray(value), "Adjuntos inválidos.")
}).superRefine((value, context) => {
  if (value.endAt <= value.startAt) {
    context.addIssue({ code: "custom", path: ["endAt"], message: "La fecha y hora de fin debe ser posterior al inicio." });
  }
  if (!isWithinWordLimit(value.eventObjective)) {
    context.addIssue({ code: "custom", path: ["eventObjective"], message: `Use máximo ${REQUIREMENT_WORD_LIMIT} palabras.` });
  }
  if (!isWithinWordLimit(value.activityFormatDescription)) {
    context.addIssue({ code: "custom", path: ["activityFormatDescription"], message: `Use máximo ${REQUIREMENT_WORD_LIMIT} palabras.` });
  }
  const attachmentValidation = validateRequirementFiles(value.attachments);
  if (!attachmentValidation.valid) {
    context.addIssue({ code: "custom", path: ["attachments"], message: attachmentValidation.message ?? "Adjuntos inválidos." });
  }
});

export function buildRequirementFormSchema(catalogs: RequirementFormCatalogs) {
  return requirementFormSchema.superRefine((value, context) => {
    if (!catalogs.faculties.some((item) => item.id === value.facultyId)) {
      context.addIssue({ code: "custom", path: ["facultyId"], message: "Seleccione una facultad válida." });
    }
    if (!careerBelongsToFaculty(catalogs, value.facultyId, value.careerId)) {
      context.addIssue({ code: "custom", path: ["careerId"], message: "Seleccione una carrera de la facultad indicada." });
    }
    if (!catalogs.campuses.some((item) => item.id === value.campusId)) {
      context.addIssue({ code: "custom", path: ["campusId"], message: "Seleccione una sede válida." });
    }
    if (value.eventFormatId && !catalogs.eventFormats.some((item) => item.id === value.eventFormatId)) {
      context.addIssue({ code: "custom", path: ["eventFormatId"], message: "Seleccione un formato válido." });
    }
  });
}

export type RequirementFormSchemaValues = z.infer<typeof requirementFormSchema>;

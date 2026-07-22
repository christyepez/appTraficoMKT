import { z } from "zod";
import type { Requirement, RequirementCatalogs, SaveRequirementPayload } from "../models/requirement.models";

const required = (message: string) => z.string().trim().min(1, message);
const date = (message: string) => required(message).regex(/^\d{4}-\d{2}-\d{2}$/, message);

export const requirementFormSchema = z.object({
  activityOrEvent: required("Ingrese la actividad o evento."),
  requestedBy: z.string().trim().email("Ingrese un correo válido."),
  facultyId: required("Seleccione una facultad."),
  careerId: required("Seleccione una carrera."),
  campusId: required("Seleccione una sede."),
  place: required("Ingrese el lugar."),
  startDate: date("Ingrese la fecha de inicio."),
  startTime: z.string(),
  endDate: date("Ingrese la fecha de fin."),
  endTime: z.string(),
  eventObjective: required("Ingrese el objetivo del evento."),
  eventFormatId: required("Seleccione un formato."),
  requestDate: date("Ingrese la fecha de solicitud.")
}).superRefine((value, context) => {
  if (value.endDate < value.startDate) context.addIssue({ code: "custom", path: ["endDate"], message: "La fecha de fin no puede ser anterior al inicio." });
  if (value.endDate === value.startDate && value.startTime && value.endTime && value.endTime <= value.startTime) {
    context.addIssue({ code: "custom", path: ["endTime"], message: "La hora de fin debe ser posterior al inicio." });
  }
});

export type RequirementFormValues = z.infer<typeof requirementFormSchema>;

export function requirementDefaults(requirement: Requirement | null): RequirementFormValues {
  return {
    activityOrEvent: requirement?.activityOrEvent ?? "",
    requestedBy: requirement?.requestedBy ?? "",
    facultyId: requirement?.facultyId ?? "",
    careerId: "",
    campusId: requirement?.campusId ?? "",
    place: requirement?.place ?? "",
    startDate: requirement?.startDate ?? "",
    startTime: requirement?.startTime ?? "",
    endDate: requirement?.endDate ?? "",
    endTime: requirement?.endTime ?? "",
    eventObjective: requirement?.eventObjective ?? "",
    eventFormatId: requirement?.eventFormatId ?? "",
    requestDate: requirement?.requestDate ?? ""
  };
}

export function mapRequirementFormToPayload(values: RequirementFormValues, catalogs: RequirementCatalogs): SaveRequirementPayload {
  return {
    activityOrEvent: values.activityOrEvent.trim(),
    requestedBy: values.requestedBy.trim(),
    facultyId: values.facultyId,
    faculty: catalogs.faculties.find((item) => item.id === values.facultyId)?.name ?? "",
    career: catalogs.careers.find((item) => item.id === values.careerId)?.name ?? "",
    campusId: values.campusId,
    campus: catalogs.campuses.find((item) => item.id === values.campusId)?.name ?? "",
    place: values.place.trim(),
    startDate: values.startDate,
    startTime: values.startTime || null,
    endDate: values.endDate,
    endTime: values.endTime || null,
    eventObjective: values.eventObjective.trim(),
    eventFormatId: values.eventFormatId,
    eventFormat: catalogs.eventFormats.find((item) => item.id === values.eventFormatId)?.name ?? "",
    requestDate: values.requestDate
  };
}

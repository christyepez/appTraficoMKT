import { z } from "zod";

const required = (message: string) => z.string().trim().min(1, message);
const date = (message: string) => required(message).regex(/^\d{4}-\d{2}-\d{2}$/, message);

export const publicRequirementSchema = z.object({
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
  eventFormatId: required("Seleccione un formato.")
}).superRefine((value, context) => {
  if (value.endDate < value.startDate) context.addIssue({ code: "custom", path: ["endDate"], message: "La fecha de fin no puede ser anterior al inicio." });
  if (value.endDate === value.startDate && value.startTime && value.endTime && value.endTime <= value.startTime) {
    context.addIssue({ code: "custom", path: ["endTime"], message: "La hora de fin debe ser posterior al inicio." });
  }
});

export type PublicRequirementValues = z.infer<typeof publicRequirementSchema>;

export const publicRequirementDefaults: PublicRequirementValues = {
  activityOrEvent: "",
  requestedBy: "",
  facultyId: "",
  careerId: "",
  campusId: "",
  place: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  eventObjective: "",
  eventFormatId: ""
};

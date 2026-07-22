import { z } from "zod";

export const agendaSchema = z.object({
  technicianEmail: z.string().email("Seleccione un técnico válido."),
  activityId: z.string().min(1, "Seleccione un producto."),
  startAt: z.string().min(1, "Indique la fecha de inicio."),
  endAt: z.string().min(1, "Indique la fecha de fin."),
  title: z.string().max(240, "Use máximo 240 caracteres."),
  notes: z.string().max(2000, "Use máximo 2000 caracteres.")
}).superRefine((value, context) => {
  if (value.startAt && value.endAt && new Date(value.endAt).getTime() <= new Date(value.startAt).getTime()) context.addIssue({ code: "custom", path: ["endAt"], message: "La fecha de fin debe ser posterior al inicio." });
});

export type AgendaFormValues = z.infer<typeof agendaSchema>;

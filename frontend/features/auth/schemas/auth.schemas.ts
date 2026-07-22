import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ingrese un correo válido."),
  password: z.string().min(1, "Ingrese la clave.")
});

export const forgotPasswordSchema = z.object({
  email: z.email("Ingrese un correo válido.")
});

export const changePasswordSchema = z.object({
  email: z.email("Ingrese un correo válido."),
  currentPassword: z.string().min(1, "Ingrese la clave actual o temporal."),
  newPassword: z.string().min(8, "La nueva clave debe tener al menos 8 caracteres."),
  confirmPassword: z.string().min(1, "Confirme la nueva clave.")
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: "Las claves no coinciden.",
  path: ["confirmPassword"]
});

export const chatRequirementSchema = z.object({
  activityOrEvent: z.string().trim().min(1, "Ingrese la actividad o evento."),
  requestedBy: z.email("Ingrese un correo válido."),
  place: z.string().trim(),
  startDate: z.string(),
  startTime: z.string(),
  endDate: z.string(),
  endTime: z.string(),
  eventObjective: z.string().trim().min(1, "Ingrese el objetivo del evento.")
}).superRefine((value, context) => {
  if (value.startDate && value.endDate && value.endDate < value.startDate) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "La fecha de fin no puede ser anterior al inicio." });
  }
  if (value.startDate && value.startDate === value.endDate && value.startTime && value.endTime && value.endTime <= value.startTime) {
    context.addIssue({ code: "custom", path: ["endTime"], message: "La hora de fin debe ser posterior al inicio." });
  }
});

export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type ChatRequirementValues = z.infer<typeof chatRequirementSchema>;

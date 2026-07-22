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

export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

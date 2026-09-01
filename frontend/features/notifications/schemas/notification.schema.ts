import { z } from "zod";

const webhookSchema = z.string().max(1200, "El webhook supera 1200 caracteres.").superRefine((value, context) => {
  const candidate = value.trim();
  if (!candidate || candidate === "Configurado") return;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") {
      context.addIssue({ code: "custom", message: "El webhook debe usar HTTPS." });
    }
  } catch {
    context.addIssue({ code: "custom", message: "Ingrese una URL HTTPS válida." });
  }
});

export const notificationSettingsSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Ingrese el nombre.").max(120),
  emailEnabled: z.boolean(),
  emailTo: z.string(),
  teamsEnabled: z.boolean(),
  teamsChannel: z.string().max(300),
  powerAutomateWebhookUrl: webhookSchema,
  emailPowerAutomateWebhookUrl: webhookSchema,
  teamsPowerAutomateWebhookUrl: webhookSchema,
  htmlTemplate: z.string().max(8000, "La plantilla supera 8000 caracteres."),
  emailHtmlTemplate: z.string().max(8000, "La plantilla de correo supera 8000 caracteres."),
  teamsHtmlTemplate: z.string().max(8000, "La plantilla de Teams supera 8000 caracteres."),
  isActive: z.boolean()
}).superRefine((value, context) => {
  if (value.emailEnabled && !value.emailTo.trim()) {
    context.addIssue({ code: "custom", path: ["emailTo"], message: "Ingrese al menos un correo destino." });
  }
  if (value.emailEnabled && value.emailTo.split(/[,;]/).some((email) => !z.string().email().safeParse(email.trim()).success)) {
    context.addIssue({ code: "custom", path: ["emailTo"], message: "Revise los correos destino." });
  }
  if (value.teamsEnabled && !value.teamsChannel.trim()) {
    context.addIssue({ code: "custom", path: ["teamsChannel"], message: "Ingrese el canal de Teams." });
  }
});

export type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

import { z } from "zod";

const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Use un color hexadecimal válido.");
const optionalDate = z.string().nullable().optional();
const image = z.string().min(1, "Configure una imagen.").refine((value) => value.startsWith("data:image/") || /^https?:\/\//i.test(value), "Use una URL o imagen válida.");
const direction = z.enum(["to right", "to bottom", "135deg"]);

export const brandSettingsSchema = z.object({
  primary: color, primaryDark: color, accent: color, background: color, surface: color, foreground: color, muted: color, line: color,
  buttonText: color, secondary: color, secondaryText: color, success: color, warning: color, danger: color, topbarText: color,
  useGradient: z.boolean(), gradientColor: color, gradientDirection: direction,
  headerColor: color, headerUseGradient: z.boolean(), headerGradientColor: color, headerGradientDirection: direction,
  menuColor: color, menuUseGradient: z.boolean(), menuGradientColor: color, menuGradientDirection: direction,
  fontFamily: z.string().min(1), menuMode: z.enum(["horizontal", "vertical"]), menuCollapsed: z.boolean(), mobileMenuCollapsed: z.boolean(), menuOrder: z.string().min(1),
  headerTextAlign: z.enum(["left", "center", "right"]), headerTextPosition: z.enum(["top", "middle", "bottom"]),
  showHeaderTitle: z.boolean(), showHeaderSubtitle: z.boolean(), headerTitleSize: z.number().min(14).max(32), headerSubtitleSize: z.number().min(10).max(24),
  headerTitleWeight: z.enum(["400", "600", "700"]), headerSubtitleWeight: z.enum(["400", "600", "700"]),
  headerTitleItalic: z.boolean(), headerSubtitleItalic: z.boolean(), headerTitleUnderline: z.boolean(), headerSubtitleUnderline: z.boolean(),
  headerTitleColor: color, headerSubtitleColor: color, brandVersion: z.number(), logo: image, chatbotIcon: image,
  showPublicRequirementForm: z.boolean(), showPublicRequirementFullPage: z.boolean(), showLoginChatbot: z.boolean(),
  publicRequirementFormActiveFrom: optionalDate, publicRequirementFormActiveUntil: optionalDate,
  publicRequirementFullPageActiveFrom: optionalDate, publicRequirementFullPageActiveUntil: optionalDate,
  loginChatbotActiveFrom: optionalDate, loginChatbotActiveUntil: optionalDate,
  showDemoCredentials: z.boolean(), showOffice365Login: z.boolean(), showProductIdField: z.boolean(),
  workdayStartTime: z.string().regex(/^\d{2}:\d{2}$/), workdayEndTime: z.string().regex(/^\d{2}:\d{2}$/), replanningWindowDays: z.number().min(0).max(365),
  title: z.string().trim().min(1, "Ingrese el título.").max(120), subtitle: z.string().trim().min(1, "Ingrese el subtítulo.").max(180)
}).superRefine((value, context) => {
  if (value.workdayStartTime >= value.workdayEndTime) context.addIssue({ code: "custom", path: ["workdayEndTime"], message: "El fin de jornada debe ser posterior al inicio." });
  for (const [from, until] of [[value.publicRequirementFormActiveFrom, value.publicRequirementFormActiveUntil], [value.publicRequirementFullPageActiveFrom, value.publicRequirementFullPageActiveUntil], [value.loginChatbotActiveFrom, value.loginChatbotActiveUntil]]) {
    if (from && until && new Date(from) > new Date(until)) context.addIssue({ code: "custom", path: ["publicRequirementFormActiveUntil"], message: "El fin del período debe ser posterior al inicio." });
  }
});

export type BrandFormValues = z.infer<typeof brandSettingsSchema>;

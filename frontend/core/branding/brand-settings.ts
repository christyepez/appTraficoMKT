export type GradientDirection = "to right" | "to bottom" | "135deg";

export type BrandSettings = {
  primary: string; primaryDark: string; accent: string; background: string; surface: string; foreground: string; muted: string; line: string;
  buttonText: string; secondary: string; secondaryText: string; success: string; warning: string; danger: string; topbarText: string;
  useGradient: boolean; gradientColor: string; gradientDirection: GradientDirection;
  headerColor: string; headerUseGradient: boolean; headerGradientColor: string; headerGradientDirection: GradientDirection;
  menuColor: string; menuUseGradient: boolean; menuGradientColor: string; menuGradientDirection: GradientDirection;
  fontFamily: string; menuMode: "horizontal" | "vertical"; menuCollapsed: boolean; mobileMenuCollapsed: boolean; menuOrder: string;
  headerTextAlign: "left" | "center" | "right"; headerTextPosition: "top" | "middle" | "bottom";
  showHeaderTitle: boolean; showHeaderSubtitle: boolean; headerTitleSize: number; headerSubtitleSize: number;
  headerTitleWeight: "400" | "600" | "700"; headerSubtitleWeight: "400" | "600" | "700";
  headerTitleItalic: boolean; headerSubtitleItalic: boolean; headerTitleUnderline: boolean; headerSubtitleUnderline: boolean;
  headerTitleColor: string; headerSubtitleColor: string; brandVersion: number; logo: string; chatbotIcon: string;
  showPublicRequirementForm: boolean; showPublicRequirementFullPage: boolean; showLoginChatbot: boolean;
  publicRequirementFormActiveFrom?: string | null; publicRequirementFormActiveUntil?: string | null;
  publicRequirementFullPageActiveFrom?: string | null; publicRequirementFullPageActiveUntil?: string | null;
  loginChatbotActiveFrom?: string | null; loginChatbotActiveUntil?: string | null;
  showDemoCredentials: boolean; showOffice365Login: boolean; showProductIdField: boolean;
  workdayStartTime: string; workdayEndTime: string; replanningWindowDays: number; title: string; subtitle: string;
};

// Valores institucionales conservados desde app/lib.ts sin modificación.
export const defaultBrandSettings: BrandSettings = {
  primary: "#3c235f", primaryDark: "#2a1844", accent: "#f6b700", background: "#f5f7fb", surface: "#ffffff", foreground: "#101b2d", muted: "#697386", line: "#d9deea",
  buttonText: "#ffffff", secondary: "#eef4f7", secondaryText: "#001f49", success: "#207044", warning: "#f6b700", danger: "#b42318", topbarText: "#ffffff",
  useGradient: false, gradientColor: "#6d4a8d", gradientDirection: "135deg",
  headerColor: "#3c235f", headerUseGradient: false, headerGradientColor: "#6d4a8d", headerGradientDirection: "135deg",
  menuColor: "#3c235f", menuUseGradient: false, menuGradientColor: "#6d4a8d", menuGradientDirection: "135deg",
  fontFamily: "Segoe UI, Arial, Helvetica, sans-serif", menuMode: "horizontal", menuCollapsed: false, mobileMenuCollapsed: true,
  menuOrder: "dashboard,activities,agenda,agenda-calendar,agenda-metrics,evidence,approvals,metrics,audit,admin,users,storage,initial-import,branding,notifications,my-notifications,notification-log",
  headerTextAlign: "center", headerTextPosition: "middle", showHeaderTitle: true, showHeaderSubtitle: true, headerTitleSize: 18, headerSubtitleSize: 12,
  headerTitleWeight: "700", headerSubtitleWeight: "400", headerTitleItalic: false, headerSubtitleItalic: false, headerTitleUnderline: false, headerSubtitleUnderline: false,
  headerTitleColor: "#ffffff", headerSubtitleColor: "#ffffff", brandVersion: 3,
  logo: "https://www.indoamerica.edu.ec/wp-content/uploads/2026/03/logo-gen-cuad.jpg",
  chatbotIcon: "https://www.indoamerica.edu.ec/wp-content/uploads/2026/03/logo-gen-cuad.jpg",
  showPublicRequirementForm: true, showPublicRequirementFullPage: true, showLoginChatbot: true,
  publicRequirementFormActiveFrom: null, publicRequirementFormActiveUntil: null, publicRequirementFullPageActiveFrom: null, publicRequirementFullPageActiveUntil: null,
  loginChatbotActiveFrom: null, loginChatbotActiveUntil: null, showDemoCredentials: true, showOffice365Login: true, showProductIdField: false,
  workdayStartTime: "08:00", workdayEndTime: "17:00", replanningWindowDays: 15,
  title: "Creamos conexiones que dejan huella", subtitle: "Universidad Indoamérica"
};

export function brandVariables(settings: Partial<BrandSettings>) {
  const primary = settings.primary ?? defaultBrandSettings.primary;
  const headerColor = settings.headerColor ?? primary;
  const menuColor = settings.menuColor ?? primary;
  return {
    "--primary": settings.primary, "--primary-dark": settings.primaryDark, "--accent": settings.accent, "--background": settings.background,
    "--surface": settings.surface, "--foreground": settings.foreground, "--muted": settings.muted, "--line": settings.line,
    "--button-text": settings.buttonText, "--secondary": settings.secondary, "--secondary-text": settings.secondaryText,
    "--success": settings.success, "--warning": settings.warning, "--danger": settings.danger, "--topbar-text": settings.topbarText, "--font-family": settings.fontFamily,
    "--button-primary-background": settings.useGradient ? `linear-gradient(${settings.gradientDirection ?? defaultBrandSettings.gradientDirection}, ${primary}, ${settings.gradientColor ?? defaultBrandSettings.gradientColor})` : primary,
    "--header-background": settings.headerUseGradient ? `linear-gradient(${settings.headerGradientDirection ?? "135deg"}, ${headerColor}, ${settings.headerGradientColor ?? headerColor})` : headerColor,
    "--menu-base-color": menuColor,
    "--menu-background": settings.menuUseGradient ? `linear-gradient(${settings.menuGradientDirection ?? "135deg"}, ${menuColor}, ${settings.menuGradientColor ?? menuColor})` : menuColor,
    "--header-title-size": `${settings.headerTitleSize ?? defaultBrandSettings.headerTitleSize}px`, "--header-subtitle-size": `${settings.headerSubtitleSize ?? defaultBrandSettings.headerSubtitleSize}px`,
    "--header-title-weight": settings.headerTitleWeight ?? defaultBrandSettings.headerTitleWeight, "--header-subtitle-weight": settings.headerSubtitleWeight ?? defaultBrandSettings.headerSubtitleWeight,
    "--header-title-style": settings.headerTitleItalic ? "italic" : "normal", "--header-subtitle-style": settings.headerSubtitleItalic ? "italic" : "normal",
    "--header-title-decoration": settings.headerTitleUnderline ? "underline" : "none", "--header-subtitle-decoration": settings.headerSubtitleUnderline ? "underline" : "none",
    "--header-title-color": settings.headerTitleColor ?? defaultBrandSettings.headerTitleColor, "--header-subtitle-color": settings.headerSubtitleColor ?? defaultBrandSettings.headerSubtitleColor
  } as Record<string, string | undefined>;
}

export function applyBrandVariables(settings: Partial<BrandSettings>, root: HTMLElement | null = typeof document === "undefined" ? null : document.documentElement) {
  if (!root) return;
  Object.entries(brandVariables(settings)).forEach(([key, value]) => { if (value) root.style.setProperty(key, value); });
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  screenPermissions: string[];
  menuMode?: "horizontal" | "vertical";
  menuCollapsed?: boolean;
  mustChangePassword?: boolean;
};

export type AuthSession = {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
};

export type BrandSettings = {
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  line: string;
  buttonText: string;
  secondary: string;
  secondaryText: string;
  success: string;
  warning: string;
  danger: string;
  topbarText: string;
  useGradient: boolean;
  gradientColor: string;
  gradientDirection: "to right" | "to bottom" | "135deg";
  headerColor: string;
  headerUseGradient: boolean;
  headerGradientColor: string;
  headerGradientDirection: "to right" | "to bottom" | "135deg";
  menuColor: string;
  menuUseGradient: boolean;
  menuGradientColor: string;
  menuGradientDirection: "to right" | "to bottom" | "135deg";
  fontFamily: string;
  menuMode: "horizontal" | "vertical";
  menuCollapsed: boolean;
  mobileMenuCollapsed: boolean;
  menuOrder: string;
  headerTextAlign: "left" | "center" | "right";
  headerTextPosition: "top" | "middle" | "bottom";
  brandVersion: number;
  logo: string;
  chatbotIcon: string;
  showPublicRequirementForm: boolean;
  showPublicRequirementFullPage: boolean;
  showLoginChatbot: boolean;
  showDemoCredentials: boolean;
  showOffice365Login: boolean;
  showProductIdField: boolean;
  title: string;
  subtitle: string;
};

export const defaultBrandSettings: BrandSettings = {
  primary: "#3c235f",
  primaryDark: "#2a1844",
  accent: "#f6b700",
  background: "#f5f7fb",
  surface: "#ffffff",
  foreground: "#101b2d",
  muted: "#697386",
  line: "#d9deea",
  buttonText: "#ffffff",
  secondary: "#eef4f7",
  secondaryText: "#001f49",
  success: "#207044",
  warning: "#f6b700",
  danger: "#b42318",
  topbarText: "#ffffff",
  useGradient: false,
  gradientColor: "#6d4a8d",
  gradientDirection: "135deg",
  headerColor: "#3c235f",
  headerUseGradient: false,
  headerGradientColor: "#6d4a8d",
  headerGradientDirection: "135deg",
  menuColor: "#3c235f",
  menuUseGradient: false,
  menuGradientColor: "#6d4a8d",
  menuGradientDirection: "135deg",
  fontFamily: "Segoe UI, Arial, Helvetica, sans-serif",
  menuMode: "horizontal",
  menuCollapsed: false,
  mobileMenuCollapsed: true,
  menuOrder: "dashboard,activities,evidence,approvals,metrics,audit,admin,users,storage,initial-import,branding,notifications,my-notifications,notification-log",
  headerTextAlign: "center",
  headerTextPosition: "middle",
  brandVersion: 3,
  logo: "https://www.indoamerica.edu.ec/wp-content/uploads/2026/03/logo-gen-cuad.jpg",
  chatbotIcon: "https://www.indoamerica.edu.ec/wp-content/uploads/2026/03/logo-gen-cuad.jpg",
  showPublicRequirementForm: true,
  showPublicRequirementFullPage: true,
  showLoginChatbot: true,
  showDemoCredentials: true,
  showOffice365Login: true,
  showProductIdField: false,
  title: "Creamos conexiones que dejan huella",
  subtitle: "Universidad Indoamérica"
};

export function applyBrandVariables(settings: Partial<BrandSettings>) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const primary = settings.primary ?? defaultBrandSettings.primary;
  const gradientColor = settings.gradientColor ?? defaultBrandSettings.gradientColor;
  const gradientDirection = settings.gradientDirection ?? defaultBrandSettings.gradientDirection;
  const headerColor = settings.headerColor ?? primary;
  const menuColor = settings.menuColor ?? primary;
  Object.entries({
    "--primary": settings.primary,
    "--primary-dark": settings.primaryDark,
    "--accent": settings.accent,
    "--background": settings.background,
    "--surface": settings.surface,
    "--foreground": settings.foreground,
    "--muted": settings.muted,
    "--line": settings.line,
    "--button-text": settings.buttonText,
    "--secondary": settings.secondary,
    "--secondary-text": settings.secondaryText,
    "--success": settings.success,
    "--warning": settings.warning,
    "--danger": settings.danger,
    "--topbar-text": settings.topbarText,
    "--font-family": settings.fontFamily,
    "--brand-gradient": settings.useGradient ? `linear-gradient(${gradientDirection}, ${primary}, ${gradientColor})` : primary,
    "--header-background": settings.headerUseGradient ? `linear-gradient(${settings.headerGradientDirection ?? "135deg"}, ${headerColor}, ${settings.headerGradientColor ?? headerColor})` : headerColor,
    "--menu-background": settings.menuUseGradient ? `linear-gradient(${settings.menuGradientDirection ?? "135deg"}, ${menuColor}, ${settings.menuGradientColor ?? menuColor})` : menuColor
  }).forEach(([key, value]) => {
    if (value) root.style.setProperty(key, String(value));
  });
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("requirements-session");
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
      clearSession();
      return null;
    }
    const roles = session.user?.roles ?? [];
    const screenPermissions = session.user?.screenPermissions ?? defaultScreensForRoles(roles);

    return {
      ...session,
      user: {
        id: session.user?.id ?? "",
        name: session.user?.name ?? "Usuario",
        email: session.user?.email ?? "",
        roles,
        screenPermissions,
        menuMode: session.user?.menuMode === "vertical" ? "vertical" : "horizontal",
        menuCollapsed: Boolean(session.user?.menuCollapsed),
        mustChangePassword: Boolean(session.user?.mustChangePassword)
      }
    };
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(session: AuthSession) {
  window.sessionStorage.removeItem("requirements-explicit-logout");
  window.localStorage.removeItem("requirements-session");
  window.localStorage.removeItem("requirements-last-toast");
  window.localStorage.setItem("requirements-session", JSON.stringify(session));
  window.dispatchEvent(new Event("requirements-session-changed"));
}

export function clearSession() {
  window.localStorage.removeItem("requirements-session");
  window.localStorage.removeItem("requirements-last-toast");
  window.sessionStorage.removeItem("msal-state");
  window.sessionStorage.removeItem("msal-code-verifier");
  window.dispatchEvent(new Event("requirements-session-changed"));
}

export function logoutSession() {
  window.sessionStorage.setItem("requirements-explicit-logout", "1");
  clearSession();
}

export type ToastType = "success" | "error" | "info";
const toastStorageKey = "requirements-last-toast";

export function showToast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  const detail = { id: Date.now(), message, type };
  window.localStorage.setItem(toastStorageKey, JSON.stringify(detail));
  window.dispatchEvent(new CustomEvent("app-toast", { detail }));
}

export const translations: Record<string, Record<string, string>> = {
  en: {
    "Requerimientos": "Requirements",
    "Productos": "Products",
    "Adjuntos": "Attachments",
    "Aprobaciones": "Approvals",
    "Métricas": "Metrics",
    "Auditorías": "Audits",
    "Administración": "Administration",
    "Usuarios": "Users",
    "Archivos": "Files",
    "Carga inicial": "Initial load",
    "Marca": "Brand",
    "Manejo Marca": "Brand Management",
    "Notificaciones": "Notifications",
    "Cerrar sesion": "Sign out",
    "Marca institucional": "Institutional brand",
    "Configuración de almacenamiento": "Storage settings",
    "Guardar": "Save",
    "Crear": "Create",
    "Editar": "Edit",
    "Cancelar": "Cancel",
    "Activo": "Active",
    "Inactivo": "Inactive",
    "Configuración de notificaciones": "Notification settings",
    "Detalle de configuraciones": "Configuration details",
    "Nombre": "Name",
    "Proveedor": "Provider",
    "Ruta local": "Local path",
    "Usar cloud en producción": "Use cloud in production",
    "Correo": "Email",
    "Teams": "Teams",
    "Webhook": "Webhook",
    "Vista previa": "Preview",
    "Título": "Title",
    "Subtítulo": "Subtitle"
  }
};

export function t(text: string) {
  if (typeof window === "undefined") return text;
  const language = window.localStorage.getItem("ui-language") ?? "es";
  return translations[language]?.[text] ?? text;
}

function defaultScreensForRoles(roles: string[]) {
  if (roles.includes("Administrador")) return ["dashboard", "activities", "evidence", "approvals", "metrics", "audit", "admin", "users", "storage", "initial-import", "branding", "notifications", "my-notifications", "notification-log"];
  if (roles.includes("Coordinador")) return ["dashboard", "activities", "evidence", "approvals", "metrics", "audit", "my-notifications"];
  const screens = new Set(["dashboard"]);
  if (roles.includes("Tecnico")) {
    screens.add("activities");
    screens.add("evidence");
    screens.add("my-notifications");
  }
  if (roles.includes("Aprobador")) {
    screens.add("approvals");
    screens.add("my-notifications");
  }
  if (roles.includes("Auditor")) {
    screens.add("activities");
    screens.add("evidence");
    screens.add("approvals");
    screens.add("metrics");
    screens.add("audit");
  }
  return Array.from(screens);
}

export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const session = getSession();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);

  const response = await fetch(url, { cache: "no-store", ...init, headers });
  if (!response.ok) {
    const text = await response.text();
    const message = friendlyHttpMessage(response.status, text);
    const explicitLogout = typeof window !== "undefined" && window.sessionStorage.getItem("requirements-explicit-logout") === "1";
    if (!(response.status === 401 && explicitLogout)) showToast(message, "error");
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function friendlyHttpMessage(status: number, text: string) {
  if (status === 401) return text || "Sesión no autorizada o vencida. Vuelva a iniciar sesión si el problema continúa.";
  if (status === 403) return text || "No tiene permisos para realizar esta acción.";
  if (status === 404) return "No se encontró el recurso solicitado.";
  if (status === 409) return text || "El registro ya existe o genera duplicidad.";
  return text || `Error HTTP ${status}`;
}

export type Requirement = {
  id: string;
  code: string;
  activityOrEvent: string;
  requestedBy: string;
  facultyId: string;
  faculty: string;
  career: string;
  campusId: string;
  campus: string;
  place: string;
  startDate: string;
  endDate: string;
  eventObjective: string;
  eventFormatId: string;
  eventFormat: string;
  requestDate: string;
  status: string;
  statusId: string;
};

export type Activity = {
  id: string;
  requirementId: string;
  productId: string;
  requirementTypeId: string;
  requirementType: string;
  strategicObjective: string;
  targetAudienceId: string;
  targetAudience: string;
  productTypeId: string;
  productType: string;
  diffusionChannelId: string;
  diffusionChannel: string;
  mainKpiId: string;
  mainKpi: string;
  productResponsible: string;
  productDeliveryDate?: string;
  observations: string;
  status: string;
  statusId: string;
};

export type NamedCatalog = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  type?: string;
};

export type Approver = {
  id: string;
  name: string;
  email: string;
  facultyId?: string;
  campusId?: string;
  approvalLevel: number;
  isActive: boolean;
};

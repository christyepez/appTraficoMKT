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

export { applyBrandVariables, defaultBrandSettings } from "../core/branding/brand-settings";
export type { BrandSettings } from "../core/branding/brand-settings";
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
    "Agenda técnica": "Technical agenda",
    "Calendario técnico": "Technical calendar",
    "Métricas agenda": "Agenda metrics",
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
  if (roles.includes("Administrador")) return ["dashboard", "activities", "agenda", "agenda-calendar", "agenda-metrics", "evidence", "approvals", "metrics", "audit", "admin", "users", "storage", "initial-import", "branding", "notifications", "my-notifications", "notification-log"];
  if (roles.includes("Coordinador")) return ["dashboard", "activities", "agenda", "agenda-calendar", "agenda-metrics", "evidence", "approvals", "metrics", "audit", "my-notifications"];
  const screens = new Set(["dashboard"]);
  if (roles.includes("Tecnico")) {
    screens.add("activities");
    screens.add("agenda");
    screens.add("agenda-calendar");
    screens.add("agenda-metrics");
    screens.add("evidence");
    screens.add("my-notifications");
  }
  if (roles.includes("Aprobador")) {
    screens.add("approvals");
    screens.add("my-notifications");
  }
  if (roles.includes("Auditor")) {
    screens.add("activities");
    screens.add("agenda");
    screens.add("agenda-calendar");
    screens.add("agenda-metrics");
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

export type { Activity, Approver, NamedCatalog, Requirement } from "../shared/models/api.models";

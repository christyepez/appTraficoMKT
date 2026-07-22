import { getSession } from "../core/auth/session";

export { clearSession, getSession, logoutSession, saveSession } from "../core/auth/session";
export type { AuthSession, SessionUser } from "../core/auth/session";

export { applyBrandVariables, defaultBrandSettings } from "../core/branding/brand-settings";
export type { BrandSettings } from "../core/branding/brand-settings";
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

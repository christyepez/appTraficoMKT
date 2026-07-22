import { getSession } from "../auth/session";
import { showToast } from "../configuration/toast";

export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const session = getSession();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  const response = await fetch(url, { cache: "no-store", ...init, headers });
  if (!response.ok) {
    const message = friendlyHttpMessage(response.status, await response.text());
    const explicitLogout = typeof window !== "undefined" && window.sessionStorage.getItem("requirements-explicit-logout") === "1";
    if (!(response.status === 401 && explicitLogout)) showToast(message, "error");
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function friendlyHttpMessage(status: number, text: string) {
  if (status === 401) return text || "Sesión no autorizada o vencida. Vuelva a iniciar sesión si el problema continúa.";
  if (status === 403) return text || "No tiene permisos para realizar esta acción.";
  if (status === 404) return "No se encontró el recurso solicitado.";
  if (status === 409) return text || "El registro ya existe o genera duplicidad.";
  return text || `Error HTTP ${status}`;
}

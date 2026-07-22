import type { SatisfactionContext, SatisfactionPayload } from "../models/satisfaction.models";
import { SatisfactionServiceError } from "../models/satisfaction.models";

function endpoint(token: string) {
  return `/api/requirements/satisfaction/${encodeURIComponent(token)}`;
}

export async function getSatisfactionContext(token: string): Promise<SatisfactionContext> {
  return request<SatisfactionContext>(endpoint(token));
}

export async function submitSatisfaction(token: string, payload: SatisfactionPayload) {
  return request(endpoint(token), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}

async function request<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new SatisfactionServiceError("network", "No se pudo conectar con el servicio. Intente nuevamente.");
  }
  if (response.status === 404) throw new SatisfactionServiceError("invalid", "El enlace de la encuesta no es válido.");
  if (response.status === 410) throw new SatisfactionServiceError("expired", "El enlace de la encuesta ha vencido.");
  if (response.status === 409) throw new SatisfactionServiceError("used", "Esta encuesta ya fue respondida.");
  if (!response.ok) throw new SatisfactionServiceError("api", "No fue posible procesar la encuesta. Intente nuevamente.");
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

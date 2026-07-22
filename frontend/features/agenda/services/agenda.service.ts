import { api, defaultBrandSettings, type BrandSettings } from "../../../app/lib";
import type { Activity, Requirement } from "../../../shared/models/api.models";
import type { AgendaItem, AgendaWorkspaceData, SaveAgendaPayload, Technician } from "../models/agenda.models";

export async function getAgendaWorkspace(): Promise<AgendaWorkspaceData> {
  const [activities, requirements, technicians, items, brand] = await Promise.all([
    api<Activity[]>("/api/activities"), api<Requirement[]>("/api/requirements"),
    api<Technician[]>("/api/identity/users/technicians").catch(() => []), api<AgendaItem[]>("/api/agenda").catch(() => []),
    api<Partial<BrandSettings>>("/api/identity/brand-settings").catch(() => defaultBrandSettings)
  ]);
  return { activities, requirements, technicians, items, workdayStartTime: brand.workdayStartTime ?? defaultBrandSettings.workdayStartTime, workdayEndTime: brand.workdayEndTime ?? defaultBrandSettings.workdayEndTime };
}

export function saveAgendaItem(item: AgendaItem | null, payload: SaveAgendaPayload) {
  return api(`/api/agenda${item ? `/${item.id}` : ""}`, { method: item ? "PUT" : "POST", body: JSON.stringify(payload) });
}
export function deleteAgendaItem(id: string) { return api(`/api/agenda/${id}`, { method: "DELETE" }); }

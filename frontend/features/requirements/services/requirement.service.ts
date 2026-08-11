import { api } from "../../../app/lib";
import type { Activity, NamedCatalog, Requirement } from "../../../shared/models/api.models";
import type { CareerCatalog, RequirementAttachment, RequirementStatusAction, RequirementWorkspaceData, SaveRequirementPayload } from "../models/requirement.models";

export async function getRequirementWorkspace(): Promise<RequirementWorkspaceData> {
  const [requirements, activities, faculties, careers, campuses, eventFormats] = await Promise.all([
    api<Requirement[]>("/api/requirements"),
    api<Activity[]>("/api/activities").catch(() => []),
    api<NamedCatalog[]>("/api/admin/faculties").catch(() => []),
    api<CareerCatalog[]>("/api/admin/careers").catch(() => []),
    api<NamedCatalog[]>("/api/admin/campuses").catch(() => []),
    api<NamedCatalog[]>("/api/admin/catalogs/by-type/FormatoEvento").catch(() => [])
  ]);

  return {
    requirements,
    activities,
    catalogs: {
      faculties: active(faculties),
      careers: active(careers),
      campuses: active(campuses),
      eventFormats: active(eventFormats)
    }
  };
}

export function saveRequirement(requirement: Requirement | null, payload: SaveRequirementPayload) {
  const { attachments: _attachments, ...jsonPayload } = payload;
  return api<Requirement>(`/api/requirements${requirement ? `/${requirement.id}` : ""}`, {
    method: requirement ? "PUT" : "POST",
    body: JSON.stringify(jsonPayload)
  });
}

export function uploadRequirementAttachments(requirementId: string, files: File[], uploadedBy: string) {
  const form = new FormData();
  files.forEach((file) => form.append("file", file));
  form.append("uploadedBy", uploadedBy);
  return api<{ uploaded: RequirementAttachment[]; failedFiles: string[] }>(`/api/requirements/${requirementId}/attachments`, {
    method: "POST",
    body: form
  });
}

export function getRequirementAttachments(requirementId: string) {
  return api<RequirementAttachment[]>(`/api/requirements/${requirementId}/attachments`);
}

export function updateRequirementStatus(requirementId: string, action: RequirementStatusAction) {
  return api<Requirement>(`/api/requirements/${requirementId}/${action}`, { method: "PATCH" });
}

export function deleteRequirement(requirementId: string) {
  return api<Requirement>(`/api/requirements/${requirementId}`, { method: "DELETE" });
}

function active<T extends { isActive: boolean }>(items: T[]) {
  return items.filter((item) => item.isActive);
}

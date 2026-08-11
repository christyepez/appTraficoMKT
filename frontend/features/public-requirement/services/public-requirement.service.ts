import { defaultBrandSettings, type BrandSettings } from "../../../app/lib";
import { friendlyHttpMessage } from "../../../core/api/api-client";
import type { PublicCatalog, PublicRequirementAttachmentResult, PublicRequirementCatalogs, PublicRequirementCreationResult, PublicRequirementPayload } from "../models/public-requirement.models";

export async function getPublicRequirementCatalogs(): Promise<PublicRequirementCatalogs> {
  const { faculties, careers, campuses, eventFormats } = await publicApi<PublicRequirementCatalogs>("/api/admin/public/catalogs/requirements");
  const active = (items: PublicCatalog[]) => items.filter((item) => item.isActive);
  return { faculties: active(faculties), careers: active(careers), campuses: active(campuses), eventFormats: active(eventFormats) };
}

export async function getPublicBrandSettings() {
  const settings = await publicApi<BrandSettings>("/api/identity/brand-settings");
  return { ...defaultBrandSettings, ...settings };
}

export function createPublicRequirement(payload: PublicRequirementPayload) {
  return publicApi<PublicRequirementCreationResult>("/api/requirements/public", {
    method: "POST",
    headers: { "Idempotency-Key": payload.idempotencyKey },
    body: JSON.stringify(payload)
  });
}

export async function uploadPublicRequirementAttachment(requirementId: string, uploadToken: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  form.append("uploadToken", uploadToken);
  await publicApi(`/api/requirements/${requirementId}/attachments`, { method: "POST", body: form, headers: { "X-Requirement-Upload-Token": uploadToken } });
  return { attachmentId: crypto.randomUUID(), fileName: file.name, success: true } satisfies PublicRequirementAttachmentResult;
}

async function publicApi<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(url, { cache: "no-store", ...init, headers });
  if (!response.ok) throw new Error(friendlyHttpMessage(response.status, await response.text()));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

import {
  REQUIREMENT_ATTACHMENT_LIMIT,
  REQUIREMENT_ATTACHMENT_MAX_BYTES,
  requirementAttachmentExtensions,
  requirementAttachmentMimeTypes,
  REQUIREMENT_WORD_LIMIT
} from "./requirement-form.constants";
import type { RequirementAttachmentValidationResult, RequirementFormCatalogs, RequirementFormValues } from "./requirement-form.types";

export function wordCount(value: string) {
  const words = value.trim().match(/\S+/g);
  return words?.length ?? 0;
}

export function isWithinWordLimit(value: string, limit = REQUIREMENT_WORD_LIMIT) {
  return wordCount(value) <= limit;
}

export function splitDateTime(value: string) {
  const [date = "", time = ""] = value.split("T");
  return { date, time: time || null };
}

export function joinDateTime(date?: string, time?: string | null) {
  if (!date) return "";
  return time ? `${date}T${time.slice(0, 5)}` : `${date}T00:00`;
}

export function sanitizeDisplayFileName(value: string) {
  return value.replace(/[\\/]/g, "").replace(/\s+/g, " ").trim();
}

export function fileExtension(fileName: string) {
  const normalized = sanitizeDisplayFileName(fileName).toLowerCase();
  const index = normalized.lastIndexOf(".");
  return index >= 0 ? normalized.slice(index) : "";
}

export function validateRequirementFile(file: File | null): RequirementAttachmentValidationResult {
  if (!file) return { valid: false, message: "Seleccione un archivo." };
  if (file.size > REQUIREMENT_ATTACHMENT_MAX_BYTES) return { valid: false, message: "El archivo no puede superar 5 MB." };
  if (!requirementAttachmentMimeTypes.includes(file.type as never)) return { valid: false, message: "Formato no permitido. Use PDF, JPG, PNG o WebP." };
  if (!requirementAttachmentExtensions.includes(fileExtension(file.name) as never)) return { valid: false, message: "La extensión del archivo no coincide con los formatos permitidos." };
  return { valid: true };
}

export function validateRequirementFiles(files: File[]): RequirementAttachmentValidationResult {
  if (files.length > REQUIREMENT_ATTACHMENT_LIMIT) return { valid: false, message: "Puede adjuntar máximo 5 archivos." };
  const invalid = files.map(validateRequirementFile).find((result) => !result.valid);
  return invalid ?? { valid: true };
}

export function selectedCatalogNames(values: RequirementFormValues, catalogs: RequirementFormCatalogs) {
  return {
    faculty: catalogs.faculties.find((item) => item.id === values.facultyId)?.name ?? values.faculty,
    career: catalogs.careers.find((item) => item.id === values.careerId)?.name ?? values.career,
    campus: catalogs.campuses.find((item) => item.id === values.campusId)?.name ?? values.campus,
    eventFormat: catalogs.eventFormats.find((item) => item.id === values.eventFormatId)?.name ?? values.eventFormat ?? ""
  };
}

export function careerBelongsToFaculty(catalogs: RequirementFormCatalogs, facultyId: string, careerId?: string) {
  if (!careerId) return false;
  return catalogs.careers.some((item) => item.id === careerId && (!item.facultyId || item.facultyId === facultyId));
}

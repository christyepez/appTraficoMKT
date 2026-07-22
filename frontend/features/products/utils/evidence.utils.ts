import type { Approval } from "../models/product.models";

export const MAX_EVIDENCE_SIZE = 50 * 1024 * 1024;

export type EvidencePreviewKind = "image" | "pdf" | "other";

export function validateEvidenceFile(file: File | null) {
  if (!file) return "Seleccione un archivo.";
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_EVIDENCE_SIZE) return "El archivo no puede superar 50 MB.";
  return null;
}

export function normalizeEvidenceUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function evidenceFileName(urlValue: string, customName: string) {
  const url = new URL(urlValue);
  return customName.trim() || url.pathname.split("/").filter(Boolean).pop() || url.hostname;
}

export function evidencePreviewKind(fileName: string, contentType = ""): EvidencePreviewKind {
  if (contentType.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp)$/i.test(fileName)) return "image";
  if (contentType === "application/pdf" || /\.pdf$/i.test(fileName)) return "pdf";
  return "other";
}

export function canDeleteEvidence(activityId: string, approvals: Approval[]) {
  return !approvals.some((approval) => approval.activityId === activityId && ["Approved", "Rejected"].includes(approval.decision));
}

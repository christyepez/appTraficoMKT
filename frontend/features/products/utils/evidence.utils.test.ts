import { describe, expect, it } from "vitest";
import { MAX_EVIDENCE_SIZE, canDeleteEvidence, evidenceFileName, evidencePreviewKind, normalizeEvidenceUrl, validateEvidenceFile } from "./evidence.utils";

describe("evidence validators", () => {
  it("valida presencia, contenido y límite de 50 MB", () => {
    expect(validateEvidenceFile(null)).toBe("Seleccione un archivo.");
    expect(validateEvidenceFile(new File([], "empty.pdf"))).toBe("El archivo está vacío.");
    expect(validateEvidenceFile(new File([new Uint8Array(MAX_EVIDENCE_SIZE + 1)], "large.pdf"))).toBe("El archivo no puede superar 50 MB.");
    expect(validateEvidenceFile(new File(["ok"], "valid.pdf", { type: "application/pdf" }))).toBeNull();
  });

  it("acepta únicamente URL HTTP o HTTPS", () => {
    expect(normalizeEvidenceUrl("https://example.com/video.mp4")).toBe("https://example.com/video.mp4");
    expect(normalizeEvidenceUrl("ftp://example.com/file")).toBeNull();
    expect(normalizeEvidenceUrl("sin-url")).toBeNull();
  });

  it("genera nombre descriptivo con fallbacks", () => {
    expect(evidenceFileName("https://example.com/files/video.mp4", "Video final")).toBe("Video final");
    expect(evidenceFileName("https://example.com/files/video.mp4", "")).toBe("video.mp4");
    expect(evidenceFileName("https://example.com", "")).toBe("example.com");
  });

  it("clasifica imágenes, PDF y archivos sin vista previa", () => {
    expect(evidencePreviewKind("foto.bin", "image/png")).toBe("image");
    expect(evidencePreviewKind("documento.PDF")).toBe("pdf");
    expect(evidencePreviewKind("datos.xlsx")).toBe("other");
  });

  it("bloquea eliminación después de una decisión", () => {
    const approvals = [{ id: "a1", activityId: "p1", decision: "Pending", approvedBy: "A", comments: "", createdAt: "2026-01-01" }];
    expect(canDeleteEvidence("p1", approvals)).toBe(true);
    expect(canDeleteEvidence("p1", [{ ...approvals[0], decision: "Approved" }])).toBe(false);
    expect(canDeleteEvidence("p1", [{ ...approvals[0], decision: "Rejected" }])).toBe(false);
  });
});

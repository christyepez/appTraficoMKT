import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Approval, EvidenceItem, Product } from "../models/product.models";
import { ApprovalVersionsDialog } from "./ApprovalVersionsDialog";
import { EvidenceGallery } from "./EvidenceGallery";
import { EvidencePreview } from "./EvidencePreview";
import { ProductAttachmentPanel } from "./ProductAttachmentPanel";

beforeEach(() => {
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:preview") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});

describe("ProductAttachmentPanel", () => {
  it("valida archivo requerido y URL inválida", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Agregar adjunto" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Seleccione un archivo");

    await user.selectOptions(screen.getByLabelText("Origen del adjunto"), "url");
    await user.type(screen.getByLabelText("URL del adjunto"), "ftp://example.com/file");
    await user.click(screen.getByRole("button", { name: "Agregar adjunto" }));
    expect(screen.getByRole("alert")).toHaveTextContent("URL HTTP o HTTPS válida");
  });

  it("carga un archivo válido y cierra el panel", async () => {
    const user = userEvent.setup();
    const onUploadFile = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    const { container } = renderPanel({ onUploadFile, onClose });
    const file = new File(["contenido"], "evidencia.pdf", { type: "application/pdf" });
    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, file);
    expect(screen.getByTitle("evidencia.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Agregar adjunto" }));
    expect(onUploadFile).toHaveBeenCalledWith("product1", file, "Equipo técnico");
    expect(onClose).toHaveBeenCalled();
  });

  it("registra un enlace con nombre inferido", async () => {
    const user = userEvent.setup();
    const onUploadUrl = vi.fn().mockResolvedValue(true);
    renderPanel({ onUploadUrl });
    await user.selectOptions(screen.getByLabelText("Origen del adjunto"), "url");
    await user.type(screen.getByLabelText("URL del adjunto"), "https://example.com/files/video.mp4");
    await user.click(screen.getByRole("button", { name: "Agregar adjunto" }));
    expect(onUploadUrl).toHaveBeenCalledWith("product1", "video.mp4", "https://example.com/files/video.mp4", "Equipo técnico");
  });
});

describe("EvidencePreview", () => {
  it("renderiza imagen, PDF y fallback", () => {
    const { rerender } = render(<EvidencePreview fileName="foto.png" source="/foto.png" />);
    expect(screen.getByRole("img", { name: "foto.png" })).toBeInTheDocument();
    rerender(<EvidencePreview fileName="documento.pdf" source="/documento.pdf" />);
    expect(screen.getByTitle("documento.pdf")).toBeInTheDocument();
    rerender(<EvidencePreview fileName="datos.xlsx" source="/datos.xlsx" />);
    expect(screen.getByText(/Vista previa no disponible/)).toBeInTheDocument();
  });
});

describe("EvidenceGallery", () => {
  it("permite eliminar sin decisión y cierra con Escape", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onClose = vi.fn();
    render(<EvidenceGallery product={product()} evidence={evidence} approvals={[]} pendingEvidenceIds={new Set()} onDelete={onDelete} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Eliminar archivo.pdf" }));
    expect(onDelete).toHaveBeenCalledWith("e1");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("bloquea eliminar después de aprobación", () => {
    render(<EvidenceGallery product={product()} evidence={evidence} approvals={[approval()]} pendingEvidenceIds={new Set()} onDelete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Eliminar archivo.pdf" })).not.toBeInTheDocument();
  });
});

describe("ApprovalVersionsDialog", () => {
  it("ordena versiones, abre adjuntos y cierra con Escape", async () => {
    const user = userEvent.setup();
    const onViewEvidence = vi.fn();
    const onClose = vi.fn();
    render(<ApprovalVersionsDialog product={product()} approvals={[approval({ id: "a2", createdAt: "2026-02-01", decision: "Rejected" }), approval()]} onViewEvidence={onViewEvidence} onClose={onClose} />);
    expect(screen.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent("Versión 1 - Aprobado");
    await user.click(screen.getAllByRole("button", { name: /Ver adjuntos/ })[0]);
    expect(onViewEvidence).toHaveBeenCalledWith("product1");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});

const evidence: EvidenceItem[] = [{ id: "e1", activityId: "product1", fileName: "archivo.pdf", storageUrl: "/archivo.pdf", uploadedBy: "Equipo" }];

function renderPanel(overrides: Partial<React.ComponentProps<typeof ProductAttachmentPanel>> = {}) {
  return render(<ProductAttachmentPanel product={product()} pending={false} onUploadFile={vi.fn().mockResolvedValue(true)} onUploadUrl={vi.fn().mockResolvedValue(true)} onClose={vi.fn()} {...overrides} />);
}

function product(): Product {
  return { id: "product1", requirementId: "req1", productId: "PROD-0001", requirementTypeId: "rt1", requirementType: "Diseño", strategicObjective: "Difusión", targetAudienceId: "ta1", targetAudience: "Estudiantes", productTypeId: "pt1", productType: "Video", diffusionChannelId: "dc1", diffusionChannel: "Instagram", mainKpiId: "k1", mainKpi: "Alcance", productResponsible: "tech@example.com", observations: "Campaña", status: "EvidenceAttached", statusId: "s1" };
}

function approval(overrides: Partial<Approval> = {}): Approval {
  return { id: "a1", activityId: "product1", decision: "Approved", approvedBy: "Aprobador", comments: "Correcto", createdAt: "2026-01-01", ...overrides };
}

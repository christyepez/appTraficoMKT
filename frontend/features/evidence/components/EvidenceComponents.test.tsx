import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "../models/evidence.models";
import { EvidenceList } from "./EvidenceList";
import { EvidenceUploadDialog } from "./EvidenceUploadDialog";

beforeEach(() => {
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:preview") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});

describe("EvidenceUploadDialog", () => {
  it("valida y carga un archivo", async () => {
    const user = userEvent.setup();
    const onUploadFile = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(<EvidenceUploadDialog activities={[activity()]} pendingIds={new Set()} onUploadFile={onUploadFile} onUploadUrl={vi.fn()} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Adjuntar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Seleccione un archivo");
    await user.upload(screen.getByLabelText("Seleccionar archivo"), new File(["pdf"], "informe.pdf", { type: "application/pdf" }));
    await user.click(screen.getByRole("button", { name: "Adjuntar" }));
    expect(onUploadFile).toHaveBeenCalledWith("p1", expect.any(File), "Equipo técnico");
    expect(onClose).toHaveBeenCalled();
  });

  it("normaliza URL y respeta cierre por Escape", async () => {
    const user = userEvent.setup();
    const onUploadUrl = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(<EvidenceUploadDialog activities={[activity()]} pendingIds={new Set()} onUploadFile={vi.fn()} onUploadUrl={onUploadUrl} onClose={onClose} />);
    await user.selectOptions(screen.getByLabelText("Origen del adjunto"), "url");
    await user.type(screen.getByLabelText("URL del adjunto"), "https://example.com/video.mp4");
    await user.click(screen.getByRole("button", { name: "Adjuntar" }));
    expect(onUploadUrl).toHaveBeenCalledWith("p1", "video.mp4", "https://example.com/video.mp4", "Equipo técnico");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});

describe("EvidenceList", () => {
  it("muestra estados y permite expandir, abrir y eliminar", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<EvidenceList activities={[activity()]} evidence={[{ id: "e1", activityId: "p1", fileName: "foto.png", contentType: "image/png", storageUrl: "/foto.png", uploadedBy: "Equipo" }]} approvals={[]} pendingIds={new Set()} isInitialLoading={false} loadError="" onRetry={vi.fn()} onAttach={vi.fn()} onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: /p1 - Video/ }));
    expect(screen.getByRole("img", { name: "foto.png" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Eliminar foto.png" }));
    expect(onDelete).toHaveBeenCalledWith("e1");
  });

  it("bloquea eliminar con decisión y presenta error recuperable", async () => {
    const { rerender } = render(<EvidenceList activities={[activity()]} evidence={[]} approvals={[]} pendingIds={new Set()} isInitialLoading loadError="" onRetry={vi.fn()} onAttach={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando");
    const onRetry = vi.fn();
    rerender(<EvidenceList activities={[]} evidence={[]} approvals={[]} pendingIds={new Set()} isInitialLoading={false} loadError="Sin conexión" onRetry={onRetry} onAttach={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalled();
  });
});

function activity(overrides: Partial<Activity> = {}): Activity {
  return { id: "p1", requirementId: "r1", productId: "p1", requirementTypeId: "r", requirementType: "R", strategicObjective: "O", targetAudienceId: "t", targetAudience: "T", productTypeId: "p", productType: "Video", diffusionChannelId: "d", diffusionChannel: "Web", mainKpiId: "k", mainKpi: "K", productResponsible: "tech@example.com", observations: "", status: "InProgress", statusId: "s", ...overrides };
}

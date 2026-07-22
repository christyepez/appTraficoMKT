import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Activity } from "../models/approval.models";
import { ApprovalDecisionForm } from "./ApprovalDecisionForm";
import { ApprovalEvidenceDialog } from "./ApprovalEvidenceDialog";
import { ApprovalQueue } from "./ApprovalQueue";

describe("ApprovalDecisionForm", () => {
  it("exige comentario y envía aprobar/rechazar", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(<ApprovalDecisionForm activity={activity()} initialDecision="Rejected" pending={false} onSubmit={onSubmit} onClose={onClose} />);
    await user.clear(screen.getByLabelText("Comentarios"));
    await user.click(screen.getByRole("button", { name: "Confirmar decisión" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("al menos 3");
    await user.type(screen.getByLabelText(/^Comentarios/), "Requiere cambios");
    await user.click(screen.getByRole("button", { name: "Confirmar decisión" }));
    expect(onSubmit).toHaveBeenCalledWith("Rejected", "Requiere cambios");
    expect(onClose).toHaveBeenCalled();
  });
});

describe("ApprovalQueue", () => {
  it("muestra acciones por permiso y conserva callbacks", async () => {
    const user = userEvent.setup();
    const onDecision = vi.fn();
    const onEvidence = vi.fn();
    const { rerender } = render(<ApprovalQueue activities={[activity()]} approvals={[]} search="" showApproved={false} canDecide pendingIds={new Set()} isInitialLoading={false} loadError="" onSearch={vi.fn()} onShowApproved={vi.fn()} onRetry={vi.fn()} onDecision={onDecision} onEvidence={onEvidence} />);
    await user.click(screen.getByRole("button", { name: "Aprobar PROD-1" }));
    expect(onDecision).toHaveBeenCalledWith(expect.objectContaining({ id: "p1" }), "Approved");
    await user.click(screen.getByRole("button", { name: "Ver adjuntos de PROD-1" }));
    expect(onEvidence).toHaveBeenCalled();
    rerender(<ApprovalQueue activities={[activity()]} approvals={[]} search="" showApproved={false} canDecide={false} pendingIds={new Set()} isInitialLoading={false} loadError="" onSearch={vi.fn()} onShowApproved={vi.fn()} onRetry={vi.fn()} onDecision={onDecision} onEvidence={onEvidence} />);
    expect(screen.queryByRole("button", { name: "Aprobar PROD-1" })).not.toBeInTheDocument();
  });

  it("presenta carga y error recuperable", async () => {
    const props = { activities: [], approvals: [], search: "", showApproved: false, canDecide: false, pendingIds: new Set<string>(), loadError: "", onSearch: vi.fn(), onShowApproved: vi.fn(), onRetry: vi.fn(), onDecision: vi.fn(), onEvidence: vi.fn() };
    const { rerender } = render(<ApprovalQueue {...props} isInitialLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando");
    rerender(<ApprovalQueue {...props} isInitialLoading={false} loadError="Sin conexión" />);
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(props.onRetry).toHaveBeenCalled();
  });
});

describe("ApprovalEvidenceDialog", () => {
  it("muestra previews y cierra con Escape", () => {
    const onClose = vi.fn();
    render(<ApprovalEvidenceDialog activity={activity()} evidence={[{ id: "e1", activityId: "p1", fileName: "foto.png", contentType: "image/png", storageUrl: "/foto.png", uploadedBy: "Equipo" }]} onClose={onClose} />);
    expect(screen.getByRole("img", { name: "foto.png" })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});

function activity(): Activity { return { id: "p1", requirementId: "r1", productId: "PROD-1", requirementTypeId: "r", requirementType: "Diseño", strategicObjective: "Marca", targetAudienceId: "t", targetAudience: "Todos", productTypeId: "p", productType: "Video", diffusionChannelId: "d", diffusionChannel: "Web", mainKpiId: "k", mainKpi: "Alcance", productResponsible: "tech@example.com", observations: "", status: "PendingApproval", statusId: "s" }; }

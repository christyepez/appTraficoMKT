import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AgendaForm } from "./AgendaForm";
import { AgendaList } from "./AgendaList";

describe("AgendaForm", () => {
  it("valida fechas y crea un bloque", async () => {
    const user = userEvent.setup(); const onSave = vi.fn().mockResolvedValue(true); const onClose = vi.fn();
    render(<AgendaForm item={null} activities={[activity()]} technicians={[technician()]} selectedTechnician="tech@example.com" pending={false} onSave={onSave} onClose={onClose} />);
    await user.selectOptions(screen.getByLabelText("Producto"), "p1");
    await user.type(screen.getByLabelText("Inicio"), "2026-01-02T10:00"); await user.type(screen.getByLabelText("Fin"), "2026-01-02T09:00");
    await user.click(screen.getByRole("button", { name: "Guardar" })); expect(await screen.findByRole("alert")).toHaveTextContent("posterior");
    await user.clear(screen.getByLabelText(/^Fin/)); await user.type(screen.getByLabelText(/^Fin/), "2026-01-02T12:00"); await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onSave).toHaveBeenCalledWith(null, expect.objectContaining({ activityId: "p1" })); expect(onClose).toHaveBeenCalled();
  });
});

describe("AgendaList", () => {
  it("diferencia reservas automáticas y manuales", async () => {
    const user = userEvent.setup(); const onEdit = vi.fn(); const onDelete = vi.fn();
    render(<AgendaList items={[item(), item({ id: "auto-p1-2026-01-01", title: "Automática" })]} pendingIds={new Set()} isLoading={false} loadError="" onRetry={vi.fn()} onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getByText("Reserva automática")).toBeInTheDocument(); await user.click(screen.getByRole("button", { name: "Editar Campaña" })); expect(onEdit).toHaveBeenCalled(); await user.click(screen.getByRole("button", { name: "Eliminar Campaña" })); expect(onDelete).toHaveBeenCalledWith("a1");
  });
  it("muestra carga, error y vacío", async () => { const props = { items: [], pendingIds: new Set<string>(), loadError: "", onRetry: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() }; const { rerender } = render(<AgendaList {...props} isLoading />); expect(screen.getByRole("status")).toBeInTheDocument(); rerender(<AgendaList {...props} isLoading={false} loadError="Sin conexión" />); await userEvent.click(screen.getByRole("button", { name: "Reintentar" })); expect(props.onRetry).toHaveBeenCalled(); rerender(<AgendaList {...props} isLoading={false} />); expect(screen.getByText(/No hay bloques/)).toBeInTheDocument(); });
});
function activity() { return { id: "p1", requirementId: "r1", productId: "PROD-1", requirementTypeId: "r", requirementType: "R", strategicObjective: "O", targetAudienceId: "t", targetAudience: "T", productTypeId: "p", productType: "Video", diffusionChannelId: "d", diffusionChannel: "Web", mainKpiId: "k", mainKpi: "K", productResponsible: "tech@example.com", observations: "", status: "InProgress", statusId: "s" }; }
function technician() { return { id: "t", name: "Tech", email: "tech@example.com", roles: ["Tecnico"], isActive: true }; }
function item(overrides: Record<string, unknown> = {}) { return { id: "a1", activityId: "p1", requirementId: "r1", productId: "PROD-1", productType: "Video", technicianName: "Tech", technicianEmail: "tech@example.com", startAt: "2026-01-01T08:00:00Z", endAt: "2026-01-01T10:00:00Z", title: "Campaña", notes: "Notas", ...overrides }; }

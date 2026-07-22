import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequirementCatalogs } from "../models/requirement.models";
import { RequirementForm } from "./RequirementForm";
import { RequirementList } from "./RequirementList";
import { RelatedProductsDialog } from "./RelatedProductsDialog";

const item = (id: string, name: string) => ({ id, code: id, name, isActive: true });
const catalogs: RequirementCatalogs = { faculties: [item("f", "Facultad")], careers: [{ ...item("cr", "Carrera"), facultyId: "f" }], campuses: [item("c", "Centro")], eventFormats: [item("e", "Presencial")] };
const onSave = vi.fn(), onSuccess = vi.fn(), onFeedback = vi.fn(), onCancel = vi.fn();

beforeEach(() => { vi.clearAllMocks(); onSave.mockResolvedValue(undefined); });
describe("RequirementForm", () => {
  it("valida el formulario vacío", async () => {
    const user = userEvent.setup(); renderForm(); await user.click(screen.getByRole("button", { name: "Crear" })); expect(await screen.findByText("Ingrese la actividad o evento.")).toHaveAttribute("role", "alert"); expect(onSave).not.toHaveBeenCalled();
  });
  it("crea con catálogos, filtra carreras y evita doble envío", async () => {
    const user = userEvent.setup(); renderForm(); await fill(user); await user.click(screen.getByRole("button", { name: "Crear" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(null, expect.objectContaining({ faculty: "Facultad", career: "Carrera", campus: "Centro", eventFormat: "Presencial" }))); expect(onSuccess).toHaveBeenCalledWith("Requerimiento creado correctamente.");
  }, 10_000);
  it("presenta error del servicio sin cerrar", async () => {
    onSave.mockRejectedValue(new Error("Servicio no disponible")); const user = userEvent.setup(); renderForm(); await fill(user); await user.click(screen.getByRole("button", { name: "Crear" })); expect(await screen.findByRole("alert", { name: "" })).toHaveTextContent("Servicio no disponible"); expect(onCancel).not.toHaveBeenCalled();
  }, 10_000);
  it("carga y actualiza un requerimiento existente", async () => {
    const user = userEvent.setup(); const existing = req("r1", "InAnalysis"); renderForm(existing); await waitFor(() => expect(screen.getByLabelText("Carrera")).toHaveValue("cr")); await user.clear(screen.getByLabelText("Objetivo del evento")); await user.type(screen.getByLabelText("Objetivo del evento"), "Objetivo actualizado"); await user.click(screen.getByRole("button", { name: "Guardar" })); await waitFor(() => expect(onSave).toHaveBeenCalledWith(existing, expect.objectContaining({ eventObjective: "Objetivo actualizado" })));
  });
});

describe("requirement presentation", () => {
  it("diferencia carga, filtros y permisos visibles", async () => {
    const props = listProps(); const { rerender } = render(<RequirementList {...props} loading />); expect(screen.getByRole("status")).toHaveTextContent("Cargando");
    rerender(<RequirementList {...props} />); expect(screen.getByText(/REQ-r1 - Feria/)).toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Editar requerimiento" })).not.toBeInTheDocument();
    rerender(<RequirementList {...props} canManage search="sin resultado" />); expect(screen.getByText(/No hay requerimientos/)).toBeInTheDocument();
  });
  it("muestra productos relacionados y estado vacío", () => {
    const requirement = req("r1", "Draft"); const { rerender } = render(<RelatedProductsDialog requirement={requirement} activities={[]} onClose={vi.fn()} />); expect(screen.getByText(/todavía no tiene productos/)).toBeInTheDocument();
    rerender(<RelatedProductsDialog requirement={requirement} activities={[{ id: "p", requirementId: "r1", productId: "PROD-1", productType: "Video", productResponsible: "Tech", status: "Approved" } as never]} onClose={vi.fn()} />); expect(screen.getByText("PROD-1")).toBeInTheDocument(); expect(screen.getByText("Aprobado")).toBeInTheDocument();
  });
});

function renderForm(requirement: ReturnType<typeof req> | null = null) { return render(<RequirementForm requirement={requirement} catalogs={catalogs} onSave={onSave} onSuccess={onSuccess} onFeedback={onFeedback} onCancel={onCancel} />); }
async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Actividad o evento"), "Feria"); await user.type(screen.getByLabelText("Correo del solicitante"), "owner@example.com"); await user.selectOptions(screen.getByLabelText("Facultad"), "f"); await user.selectOptions(screen.getByLabelText("Carrera"), "cr"); await user.selectOptions(screen.getByLabelText("Sede"), "c"); await user.type(screen.getByLabelText("Lugar"), "Auditorio"); await user.type(screen.getByLabelText("Fecha de inicio"), "2026-08-01"); await user.type(screen.getByLabelText("Fecha de fin"), "2026-08-02"); await user.type(screen.getByLabelText("Objetivo del evento"), "Objetivo"); await user.selectOptions(screen.getByLabelText("Formato del evento"), "e"); await user.type(screen.getByLabelText("Fecha de solicitud"), "2026-07-01");
}
function listProps() { return { requirements: [req("r1", "Draft")], search: "", showCompleted: false, loading: false, error: "", canManage: false, pendingIds: new Set<string>(), onRetry: vi.fn(), onProducts: vi.fn(), onStatus: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() }; }
function req(id: string, status: string) { return { id, code: `REQ-${id}`, activityOrEvent: "Feria", requestedBy: "owner@example.com", facultyId: "f", faculty: "Facultad", career: "Carrera", campusId: "c", campus: "Centro", place: "Auditorio", startDate: "2026-08-01", endDate: "2026-08-02", eventObjective: "Objetivo", eventFormatId: "e", eventFormat: "Presencial", requestDate: "2026-07-01", status, statusId: "s" }; }

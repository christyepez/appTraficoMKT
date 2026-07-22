import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuditFilters } from "./AuditFilters";
import { AuditList } from "./AuditList";
import { AuditWorkspace } from "./AuditWorkspace";

describe("audit components", () => {
  it("notifica filtros y actualización", async () => { const user = userEvent.setup(), onSource = vi.fn(), onSearch = vi.fn(), onRefresh = vi.fn(); render(<AuditFilters source="Todas" search="" refreshing={false} onSource={onSource} onSearch={onSearch} onRefresh={onRefresh} />); await user.selectOptions(screen.getByLabelText("Tracking"), "Productos"); await user.type(screen.getByLabelText("Buscar"), "ana"); await user.click(screen.getByRole("button", { name: "Actualizar" })); expect(onSource).toHaveBeenCalledWith("Productos"); expect(onSearch).toHaveBeenLastCalledWith("a"); expect(onRefresh).toHaveBeenCalled(); });
  it("diferencia carga, error y vacío", () => { const props = { rows: [], loading: true, error: "", onRetry: vi.fn() }; const view = render(<AuditList {...props} />); expect(screen.getByRole("status")).toHaveTextContent("Cargando"); view.rerender(<AuditList {...props} loading={false} error="Sin auditoría" />); expect(screen.getByRole("alert")).toHaveTextContent("Sin auditoría"); view.rerender(<AuditList {...props} loading={false} />); expect(screen.getByText(/Sin eventos/)).toBeInTheDocument(); });
  it("renderiza detalle seguro y datos incompletos", async () => { const user = userEvent.setup(); render(<AuditList rows={[row()]} loading={false} error="" onRetry={vi.fn()} />); expect(screen.getByText("Evento sin identificador")).toBeInTheDocument(); await user.click(screen.getByText("Ver detalle del evento")); expect(screen.getByText(/\[OCULTO\]/)).toBeInTheDocument(); expect(screen.queryByText(/abc/)).not.toBeInTheDocument(); });
  it("muestra resumen y advertencia parcial", () => { render(<AuditWorkspace workspace={workspace()} />); expect(screen.getByText("Total eventos").parentElement).toHaveTextContent("1"); expect(screen.getByText(/Datos parciales/)).toBeInTheDocument(); });
});
function row() { return { id: "1", source: "Aprobaciones", entityId: "", decision: "Approved", action: "Evento sin identificador", performedBy: "Ana", payloadJson: '{"token":"abc"}', occurredAt: "invalid" } as const; }
function workspace() { const value = row(); return { rows: [value], filteredRows: [value], source: "Todas", setSource: vi.fn(), search: "", setSearch: vi.fn(), warnings: ["Sin productos"], isLoading: false, isRefreshing: false, loadError: "", refresh: vi.fn().mockResolvedValue(undefined) } as never; }

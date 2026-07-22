import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Product } from "../models/product.models";
import { ProductFilters } from "./ProductFilters";
import { ProductList } from "./ProductList";
import { ProductWorkflowActions } from "./ProductWorkflowActions";

describe("ProductFilters", () => {
  it("notifica búsqueda, filtro e indicador de actualización", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onShowCompletedChange = vi.fn();
    render(<ProductFilters searchTerm="" showCompleted={false} isRefreshing onSearchChange={onSearchChange} onShowCompletedChange={onShowCompletedChange} />);

    await user.type(screen.getByLabelText("Buscar en seguimiento"), "video");
    await user.click(screen.getByLabelText("Ver productos finalizados"));
    expect(onSearchChange).toHaveBeenCalled();
    expect(onShowCompletedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("status")).toHaveTextContent("Actualizando productos");
  });
});

describe("ProductWorkflowActions", () => {
  it("habilita únicamente el siguiente paso del workflow", async () => {
    const user = userEvent.setup();
    const onChangeStatus = vi.fn();
    render(<ProductWorkflowActions product={product()} pending={false} onChangeStatus={onChangeStatus} onAttach={vi.fn()} />);

    const start = screen.getByRole("button", { name: "Cambiar producto a en progreso" });
    expect(start).toBeEnabled();
    expect(screen.getByRole("button", { name: "Adjuntar evidencia o archivo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enviar producto a aprobación" })).toBeDisabled();
    await user.click(start);
    expect(onChangeStatus).toHaveBeenCalledWith("product1", "start");
  });

  it("bloquea acciones pendientes y oculta el workflow aprobado", () => {
    const { rerender } = render(<ProductWorkflowActions product={product({ status: "EvidenceAttached" })} pending onChangeStatus={vi.fn()} onAttach={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Enviar producto a aprobación" })).toBeDisabled();
    rerender(<ProductWorkflowActions product={product({ status: "Approved" })} pending={false} onChangeStatus={vi.fn()} onAttach={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Enviar producto a aprobación" })).not.toBeInTheDocument();
  });
});

describe("ProductList", () => {
  it("diferencia carga, vacío, error y filtros sin coincidencias", async () => {
    const { rerender } = renderList({ isInitialLoading: true });
    expect(screen.getByRole("status")).toHaveTextContent("Cargando productos");

    rerender(list({ products: [], isInitialLoading: false }));
    expect(screen.getByText("Aún no hay productos registrados.")).toBeInTheDocument();

    rerender(list({ products: [product()], searchTerm: "inexistente", isInitialLoading: false }));
    expect(screen.getByText("No hay productos que coincidan con los filtros seleccionados.")).toBeInTheDocument();

    const onRetry = vi.fn();
    rerender(list({ products: [], loadError: "No hay conexión.", onRetry, isInitialLoading: false }));
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("pagina resultados y conserva callbacks de la tarjeta", async () => {
    const user = userEvent.setup();
    const products = Array.from({ length: 12 }, (_, index) => product({ id: `product${index + 1}`, productId: `PROD-${String(index + 1).padStart(4, "0")}` }));
    const onEdit = vi.fn();
    renderList({ products, onEdit });

    expect(screen.getByRole("article", { name: "PROD-0001 - Video" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "PROD-0011 - Video" })).not.toBeInTheDocument();
    await user.click(screen.getByTitle("Página siguiente"));
    expect(screen.getByRole("article", { name: "PROD-0011 - Video" })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Editar producto" })[0]);
    expect(onEdit).toHaveBeenCalledWith(products[10]);
  });

  it("separa productos activos de finalizados", () => {
    const products = [product(), product({ id: "approved", productId: "PROD-0002", status: "Approved" })];
    const { rerender } = renderList({ products });
    expect(screen.getByRole("article", { name: "PROD-0001 - Video" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "PROD-0002 - Video" })).not.toBeInTheDocument();

    rerender(list({ products, showCompleted: true }));
    expect(screen.getByRole("article", { name: "PROD-0002 - Video" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar producto" })).not.toBeInTheDocument();
  });
});

const callbacks = {
  onRetry: vi.fn(),
  onChangeStatus: vi.fn(),
  onAttach: vi.fn(),
  onViewEvidence: vi.fn(),
  onViewApprovals: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn()
};

function renderList(overrides: Partial<React.ComponentProps<typeof ProductList>> = {}) {
  return render(list(overrides));
}

function list(overrides: Partial<React.ComponentProps<typeof ProductList>> = {}) {
  return <ProductList products={[product()]} evidence={[]} searchTerm="" showCompleted={false} isInitialLoading={false} loadError="" pendingProductIds={new Set()} {...callbacks} {...overrides} />;
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "product1", requirementId: "req1", productId: "PROD-0001", requirementTypeId: "rt1", requirementType: "Diseño", strategicObjective: "Difusión", targetAudienceId: "ta1", targetAudience: "Estudiantes", productTypeId: "pt1", productType: "Video", diffusionChannelId: "dc1", diffusionChannel: "Instagram", mainKpiId: "k1", mainKpi: "Alcance", productResponsible: "tech@example.com", observations: "Campaña", status: "Todo", statusId: "s1", ...overrides
  };
}

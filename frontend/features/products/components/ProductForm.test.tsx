import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Requirement } from "../../../shared/models/api.models";
import type { Product, ProductCatalogs, Technician } from "../models/product.models";
import { ProductForm } from "./ProductForm";

const requirements = [{ id: "req1", code: "REQ-001", activityOrEvent: "Feria institucional" }] as Requirement[];
const catalogs: ProductCatalogs = {
  requirementTypes: [{ id: "rt1", type: "TipoRequerimiento", code: "RT", name: "Campaña", isActive: true }],
  targetAudiences: [{ id: "ta1", type: "PublicoObjetivo", code: "TA", name: "Estudiantes", isActive: true }],
  productTypes: [{ id: "pt1", type: "TipoProducto", code: "PT", name: "Video", isActive: true }],
  diffusionChannels: [{ id: "dc1", type: "CanalDifusion", code: "DC", name: "Redes", isActive: true }],
  mainKpis: [{ id: "kpi1", type: "KpiPrincipal", code: "KPI", name: "Alcance", isActive: true }]
};
const technicians: Technician[] = [{ id: "tech1", name: "Técnico Uno", email: "tecnico@example.com", roles: ["Tecnico"], isActive: true }];

const onSave = vi.fn();
const onSuccess = vi.fn();
const onFeedback = vi.fn();
const onCancel = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  onSave.mockResolvedValue(undefined);
});

describe("ProductForm", () => {
  it("renderiza el alta con código sugerido y cierre accesible", () => {
    renderForm();
    expect(screen.getByRole("dialog", { name: "Producto o actividad" })).toBeInTheDocument();
    expect(screen.getByLabelText("Id producto")).toHaveValue("PROD-0002");
    expect(screen.getByRole("button", { name: "Cerrar formulario" })).toBeInTheDocument();
  });

  it("muestra validaciones accesibles antes de guardar", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "Crear producto" }));
    expect(await screen.findByText("Seleccione un requerimiento.")).toHaveAttribute("role", "alert");
    expect(screen.getByText("Seleccione el responsable del producto.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("crea un producto con el payload tipado y nombres de catálogo", async () => {
    const user = userEvent.setup();
    renderForm();
    await completeRequiredFields(user);
    await user.type(screen.getByLabelText("Objetivo estratégico"), "Posicionamiento");
    await user.type(screen.getByLabelText("Observaciones"), "Publicar esta semana");
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(null, expect.objectContaining({
      requirementId: "req1",
      productId: "PROD-0002",
      requirementType: "Campaña",
      targetAudience: "Estudiantes",
      productType: "Video",
      diffusionChannel: "Redes",
      mainKpi: "Alcance",
      productResponsible: "tecnico@example.com",
      strategicObjective: "Posicionamiento"
    }));
    expect(await screen.findByRole("status")).toHaveTextContent("Producto creado correctamente.");
    expect(onSuccess).toHaveBeenCalledWith("Producto creado correctamente.");
  });

  it("carga y guarda los valores de edición", async () => {
    const user = userEvent.setup();
    const product = existingProduct();
    renderForm(product);
    expect(screen.getByRole("dialog", { name: "Editar producto" })).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo producto")).toHaveValue("pt1");
    await user.clear(screen.getByLabelText("Observaciones"));
    await user.type(screen.getByLabelText("Observaciones"), "Observación actualizada");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(product, expect.objectContaining({ observations: "Observación actualizada" })));
    expect(onSuccess).toHaveBeenCalledWith("Producto editado correctamente.");
  });

  it("presenta el error del servicio y conserva el formulario", async () => {
    const user = userEvent.setup();
    onSave.mockRejectedValue(new Error("El servicio no está disponible."));
    renderForm();
    await completeRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(await screen.findByRole("alert", { name: "" })).toHaveTextContent("El servicio no está disponible.");
    expect(onFeedback).toHaveBeenCalledWith("El servicio no está disponible.", "error");
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("bloquea acciones mientras el guardado está pendiente", async () => {
    const user = userEvent.setup();
    let resolveSave!: () => void;
    onSave.mockReturnValue(new Promise<void>((resolve) => { resolveSave = resolve; }));
    renderForm();
    await completeRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(await screen.findByRole("button", { name: "Guardando" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    resolveSave();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  }, 10_000);
});

function renderForm(product: Product | null = null) {
  return render(
    <ProductForm
      product={product}
      suggestedProductId="PROD-0002"
      showProductIdField
      requirements={requirements}
      catalogs={catalogs}
      technicians={technicians}
      onSave={onSave}
      onSuccess={onSuccess}
      onFeedback={onFeedback}
      onCancel={onCancel}
    />
  );
}

async function completeRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Id requerimiento"), "req1");
  await user.selectOptions(screen.getByLabelText("Tipo requerimiento"), "rt1");
  await user.selectOptions(screen.getByLabelText("Público objetivo"), "ta1");
  await user.selectOptions(screen.getByLabelText("Tipo producto"), "pt1");
  await user.selectOptions(screen.getByLabelText("Canal difusión"), "dc1");
  await user.selectOptions(screen.getByLabelText("KPI principal"), "kpi1");
  await user.selectOptions(screen.getByLabelText("Responsable producto"), "tecnico@example.com");
}

function existingProduct(): Product {
  return {
    id: "product1",
    requirementId: "req1",
    productId: "PROD-0001",
    requirementTypeId: "rt1",
    requirementType: "Campaña",
    strategicObjective: "Posicionamiento",
    targetAudienceId: "ta1",
    targetAudience: "Estudiantes",
    productTypeId: "pt1",
    productType: "Video",
    diffusionChannelId: "dc1",
    diffusionChannel: "Redes",
    mainKpiId: "kpi1",
    mainKpi: "Alcance",
    productResponsible: "tecnico@example.com",
    productDeliveryDate: "2026-08-01",
    observations: "Original",
    status: "Todo",
    statusId: "status1"
  };
}

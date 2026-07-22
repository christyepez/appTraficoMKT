import { describe, expect, it } from "vitest";
import type { ProductCatalogs } from "../models/product.models";
import { mapProductFormToPayload, productFormSchema, type ProductFormValues } from "./product.schema";

const catalogs: ProductCatalogs = {
  requirementTypes: [{ id: "rt1", type: "TipoRequerimiento", code: "RT", name: "Campaña", isActive: true }],
  targetAudiences: [{ id: "ta1", type: "PublicoObjetivo", code: "TA", name: "Estudiantes", isActive: true }],
  productTypes: [{ id: "pt1", type: "TipoProducto", code: "PT", name: "Video", isActive: true }],
  diffusionChannels: [{ id: "dc1", type: "CanalDifusion", code: "DC", name: "Redes", isActive: true }],
  mainKpis: [{ id: "kpi1", type: "KpiPrincipal", code: "KPI", name: "Alcance", isActive: true }]
};

const values: ProductFormValues = {
  requirementId: "req1",
  productId: "PROD-0002",
  requirementTypeId: "rt1",
  strategicObjective: "Posicionamiento",
  targetAudienceId: "ta1",
  productTypeId: "pt1",
  diffusionChannelId: "dc1",
  mainKpiId: "kpi1",
  productResponsible: "tecnico@example.com",
  productDeliveryDate: "",
  observations: "Prioridad alta"
};

describe("productFormSchema", () => {
  it("rechaza selecciones requeridas vacías", () => {
    const result = productFormSchema.safeParse({ ...values, requirementId: "", productResponsible: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.message)).toEqual(expect.arrayContaining(["Seleccione un requerimiento.", "Seleccione el responsable del producto."]));
  });

  it("mapea IDs a nombres de catálogo y normaliza opcionales", () => {
    expect(mapProductFormToPayload(values, catalogs, false)).toEqual(expect.objectContaining({
      productId: null,
      requirementType: "Campaña",
      targetAudience: "Estudiantes",
      productType: "Video",
      diffusionChannel: "Redes",
      mainKpi: "Alcance",
      productDeliveryDate: null
    }));
  });

  it("detiene el guardado si un catálogo quedó desactualizado", () => {
    expect(() => mapProductFormToPayload(values, { ...catalogs, productTypes: [] }, true)).toThrow("El catálogo seleccionado ya no está disponible");
  });
});

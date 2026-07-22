import { z } from "zod";
import type { ProductCatalogs, SaveProductPayload } from "../models/product.models";

const requiredSelection = (message: string) => z.string().trim().min(1, message);

export const productFormSchema = z.object({
  requirementId: requiredSelection("Seleccione un requerimiento."),
  productId: z.string().trim(),
  requirementTypeId: requiredSelection("Seleccione el tipo de requerimiento."),
  strategicObjective: z.string().trim(),
  targetAudienceId: requiredSelection("Seleccione el público objetivo."),
  productTypeId: requiredSelection("Seleccione el tipo de producto."),
  diffusionChannelId: requiredSelection("Seleccione el canal de difusión."),
  mainKpiId: requiredSelection("Seleccione el KPI principal."),
  productResponsible: requiredSelection("Seleccione el responsable del producto."),
  productDeliveryDate: z.string(),
  observations: z.string().trim()
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export function mapProductFormToPayload(values: ProductFormValues, catalogs: ProductCatalogs, showProductIdField: boolean): SaveProductPayload {
  return {
    requirementId: values.requirementId,
    productId: showProductIdField ? values.productId : null,
    requirementTypeId: values.requirementTypeId,
    requirementType: catalogName(catalogs.requirementTypes, values.requirementTypeId),
    strategicObjective: values.strategicObjective,
    targetAudienceId: values.targetAudienceId,
    targetAudience: catalogName(catalogs.targetAudiences, values.targetAudienceId),
    productTypeId: values.productTypeId,
    productType: catalogName(catalogs.productTypes, values.productTypeId),
    diffusionChannelId: values.diffusionChannelId,
    diffusionChannel: catalogName(catalogs.diffusionChannels, values.diffusionChannelId),
    mainKpiId: values.mainKpiId,
    mainKpi: catalogName(catalogs.mainKpis, values.mainKpiId),
    productResponsible: values.productResponsible,
    productDeliveryDate: values.productDeliveryDate || null,
    observations: values.observations
  };
}

function catalogName(items: ProductCatalogs[keyof ProductCatalogs], id: string) {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error("El catálogo seleccionado ya no está disponible. Actualice e intente nuevamente.");
  return item.name;
}

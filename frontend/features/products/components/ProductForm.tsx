"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Requirement } from "../../../shared/models/api.models";
import type { Product, ProductCatalogs, SaveProductPayload, Technician } from "../models/product.models";
import { mapProductFormToPayload, productFormSchema, type ProductFormValues } from "../schemas/product.schema";
import { ProductSelectField } from "./ProductSelectField";
import { ProductDialog } from "./ProductDialog";
import styles from "./ProductForm.module.css";

type ProductFormProps = {
  product: Product | null;
  suggestedProductId: string;
  showProductIdField: boolean;
  requirements: Requirement[];
  catalogs: ProductCatalogs;
  technicians: Technician[];
  onSave: (product: Product | null, payload: SaveProductPayload) => Promise<unknown>;
  onSuccess: (message: string) => void | Promise<void>;
  onFeedback: (message: string, type: "success" | "error") => void;
  onCancel: () => void;
};

export function ProductForm({ product, suggestedProductId, showProductIdField, requirements, catalogs, technicians, onSave, onSuccess, onFeedback, onCancel }: ProductFormProps) {
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productDefaults(product, suggestedProductId)
  });

  async function submit(values: ProductFormValues) {
    setSubmitMessage(null);
    try {
      const payload = mapProductFormToPayload(values, catalogs, showProductIdField);
      await onSave(product, payload);
      const message = product ? "Producto editado correctamente." : "Producto creado correctamente.";
      setSubmitMessage({ type: "success", text: message });
      onFeedback(message, "success");
      await onSuccess(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el producto.";
      setSubmitMessage({ type: "error", text: message });
      onFeedback(message, "error");
    }
  }

  const responsibleOptions = technicianOptions(technicians, product);

  return (
    <ProductDialog labelledBy="product-form-title" onClose={onCancel} closeDisabled={isSubmitting}>
        <div className="card-head">
          <div>
            <h2 id="product-form-title">{product ? "Editar producto" : "Producto o actividad"}</h2>
            <p className={styles.intro}>Complete la información operativa del producto.</p>
          </div>
          <button autoFocus className="icon-button" type="button" title="Cerrar formulario" aria-label="Cerrar formulario" disabled={isSubmitting} onClick={onCancel}><X size={16} /></button>
        </div>
        <form className="form" onSubmit={handleSubmit(submit)} noValidate>
          <ProductSelectField
            label="Id requerimiento"
            name="requirementId"
            options={requirements.map((item) => ({ id: item.id, name: `${item.code} - ${item.activityOrEvent}` }))}
            register={register}
            error={errors.requirementId}
          />
          {showProductIdField && (
            <label className="field" htmlFor="productId">
              <span>Id producto</span>
              <input id="productId" {...register("productId")} readOnly title="Código secuencial generado automáticamente" />
            </label>
          )}
          <ProductSelectField label="Tipo requerimiento" name="requirementTypeId" options={catalogs.requirementTypes} register={register} error={errors.requirementTypeId} />
          <label className="field field-wide" htmlFor="strategicObjective"><span>Objetivo estratégico</span><textarea id="strategicObjective" {...register("strategicObjective")} /></label>
          <ProductSelectField label="Público objetivo" name="targetAudienceId" options={catalogs.targetAudiences} register={register} error={errors.targetAudienceId} />
          <ProductSelectField label="Tipo producto" name="productTypeId" options={catalogs.productTypes} register={register} error={errors.productTypeId} />
          <ProductSelectField label="Canal difusión" name="diffusionChannelId" options={catalogs.diffusionChannels} register={register} error={errors.diffusionChannelId} />
          <ProductSelectField label="KPI principal" name="mainKpiId" options={catalogs.mainKpis} register={register} error={errors.mainKpiId} />
          <ProductSelectField label="Responsable producto" name="productResponsible" options={responsibleOptions} register={register} error={errors.productResponsible} />
          <label className="field" htmlFor="productDeliveryDate"><span>Fecha entrega producto</span><input id="productDeliveryDate" type="date" {...register("productDeliveryDate")} /></label>
          <label className="field field-wide" htmlFor="observations"><span>Observaciones</span><textarea id="observations" {...register("observations")} /></label>
          {submitMessage?.type === "error" && <p className={styles.formError} role="alert">{submitMessage.text}</p>}
          {submitMessage?.type === "success" && <p className={styles.formStatus} role="status">{submitMessage.text}</p>}
          <div className="form-actions">
            <button className="button" title={product ? "Guardar cambios del producto" : "Crear producto para el requerimiento seleccionado"} disabled={isSubmitting}>
              {product ? <Save size={16} /> : <Plus size={16} />} {isSubmitting ? "Guardando" : product ? "Guardar" : "Crear producto"}
            </button>
            <button className="button secondary" type="button" title="Cancelar edición" disabled={isSubmitting} onClick={onCancel}><X size={16} /> Cancelar</button>
          </div>
        </form>
    </ProductDialog>
  );
}

function productDefaults(product: Product | null, suggestedProductId: string): ProductFormValues {
  return {
    requirementId: product?.requirementId ?? "",
    productId: product?.productId ?? suggestedProductId,
    requirementTypeId: product?.requirementTypeId ?? "",
    strategicObjective: product?.strategicObjective ?? "",
    targetAudienceId: product?.targetAudienceId ?? "",
    productTypeId: product?.productTypeId ?? "",
    diffusionChannelId: product?.diffusionChannelId ?? "",
    mainKpiId: product?.mainKpiId ?? "",
    productResponsible: product?.productResponsible ?? "",
    productDeliveryDate: product?.productDeliveryDate ?? "",
    observations: product?.observations ?? ""
  };
}

function technicianOptions(technicians: Technician[], product: Product | null) {
  const options = technicians.map((user) => ({ id: user.email, name: `${user.name} - ${user.email}` }));
  const current = product?.productResponsible;
  if (current && !technicians.some((user) => [user.email, user.name].includes(current))) options.unshift({ id: current, name: current });
  return options;
}

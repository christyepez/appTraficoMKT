import type { UseFormRegister } from "react-hook-form";
import type { BrandFormValues } from "../schemas/branding.schema";
import { ColorField } from "./ColorField";

export function GradientEditor({ kind, register }: { kind: "button" | "header" | "menu"; register: UseFormRegister<BrandFormValues> }) {
  const fields = kind === "button" ? { enabled: "useGradient", base: "primary", end: "gradientColor", direction: "gradientDirection", label: "botón principal" } as const : kind === "header" ? { enabled: "headerUseGradient", base: "headerColor", end: "headerGradientColor", direction: "headerGradientDirection", label: "cabecera" } as const : { enabled: "menuUseGradient", base: "menuColor", end: "menuGradientColor", direction: "menuGradientDirection", label: "menú" } as const;
  return <fieldset className="field field-wide"><legend>Degradado de {fields.label}</legend><div className="form"><ColorField label="Color inicial" name={fields.base} register={register}/><ColorField label="Color final" name={fields.end} register={register}/><label className="check-field"><input type="checkbox" {...register(fields.enabled)}/>Usar degradado</label><label className="field"><span>Dirección</span><select {...register(fields.direction)}><option value="135deg">Diagonal</option><option value="to right">Horizontal</option><option value="to bottom">Vertical</option></select></label></div></fieldset>;
}

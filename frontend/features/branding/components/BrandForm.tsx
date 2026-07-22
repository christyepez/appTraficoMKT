"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { BrandSettings } from "../models/branding.models";
import { brandSettingsSchema, type BrandFormValues } from "../schemas/branding.schema";
import { settingsForApi, settingsForForm } from "../utils/branding.utils";
import { BrandPreview } from "./BrandPreview";
import { ColorField } from "./ColorField";
import { GradientEditor } from "./GradientEditor";
import { LogoEditor } from "./LogoEditor";
import { TypographyEditor } from "./TypographyEditor";

const palette = [["accent","Acento"],["background","Fondo"],["surface","Paneles"],["foreground","Texto principal"],["muted","Texto secundario"],["line","Bordes"],["topbarText","Texto barra superior"],["primaryDark","Principal hover"],["buttonText","Texto botones"],["secondary","Secundario"],["secondaryText","Texto secundario botón"],["success","Éxito"],["warning","Advertencia"],["danger","Peligro"],["headerTitleColor","Color título"],["headerSubtitleColor","Color subtítulo"]] as const;
const functionalFlags = [["showProductIdField","Mostrar Id de producto"],["showPublicRequirementForm","Crear requerimiento sin login"],["showPublicRequirementFullPage","Formulario público completo"],["showLoginChatbot","Mostrar robot Puma"],["showDemoCredentials","Mostrar credenciales de prueba"],["showOffice365Login","Mostrar ingreso Office 365"]] as const;

export function BrandForm({ settings, saving, onSave, onRestore }: { settings: BrandSettings; saving: boolean; onSave: (value: BrandSettings) => Promise<unknown>; onRestore: () => Promise<unknown> }) {
  const [submitError,setSubmitError]=useState("");
  const {register,handleSubmit,control,setValue,reset,formState:{errors,isSubmitting,isDirty}}=useForm<BrandFormValues>({resolver:zodResolver(brandSettingsSchema),defaultValues:settingsForForm(settings)});
  useEffect(()=>reset(settingsForForm(settings)),[settings,reset]);
  const preview=useWatch({control}) as BrandSettings;
  async function submit(value:BrandFormValues){setSubmitError("");try{await onSave(settingsForApi(value));}catch(cause){setSubmitError(cause instanceof Error?cause.message:"No se pudo guardar la marca.");}}
  return <><form className="panel" noValidate onSubmit={handleSubmit(submit)}><div className="card-head"><div><h2>Manejo Marca</h2><p>Configuración visual y opciones operativas separadas por sección.</p></div><span className="badge">{isDirty?"Cambios sin guardar":"Sin cambios"}</span></div><input type="hidden" {...register("brandVersion",{valueAsNumber:true})}/>
    <fieldset className="field field-wide top-space"><legend>Identidad institucional</legend><div className="form"><label className="field field-wide"><span>Título</span><input {...register("title")}/>{errors.title&&<small role="alert">{errors.title.message}</small>}</label><label className="field field-wide"><span>Subtítulo</span><input {...register("subtitle")}/></label><label className="check-field"><input type="checkbox" {...register("showHeaderTitle")}/>Mostrar título</label><label className="check-field"><input type="checkbox" {...register("showHeaderSubtitle")}/>Mostrar subtítulo</label><LogoEditor register={register} setValue={setValue}/></div></fieldset>
    <fieldset className="field field-wide"><legend>Paleta visual</legend><div className="form">{palette.map(([name,label])=><ColorField key={name} name={name} label={label} register={register}/>)}</div></fieldset>
    <GradientEditor kind="button" register={register}/><GradientEditor kind="header" register={register}/><GradientEditor kind="menu" register={register}/>
    <TypographyEditor register={register}/>
    <fieldset className="field field-wide"><legend>Menú</legend><div className="form"><label className="field"><span>Modo</span><select {...register("menuMode")}><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select></label><label className="check-field"><input type="checkbox" {...register("menuCollapsed")}/>Menú plegado</label><label className="check-field"><input type="checkbox" {...register("mobileMenuCollapsed")}/>Menú móvil plegado</label><label className="field field-wide"><span>Orden de rutas</span><input {...register("menuOrder")}/></label></div></fieldset>
    <fieldset className="field field-wide"><legend>Opciones operativas</legend><p className="hint">Estas opciones no son identidad visual; se conservan en el mismo contrato API por compatibilidad.</p><div className="form"><label className="field"><span>Inicio jornada</span><input type="time" {...register("workdayStartTime")}/></label><label className="field"><span>Fin jornada</span><input type="time" {...register("workdayEndTime")}/>{errors.workdayEndTime&&<small role="alert">{errors.workdayEndTime.message}</small>}</label><label className="field"><span>Días para replanificar</span><input type="number" {...register("replanningWindowDays",{valueAsNumber:true})}/></label>{functionalFlags.map(([name,label])=><label className="check-field" key={name}><input type="checkbox" {...register(name)}/>{label}</label>)}</div></fieldset>
    <fieldset className="field field-wide"><legend>Períodos de activación pública</legend><div className="form">{[["publicRequirementFormActiveFrom","Requerimiento desde"],["publicRequirementFormActiveUntil","Requerimiento hasta"],["publicRequirementFullPageActiveFrom","Formulario desde"],["publicRequirementFullPageActiveUntil","Formulario hasta"],["loginChatbotActiveFrom","Robot desde"],["loginChatbotActiveUntil","Robot hasta"]].map(([name,label])=><label className="field" key={name}><span>{label}</span><input type="datetime-local" {...register(name as "loginChatbotActiveUntil")}/></label>)}</div></fieldset>
    {submitError&&<p role="alert">{submitError}</p>}<div className="form-actions"><button className="button" disabled={saving||isSubmitting}>{saving||isSubmitting?"Guardando":"Guardar"}</button><button className="button secondary" type="button" disabled={saving||isSubmitting||!isDirty} onClick={()=>reset(settingsForForm(settings))}>Cancelar cambios</button><button className="button secondary" type="button" disabled={saving||isSubmitting} onClick={()=>void onRestore()}>Restaurar valores institucionales</button></div>
  </form><BrandPreview settings={preview}/></>;
}

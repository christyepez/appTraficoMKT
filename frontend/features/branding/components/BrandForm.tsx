"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { RotateCcw, X } from "lucide-react";
import { AccessibleDialog } from "../../../shared/components/AccessibleDialog";
import type { BrandSettings } from "../models/branding.models";
import { brandSettingsSchema, type BrandFormValues } from "../schemas/branding.schema";
import { settingsForApi, settingsForForm } from "../utils/branding.utils";
import { BrandPreview } from "./BrandPreview";
import { BrandCategoryFields } from "./BrandCategoryFields";
import { BrandCategoryGrid, categoryTitle, type BrandCategory } from "./BrandCategoryGrid";
import styles from "../styles/Branding.module.css";

export function BrandForm({ settings, saving, onSave, onRestore }: { settings: BrandSettings; saving: boolean; onSave: (value: BrandSettings) => Promise<unknown>; onRestore: () => Promise<unknown> }) {
  const [submitError,setSubmitError]=useState("");
  const [activeCategory,setActiveCategory]=useState<BrandCategory|null>(null);
  const [categorySnapshot,setCategorySnapshot]=useState<BrandFormValues|null>(null);
  const {register,handleSubmit,control,setValue,getValues,reset,formState:{errors,isSubmitting,isDirty}}=useForm<BrandFormValues>({resolver:zodResolver(brandSettingsSchema),defaultValues:settingsForForm(settings)});
  useEffect(()=>reset(settingsForForm(settings)),[settings,reset]);
  const preview=useWatch({control}) as BrandSettings;
  function openCategory(category:BrandCategory){setCategorySnapshot(getValues());setActiveCategory(category);setSubmitError("");}
  function closeCategory(){if(categorySnapshot)reset(categorySnapshot);setActiveCategory(null);setCategorySnapshot(null);setSubmitError("");}
  async function submit(value:BrandFormValues){setSubmitError("");try{await onSave(settingsForApi(value));setActiveCategory(null);setCategorySnapshot(null);}catch(cause){setSubmitError(cause instanceof Error?cause.message:"No se pudo guardar la marca.");}}
  return <><form className="panel" noValidate onSubmit={handleSubmit(submit)}><div className="card-head"><div><h2>Manejo de marca</h2><p>Seleccione una tarjeta para ingresar a sus configuraciones.</p></div><div className="actions"><span className="badge">{isDirty?"Cambios sin guardar":"Sin cambios"}</span><button className="button secondary" type="button" disabled={saving||isSubmitting} onClick={()=>void onRestore()}><RotateCcw aria-hidden="true" size={16}/> Restaurar</button></div></div><input type="hidden" {...register("brandVersion",{valueAsNumber:true})}/><div className="top-space"><BrandCategoryGrid settings={preview} onSelect={openCategory}/></div>
    {activeCategory&&<AccessibleDialog labelledBy="brand-category-title" onClose={closeCategory} closeDisabled={saving||isSubmitting} panelClassName={`modal-panel-wide ${styles.editorDialog}`}><div className="card-head"><div><h2 id="brand-category-title">{categoryTitle(activeCategory)}</h2><p>Los cambios se reflejan inmediatamente en la vista previa.</p></div><button autoFocus className="icon-button" type="button" aria-label="Cerrar configuración" disabled={saving||isSubmitting} onClick={closeCategory}><X aria-hidden="true" size={16}/></button></div><div className={`form top-space ${styles.editorFields}`}><BrandCategoryFields category={activeCategory} values={preview} register={register} setValue={setValue}/></div>{errors.title&&<p role="alert">{errors.title.message}</p>}{errors.subtitle&&<p role="alert">{errors.subtitle.message}</p>}{errors.workdayEndTime&&<p role="alert">{errors.workdayEndTime.message}</p>}{submitError&&<p role="alert">{submitError}</p>}<div className="form-actions"><button className="button" disabled={saving||isSubmitting}>{saving||isSubmitting?"Guardando":"Guardar"}</button><button className="button secondary" type="button" disabled={saving||isSubmitting} onClick={closeCategory}>Cancelar</button></div></AccessibleDialog>}
  </form><BrandPreview settings={preview}/></>;
}

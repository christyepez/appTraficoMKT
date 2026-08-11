"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Plus, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormField as Field } from "../../../shared/components/FormField";
import type { Requirement, RequirementCatalogs, SaveRequirementPayload } from "../models/requirement.models";
import { buildRequirementFormSchema } from "../domain/requirement-form.schema";
import { mapRequirementFormToLegacyPayload, requirementFormDefaults } from "../domain/requirement-form.mappers";
import type { RequirementFormValues } from "../domain/requirement-form.types";
import { wordCount } from "../domain/requirement-form.utils";
import { RequirementDialog } from "./RequirementDialog";
import styles from "../styles/Requirements.module.css";

type Props = {
  requirement: Requirement | null;
  catalogs: RequirementCatalogs;
  layout?: "singlePage" | "stepper";
  onSave: (requirement: Requirement | null, payload: SaveRequirementPayload) => Promise<unknown>;
  onSuccess: (message: string) => void;
  onFeedback: (message: string, type: "success" | "error") => void;
  onCancel: () => void;
};

export function RequirementForm({ requirement, catalogs, layout = "singlePage", onSave, onSuccess, onFeedback, onCancel }: Props) {
  const [submitError, setSubmitError] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [step, setStep] = useState(0);
  const editable = !requirement || (requirement.canEdit ?? requirement.status === "Draft");
  const { register, handleSubmit, control, setValue, trigger, formState: { errors, isSubmitting } } = useForm<RequirementFormValues>({
    resolver: zodResolver(buildRequirementFormSchema(catalogs)),
    defaultValues: requirementFormDefaults(requirement)
  });
  const facultyId = useWatch({ control, name: "facultyId" });
  const careerId = useWatch({ control, name: "careerId" });
  const eventObjective = useWatch({ control, name: "eventObjective" });
  const activityFormatDescription = useWatch({ control, name: "activityFormatDescription" });
  const careers = useMemo(() => catalogs.careers.filter((item) => item.facultyId === facultyId), [catalogs.careers, facultyId]);

  useEffect(() => {
    if (!requirement || !facultyId) return;
    const current = requirement.careerId
      ? catalogs.careers.find((item) => item.id === requirement.careerId)
      : catalogs.careers.find((item) => item.facultyId === facultyId && item.name === requirement.career);
    if (current) setValue("careerId", current.id);
  }, [catalogs.careers, facultyId, requirement, setValue]);

  async function submit(values: RequirementFormValues) {
    if (!editable) return;
    setSubmitError("");
    try {
      await onSave(requirement, { ...mapRequirementFormToLegacyPayload({ ...values, attachments }, catalogs, requirement?.requestDate), attachments });
      const message = requirement ? "Requerimiento editado correctamente." : "Requerimiento creado correctamente.";
      onFeedback(message, "success");
      setStep(0);
      onSuccess(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el requerimiento.";
      setSubmitError(message);
      onFeedback(message, "error");
    }
  }

  async function nextStep() {
    if (await trigger(requirementStepFields(step))) setStep((current) => Math.min(current + 1, requirementSteps.length - 1));
  }

  return (
    <RequirementDialog labelledBy="requirement-form-title" onClose={onCancel} closeDisabled={isSubmitting}>
      <div className="card-head">
        <div><h2 id="requirement-form-title">{requirement ? "Editar requerimiento" : "Registro de requerimiento"}</h2><p>Complete la información de la solicitud.</p></div>
        <button autoFocus className="icon-button" type="button" aria-label="Cerrar formulario" disabled={isSubmitting} onClick={onCancel}><X size={16} /></button>
      </div>
      <form className="form" onSubmit={handleSubmit(submit)} noValidate>
        {!editable && <p className={styles.error} role="status">Este requerimiento ya no está en borrador y solo puede consultarse.</p>}
        {layout === "stepper" && <p className="hint" role="status">Paso {step + 1} de {requirementSteps.length}: {requirementSteps[step]}</p>}
        {showRequirementStep(layout, step, 0) && <Field idPrefix="requirement" errorClassName={styles.fieldError} label="Actividad o evento" error={errors.activityOrEvent?.message}><input disabled={!editable} {...register("activityOrEvent")} /></Field>}
        {showRequirementStep(layout, step, 1) && <><Field label="Nombre del solicitante" error={errors.requesterName?.message}><input disabled={!editable} {...register("requesterName")} /></Field>
        <Field label="Correo del solicitante" error={errors.requesterEmail?.message}><input disabled={!editable} type="email" {...register("requesterEmail")} /></Field></>}
        {showRequirementStep(layout, step, 2) && <><Field label="Facultad" error={errors.facultyId?.message}><select disabled={!editable} {...register("facultyId", { onChange: () => setValue("careerId", "") })}><option value="">Seleccione…</option>{catalogs.faculties.map(option)}</select></Field>
        <Field label="Carrera" error={errors.careerId?.message}><select {...register("careerId")} disabled={!editable || !facultyId}><option value="">Seleccione…</option>{careers.map(option)}</select></Field>
        <Field label="Sede" error={errors.campusId?.message}><select disabled={!editable} {...register("campusId")}><option value="">Seleccione…</option>{catalogs.campuses.map(option)}</select></Field>
        <Field label="Lugar" error={errors.place?.message}><input disabled={!editable} {...register("place")} /></Field></>}
        {showRequirementStep(layout, step, 3) && <><Field label="Fecha y hora de inicio" error={errors.startAt?.message}><input disabled={!editable} type="datetime-local" {...register("startAt")} /></Field>
        <Field label="Fecha y hora de fin" error={errors.endAt?.message}><input disabled={!editable} type="datetime-local" {...register("endAt")} /></Field></>}
        {showRequirementStep(layout, step, 4) && <><Field label="Público" error={errors.audienceType?.message}><select disabled={!editable} {...register("audienceType")}><option value="internal">Interno</option><option value="external">Externo</option><option value="mixed">Mixto</option></select></Field>
        <Field label="Formato del evento" error={errors.eventFormatId?.message}><select disabled={!editable} {...register("eventFormatId")}><option value="">Seleccione…</option>{catalogs.eventFormats.map(option)}</select></Field></>}
        {showRequirementStep(layout, step, 5) && <label className="field field-wide" htmlFor="requirement-event-objective"><span>Objetivo del evento</span><textarea id="requirement-event-objective" aria-label="Objetivo del evento" disabled={!editable} aria-invalid={Boolean(errors.eventObjective) || undefined} {...register("eventObjective")} />{errors.eventObjective && <small className={styles.fieldError} role="alert">{errors.eventObjective.message}</small>}<small>{wordCount(eventObjective)} de 70 palabras</small></label>}
        {showRequirementStep(layout, step, 6) && <label className="field field-wide" htmlFor="requirement-format-description"><span>Formato o dinámica de la actividad</span><textarea id="requirement-format-description" aria-label="Formato o dinámica de la actividad" disabled={!editable} aria-invalid={Boolean(errors.activityFormatDescription) || undefined} {...register("activityFormatDescription")} />{errors.activityFormatDescription && <small className={styles.fieldError} role="alert">{errors.activityFormatDescription.message}</small>}<small>{wordCount(activityFormatDescription)} de 70 palabras</small></label>}
        {showRequirementStep(layout, step, 7) && <label className="field field-wide" htmlFor="requirement-attachments"><span>Adjuntos del requerimiento</span>
          <input id="requirement-attachments" aria-label="Adjuntos del requerimiento" disabled={!editable} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" aria-invalid={Boolean(errors.attachments) || undefined} onChange={(event) => { const files = Array.from(event.target.files ?? []); setAttachments(files); setValue("attachments", files, { shouldValidate: true }); }} />
          {errors.attachments && <small className={styles.fieldError} role="alert">{errors.attachments.message}</small>}
          <small>{attachments.length ? `${attachments.length} archivo(s) seleccionado(s)` : "Máximo 5 archivos, 5 MB por archivo."}</small>
        </label>}
        {showRequirementStep(layout, step, 8) && <section className={styles.summary} aria-label="Resumen del requerimiento"><strong>Resumen</strong><span>{facultyId ? `${catalogs.faculties.find((item) => item.id === facultyId)?.name ?? ""} / ${careers.find((item) => item.id === careerId)?.name ?? ""}` : "Seleccione facultad y carrera."}</span></section>}
        {submitError && <p className={styles.error} role="alert">{submitError}</p>}
        <div className="form-actions">
          {layout === "stepper" && <button className="button secondary" type="button" disabled={step === 0 || isSubmitting} onClick={() => setStep((current) => Math.max(current - 1, 0))}><ChevronLeft size={16} /> Anterior</button>}
          {layout === "stepper" && step < requirementSteps.length - 1
            ? <button className="button" type="button" disabled={isSubmitting || !editable} onClick={() => void nextStep()}><ChevronRight size={16} /> Siguiente</button>
            : <button className="button" disabled={isSubmitting || !editable}>{requirement ? <Save size={16} /> : <Plus size={16} />} {isSubmitting ? "Guardando" : requirement ? "Guardar" : "Crear"}</button>}
          <button className="button secondary" type="button" disabled={isSubmitting} onClick={onCancel}><X size={16} /> Cancelar</button>
        </div>
      </form>
    </RequirementDialog>
  );
}

function option(item: { id: string; name: string }) {
  return <option key={item.id} value={item.id}>{item.name}</option>;
}

const requirementSteps = ["Actividad", "Solicitante", "Ubicación", "Fechas", "Público", "Objetivo", "Formato", "Adjuntos", "Resumen"] as const;

function showRequirementStep(layout: "singlePage" | "stepper", current: number, expected: number) {
  return layout === "singlePage" || current === expected;
}

function requirementStepFields(step: number): (keyof RequirementFormValues)[] {
  if (step === 0) return ["activityOrEvent"];
  if (step === 1) return ["requesterName", "requesterEmail"];
  if (step === 2) return ["facultyId", "careerId", "campusId", "place"];
  if (step === 3) return ["startAt", "endAt"];
  if (step === 4) return ["audienceType", "eventFormatId"];
  if (step === 5) return ["eventObjective"];
  if (step === 6) return ["activityFormatDescription"];
  if (step === 7) return ["attachments"];
  return [];
}

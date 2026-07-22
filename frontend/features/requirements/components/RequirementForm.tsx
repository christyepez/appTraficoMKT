"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormField as Field } from "../../../shared/components/FormField";
import type { Requirement, RequirementCatalogs, SaveRequirementPayload } from "../models/requirement.models";
import { mapRequirementFormToPayload, requirementDefaults, requirementFormSchema, type RequirementFormValues } from "../schemas/requirement.schema";
import { RequirementDialog } from "./RequirementDialog";
import styles from "../styles/Requirements.module.css";

type Props = {
  requirement: Requirement | null;
  catalogs: RequirementCatalogs;
  onSave: (requirement: Requirement | null, payload: SaveRequirementPayload) => Promise<unknown>;
  onSuccess: (message: string) => void;
  onFeedback: (message: string, type: "success" | "error") => void;
  onCancel: () => void;
};

export function RequirementForm({ requirement, catalogs, onSave, onSuccess, onFeedback, onCancel }: Props) {
  const [submitError, setSubmitError] = useState("");
  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues: requirementDefaults(requirement)
  });
  const facultyId = useWatch({ control, name: "facultyId" });
  const careers = useMemo(() => catalogs.careers.filter((item) => item.facultyId === facultyId), [catalogs.careers, facultyId]);

  useEffect(() => {
    if (!requirement || !facultyId) return;
    const current = catalogs.careers.find((item) => item.facultyId === facultyId && item.name === requirement.career);
    if (current) setValue("careerId", current.id);
  }, [catalogs.careers, facultyId, requirement, setValue]);

  async function submit(values: RequirementFormValues) {
    setSubmitError("");
    try {
      await onSave(requirement, mapRequirementFormToPayload(values, catalogs));
      const message = requirement ? "Requerimiento editado correctamente." : "Requerimiento creado correctamente.";
      onFeedback(message, "success");
      onSuccess(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el requerimiento.";
      setSubmitError(message);
      onFeedback(message, "error");
    }
  }

  return (
    <RequirementDialog labelledBy="requirement-form-title" onClose={onCancel} closeDisabled={isSubmitting}>
      <div className="card-head">
        <div><h2 id="requirement-form-title">{requirement ? "Editar requerimiento" : "Registro de requerimiento"}</h2><p>Complete la información de la solicitud.</p></div>
        <button autoFocus className="icon-button" type="button" aria-label="Cerrar formulario" disabled={isSubmitting} onClick={onCancel}><X size={16} /></button>
      </div>
      <form className="form" onSubmit={handleSubmit(submit)} noValidate>
        <Field idPrefix="requirement" errorClassName={styles.fieldError} label="Actividad o evento" error={errors.activityOrEvent?.message}><input {...register("activityOrEvent")} /></Field>
        <Field label="Correo del solicitante" error={errors.requestedBy?.message}><input type="email" {...register("requestedBy")} /></Field>
        <Field label="Facultad" error={errors.facultyId?.message}><select {...register("facultyId", { onChange: () => setValue("careerId", "") })}><option value="">Seleccione…</option>{catalogs.faculties.map(option)}</select></Field>
        <Field label="Carrera" error={errors.careerId?.message}><select {...register("careerId")} disabled={!facultyId}><option value="">Seleccione…</option>{careers.map(option)}</select></Field>
        <Field label="Sede" error={errors.campusId?.message}><select {...register("campusId")}><option value="">Seleccione…</option>{catalogs.campuses.map(option)}</select></Field>
        <Field label="Lugar" error={errors.place?.message}><input {...register("place")} /></Field>
        <Field label="Fecha de inicio" error={errors.startDate?.message}><input type="date" {...register("startDate")} /></Field>
        <Field label="Hora de inicio" error={errors.startTime?.message}><input type="time" {...register("startTime")} /></Field>
        <Field label="Fecha de fin" error={errors.endDate?.message}><input type="date" {...register("endDate")} /></Field>
        <Field label="Hora de fin" error={errors.endTime?.message}><input type="time" {...register("endTime")} /></Field>
        <Field label="Objetivo del evento" error={errors.eventObjective?.message} wide><textarea {...register("eventObjective")} /></Field>
        <Field label="Formato del evento" error={errors.eventFormatId?.message}><select {...register("eventFormatId")}><option value="">Seleccione…</option>{catalogs.eventFormats.map(option)}</select></Field>
        <Field label="Fecha de solicitud" error={errors.requestDate?.message}><input type="date" {...register("requestDate")} /></Field>
        {submitError && <p className={styles.error} role="alert">{submitError}</p>}
        <div className="form-actions">
          <button className="button" disabled={isSubmitting}>{requirement ? <Save size={16} /> : <Plus size={16} />} {isSubmitting ? "Guardando" : requirement ? "Guardar" : "Crear"}</button>
          <button className="button secondary" type="button" disabled={isSubmitting} onClick={onCancel}><X size={16} /> Cancelar</button>
        </div>
      </form>
    </RequirementDialog>
  );
}

function option(item: { id: string; name: string }) {
  return <option key={item.id} value={item.id}>{item.name}</option>;
}

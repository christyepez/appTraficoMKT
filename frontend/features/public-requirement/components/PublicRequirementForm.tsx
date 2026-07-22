"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { showToast } from "../../../app/lib";
import { FormField as Field } from "../../../shared/components/FormField";
import type { PublicAvailability, PublicRequirementCatalogs, PublicRequirementPayload } from "../models/public-requirement.models";
import { publicRequirementDefaults, publicRequirementSchema, type PublicRequirementValues } from "../schemas/public-requirement.schema";
import { createPublicRequirement, getPublicRequirementCatalogs } from "../services/public-requirement.service";
import { isPublicFeatureActive, mapPublicRequirementPayload } from "../utils/public-requirement.utils";

type Props = {
  availability: PublicAvailability;
  onCancel?: () => void;
  onSuccess?: () => void;
  loadCatalogs?: () => Promise<PublicRequirementCatalogs>;
  submitRequirement?: (payload: PublicRequirementPayload) => Promise<unknown>;
  now?: number;
};

export function PublicRequirementForm({ availability, onCancel, onSuccess, loadCatalogs = getPublicRequirementCatalogs, submitRequirement = createPublicRequirement, now }: Props) {
  const active = isPublicFeatureActive(availability, now);
  const [catalogs, setCatalogs] = useState<PublicRequirementCatalogs | null>(null);
  const [loading, setLoading] = useState(active);
  const [loadError, setLoadError] = useState("");
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { register, handleSubmit, reset, setValue, control, formState: { errors, isSubmitting } } = useForm<PublicRequirementValues>({
    resolver: zodResolver(publicRequirementSchema),
    defaultValues: publicRequirementDefaults
  });
  const facultyId = useWatch({ control, name: "facultyId" });
  const careers = useMemo(() => catalogs?.careers.filter((item) => !item.facultyId || item.facultyId === facultyId) ?? [], [catalogs, facultyId]);

  const reload = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    setLoadError("");
    try {
      setCatalogs(await loadCatalogs());
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : "No se pudieron cargar los catálogos.");
    } finally {
      setLoading(false);
    }
  }, [active, loadCatalogs]);

  useEffect(() => { queueMicrotask(() => void reload()); }, [reload]);

  async function submit(values: PublicRequirementValues) {
    if (!catalogs) return;
    setSubmitMessage(null);
    try {
      await submitRequirement(mapPublicRequirementPayload(values, catalogs));
      const message = "Requerimiento enviado correctamente.";
      setSubmitMessage({ type: "success", text: message });
      showToast(message);
      reset(publicRequirementDefaults);
      onSuccess?.();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo enviar el requerimiento.";
      setSubmitMessage({ type: "error", text: message });
      showToast(message, "error");
    }
  }

  if (!active) return <div className="empty" role="status">El formulario público no está activo en este momento.</div>;
  if (loading) return <div className="loading" role="status">Cargando formulario público...</div>;
  if (loadError) return <div className="error" role="alert"><span>{loadError}</span><button className="button secondary" type="button" onClick={() => void reload()}>Reintentar</button></div>;
  if (!catalogs || !catalogs.faculties.length || !catalogs.careers.length || !catalogs.campuses.length || !catalogs.eventFormats.length) {
    return <div className="empty" role="status">No hay catálogos activos suficientes para crear el requerimiento.</div>;
  }

  return (
    <form className="form top-space" onSubmit={handleSubmit(submit)} noValidate>
      <Field label="Actividad o evento" error={errors.activityOrEvent?.message}><input {...register("activityOrEvent")} /></Field>
      <Field label="Correo del solicitante" error={errors.requestedBy?.message}><input type="email" placeholder="correo@uti.edu.ec" {...register("requestedBy")} /></Field>
      <Field label="Facultad" error={errors.facultyId?.message}><select {...register("facultyId", { onChange: () => setValue("careerId", "") })}><option value="">Seleccione...</option>{catalogs.faculties.map(option)}</select></Field>
      <Field label="Carrera" error={errors.careerId?.message}><select disabled={!facultyId} {...register("careerId")}><option value="">Seleccione...</option>{careers.map(option)}</select></Field>
      <Field label="Sede" error={errors.campusId?.message}><select {...register("campusId")}><option value="">Seleccione...</option>{catalogs.campuses.map(option)}</select></Field>
      <Field label="Lugar" error={errors.place?.message}><input {...register("place")} /></Field>
      <Field label="Fecha inicio" error={errors.startDate?.message}><input type="date" {...register("startDate")} /></Field>
      <Field label="Hora inicio" error={errors.startTime?.message}><input type="time" {...register("startTime")} /></Field>
      <Field label="Fecha fin" error={errors.endDate?.message}><input type="date" {...register("endDate")} /></Field>
      <Field label="Hora fin" error={errors.endTime?.message}><input type="time" {...register("endTime")} /></Field>
      <Field label="Formato" error={errors.eventFormatId?.message}><select {...register("eventFormatId")}><option value="">Seleccione...</option>{catalogs.eventFormats.map(option)}</select></Field>
      <Field label="Objetivo del evento" error={errors.eventObjective?.message} wide><textarea {...register("eventObjective")} /></Field>
      <div className="form-actions">
        <button className="button" type="submit" disabled={isSubmitting}><Save size={16} /> {isSubmitting ? "Enviando..." : "Enviar requerimiento"}</button>
        {onCancel && <button className="button secondary" type="button" disabled={isSubmitting} onClick={onCancel}><X size={16} /> Cancelar</button>}
      </div>
      {submitMessage && <p className={`hint ${submitMessage.type}`} role={submitMessage.type === "error" ? "alert" : "status"}>{submitMessage.text}</p>}
    </form>
  );
}

function option(item: { id: string; name: string }) { return <option key={item.id} value={item.id}>{item.name}</option>; }

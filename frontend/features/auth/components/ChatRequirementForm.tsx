"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormField as Field } from "../../../shared/components/FormField";
import { REQUIREMENT_WORD_LIMIT } from "../../requirements/domain/requirement-form.constants";
import { buildRequirementFormSchema } from "../../requirements/domain/requirement-form.schema";
import type { RequirementFormCatalogs, RequirementFormValues } from "../../requirements/domain/requirement-form.types";
import { wordCount } from "../../requirements/domain/requirement-form.utils";
import { publicRequirementDefaults } from "../../public-requirement/schemas/public-requirement.schema";

type Props = { catalogs: RequirementFormCatalogs | null; onSubmit: (values: RequirementFormValues) => Promise<boolean>; message: string; };
const emptyCatalogs: RequirementFormCatalogs = { faculties: [], careers: [], campuses: [], eventFormats: [] };

const steps = ["Actividad", "Solicitante", "Ubicación", "Fechas", "Público", "Objetivo", "Formato", "Adjuntos", "Resumen"] as const;

export function ChatRequirementForm({ catalogs, onSubmit, message }: Props) {
  const [step, setStep] = useState(0);
  const activeCatalogs = useMemo(() => catalogs ?? emptyCatalogs, [catalogs]);
  const schema = useMemo(() => buildRequirementFormSchema(activeCatalogs), [activeCatalogs]);
  const { register, handleSubmit, setValue, control, trigger, reset, formState: { errors, isSubmitting } } = useForm<RequirementFormValues>({ resolver: zodResolver(schema), defaultValues: publicRequirementDefaults });
  const facultyId = useWatch({ control, name: "facultyId" });
  const eventObjective = useWatch({ control, name: "eventObjective" });
  const activityFormatDescription = useWatch({ control, name: "activityFormatDescription" });
  const values = useWatch({ control });
  const careers = useMemo(() => activeCatalogs.careers.filter((item) => !item.facultyId || item.facultyId === facultyId), [activeCatalogs, facultyId]);
  const ready = Boolean(activeCatalogs.faculties.length && activeCatalogs.careers.length && activeCatalogs.campuses.length && activeCatalogs.eventFormats.length);

  async function next() {
    const fields = fieldsByStep(step);
    if (fields.length && !(await trigger(fields))) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submit(data: RequirementFormValues) {
    if (await onSubmit(data)) {
      reset(publicRequirementDefaults);
      setStep(0);
    }
  }

  if (!ready) return <div className="empty" role="status">No hay catálogos activos suficientes para crear el requerimiento.</div>;

  return <form className="form top-space" onSubmit={handleSubmit(submit)} noValidate>
    <p className="hint" role="status">Paso {step + 1} de {steps.length}: {steps[step]}</p>
    {step === 0 && <Field label="Actividad o evento" error={errors.activityOrEvent?.message}><input autoFocus {...register("activityOrEvent")} /></Field>}
    {step === 1 && <>
      <Field label="Nombre del solicitante" error={errors.requesterName?.message}><input autoFocus {...register("requesterName")} /></Field>
      <Field label="Correo del solicitante" error={errors.requesterEmail?.message}><input type="email" placeholder="correo@uti.edu.ec" {...register("requesterEmail")} /></Field>
    </>}
    {step === 2 && <>
      <Field label="Facultad" error={errors.facultyId?.message}><select autoFocus {...register("facultyId", { onChange: () => setValue("careerId", "") })}><option value="">Seleccione...</option>{activeCatalogs.faculties.map(option)}</select></Field>
      <Field label="Carrera" error={errors.careerId?.message}><select disabled={!facultyId} {...register("careerId")}><option value="">Seleccione...</option>{careers.map(option)}</select></Field>
      <Field label="Sede" error={errors.campusId?.message}><select {...register("campusId")}><option value="">Seleccione...</option>{activeCatalogs.campuses.map(option)}</select></Field>
      <Field label="Lugar" error={errors.place?.message}><input {...register("place")} /></Field>
    </>}
    {step === 3 && <>
      <Field label="Fecha y hora de inicio" error={errors.startAt?.message}><input autoFocus type="datetime-local" {...register("startAt")} /></Field>
      <Field label="Fecha y hora de fin" error={errors.endAt?.message}><input type="datetime-local" {...register("endAt")} /></Field>
    </>}
    {step === 4 && <>
      <Field label="Público objetivo" error={errors.audienceType?.message}><select autoFocus {...register("audienceType")}><option value="internal">Interno</option><option value="external">Externo</option><option value="mixed">Mixto</option></select></Field>
      <Field label="Formato" error={errors.eventFormatId?.message}><select {...register("eventFormatId")}><option value="">Seleccione...</option>{activeCatalogs.eventFormats.map(option)}</select></Field>
    </>}
    {step === 5 && <Field label={`Objetivo del evento (${wordCount(eventObjective ?? "")}/${REQUIREMENT_WORD_LIMIT})`} error={errors.eventObjective?.message} wide><textarea autoFocus aria-label="Objetivo del evento" {...register("eventObjective")} /></Field>}
    {step === 6 && <Field label={`Formato o dinámica (${wordCount(activityFormatDescription ?? "")}/${REQUIREMENT_WORD_LIMIT})`} error={errors.activityFormatDescription?.message} wide><textarea autoFocus aria-label="Formato o dinámica" {...register("activityFormatDescription")} /></Field>}
    {step === 7 && <Field label="Adjuntos del requerimiento" error={errors.attachments?.message} wide><input aria-label="Adjuntos del requerimiento" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setValue("attachments", Array.from(event.target.files ?? []), { shouldValidate: true })} /></Field>}
    {step === 8 && <div className="summary" role="group" aria-label="Resumen del requerimiento">
      <strong>{values.activityOrEvent || "Actividad pendiente"}</strong>
      <span>{values.requesterName} · {values.requesterEmail}</span>
      <span>{activeCatalogs.faculties.find((item) => item.id === values.facultyId)?.name} · {activeCatalogs.careers.find((item) => item.id === values.careerId)?.name} · {activeCatalogs.campuses.find((item) => item.id === values.campusId)?.name}</span>
      <span>{values.startAt} a {values.endAt}</span>
      <span>{values.eventObjective}</span>
    </div>}
    <div className="form-actions">
      <button className="button secondary" type="button" disabled={step === 0 || isSubmitting} onClick={() => setStep((current) => Math.max(current - 1, 0))}><ChevronLeft size={16} /> Anterior</button>
      {step < steps.length - 1
        ? <button className="button" type="button" disabled={isSubmitting} onClick={() => void next()}><ChevronRight size={16} /> Siguiente</button>
        : <button className="button" disabled={isSubmitting}><Send size={16} /> {isSubmitting ? "Creando..." : "Confirmar requerimiento"}</button>}
    </div>
    {message && <p className="hint" role={message.startsWith("Su requerimiento") ? "status" : "alert"}>{message}</p>}
  </form>;
}

function option(item: { id: string; name: string }) { return <option key={item.id} value={item.id}>{item.name}</option>; }

function fieldsByStep(step: number): (keyof RequirementFormValues)[] {
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

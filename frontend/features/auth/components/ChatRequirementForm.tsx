"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { FormField as Field } from "../../../shared/components/FormField";
import { chatRequirementSchema, type ChatRequirementValues } from "../schemas/auth.schemas";

type Props = { onSubmit: (values: ChatRequirementValues) => Promise<boolean>; message: string; };
const defaults: ChatRequirementValues = { activityOrEvent: "", requestedBy: "", place: "", startDate: "", startTime: "", endDate: "", endTime: "", eventObjective: "" };

export function ChatRequirementForm({ onSubmit, message }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ChatRequirementValues>({ resolver: zodResolver(chatRequirementSchema), defaultValues: defaults });
  async function submit(values: ChatRequirementValues) { if (await onSubmit(values)) reset(defaults); }
  return <form className="form top-space" onSubmit={handleSubmit(submit)} noValidate>
    <Field label="Actividad o evento" error={errors.activityOrEvent?.message}><input {...register("activityOrEvent")} /></Field>
    <Field label="Correo del solicitante" error={errors.requestedBy?.message}><input type="email" placeholder="correo@uti.edu.ec" {...register("requestedBy")} /></Field>
    <Field label="Lugar" error={errors.place?.message}><input {...register("place")} /></Field>
    <Field label="Fecha inicio" error={errors.startDate?.message}><input type="date" {...register("startDate")} /></Field>
    <Field label="Hora inicio" error={errors.startTime?.message}><input type="time" {...register("startTime")} /></Field>
    <Field label="Fecha fin" error={errors.endDate?.message}><input type="date" {...register("endDate")} /></Field>
    <Field label="Hora fin" error={errors.endTime?.message}><input type="time" {...register("endTime")} /></Field>
    <Field label="Objetivo" error={errors.eventObjective?.message} wide><textarea {...register("eventObjective")} /></Field>
    <button className="button" disabled={isSubmitting}><Send size={16} /> {isSubmitting ? "Creando..." : "Crear requerimiento"}</button>
    {message && <p className="hint" role={message.startsWith("Listo") ? "status" : "alert"}>{message}</p>}
  </form>;
}

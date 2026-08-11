"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { showToast } from "../../../app/lib";
import { FormField as Field } from "../../../shared/components/FormField";
import { REQUIREMENT_WORD_LIMIT } from "../../requirements/domain/requirement-form.constants";
import { requirementFormDefaults } from "../../requirements/domain/requirement-form.mappers";
import { wordCount } from "../../requirements/domain/requirement-form.utils";
import type { PublicAvailability, PublicRequirementAttachmentResult, PublicRequirementCatalogs, PublicRequirementCreationResult, PublicRequirementPayload } from "../models/public-requirement.models";
import { buildPublicRequirementSchema, publicRequirementDefaults, type PublicRequirementValues } from "../schemas/public-requirement.schema";
import { createPublicRequirement, getPublicRequirementCatalogs, uploadPublicRequirementAttachment } from "../services/public-requirement.service";
import { isPublicFeatureActive, mapPublicRequirementPayload, publicRequirementSuccessMessage } from "../utils/public-requirement.utils";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: { sitekey: string; callback: (token: string) => void; "error-callback"?: () => void; "expired-callback"?: () => void }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

type Props = {
  availability: PublicAvailability;
  onCancel?: () => void;
  onSuccess?: () => void;
  loadCatalogs?: () => Promise<PublicRequirementCatalogs>;
  submitRequirement?: (payload: PublicRequirementPayload) => Promise<PublicRequirementCreationResult>;
  uploadAttachment?: (requirementId: string, uploadToken: string, file: File) => Promise<PublicRequirementAttachmentResult>;
  now?: number;
};

export function PublicRequirementForm({
  availability,
  onCancel,
  onSuccess,
  loadCatalogs = getPublicRequirementCatalogs,
  submitRequirement = createPublicRequirement,
  uploadAttachment = uploadPublicRequirementAttachment,
  now
}: Props) {
  const active = isPublicFeatureActive(availability, now);
  const [catalogs, setCatalogs] = useState<PublicRequirementCatalogs | null>(null);
  const [loading, setLoading] = useState(active);
  const [loadError, setLoadError] = useState("");
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const [lastCreation, setLastCreation] = useState<PublicRequirementCreationResult | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const schema = useMemo(() => catalogs ? buildPublicRequirementSchema(catalogs) : buildPublicRequirementSchema({ faculties: [], careers: [], campuses: [], eventFormats: [] }), [catalogs]);
  const { register, handleSubmit, reset, setValue, control, formState: { errors, isSubmitting } } = useForm<PublicRequirementValues>({
    resolver: zodResolver(schema),
    defaultValues: publicRequirementDefaults
  });
  const facultyId = useWatch({ control, name: "facultyId" });
  const eventObjective = useWatch({ control, name: "eventObjective" });
  const activityFormatDescription = useWatch({ control, name: "activityFormatDescription" });
  const attachments = useWatch({ control, name: "attachments" }) ?? [];
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

  useEffect(() => {
    if (!active || !turnstileSiteKey || typeof window === "undefined") return;
    const containerId = "public-requirement-turnstile";
    const render = () => {
      const container = document.getElementById(containerId);
      if (!container || container.childElementCount || !window.turnstile) return;
      window.turnstile.render(container, {
        sitekey: turnstileSiteKey,
        callback: setTurnstileToken,
        "error-callback": () => setTurnstileToken(""),
        "expired-callback": () => setTurnstileToken("")
      });
    };
    if (!document.querySelector("script[data-turnstile]")) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.turnstile = "true";
      script.onload = render;
      document.body.appendChild(script);
      return;
    }
    render();
  }, [active, turnstileSiteKey]);

  async function uploadSelectedFiles(requirementId: string, uploadToken: string, files: File[]) {
    const results = await Promise.all(files.map(async (file) => {
      try {
        return await uploadAttachment(requirementId, uploadToken, file);
      } catch (reason) {
        return { attachmentId: "", fileName: file.name, success: false, error: reason instanceof Error ? reason.message : "No se pudo cargar el archivo." };
      }
    }));
    return results.filter((result) => !result.success).map((result) => files.find((file) => file.name === result.fileName)).filter((file): file is File => Boolean(file));
  }

  async function submit(values: PublicRequirementValues) {
    if (!catalogs) return;
    setSubmitMessage(null);
    setFailedFiles([]);
    if (turnstileSiteKey && !turnstileToken) {
      const message = "Complete la verificación de seguridad antes de enviar.";
      setSubmitMessage({ type: "error", text: message });
      showToast(message, "error");
      return;
    }
    try {
      const creation = await submitRequirement({ ...mapPublicRequirementPayload(values, catalogs), turnstileToken: turnstileToken || undefined });
      const pending = values.attachments.length ? await uploadSelectedFiles(creation.requirementId, creation.uploadToken, values.attachments) : [];
      const successText = publicRequirementSuccessMessage(creation.requirementCode);
      setLastCreation(creation);
      if (pending.length) {
        const message = `${successText} No se cargaron ${pending.length} archivo(s): ${pending.map((file) => file.name).join(", ")}. Puede reintentarlos sin crear otro requerimiento.`;
        setFailedFiles(pending);
        setSubmitMessage({ type: "warning", text: message });
        showToast("Requerimiento creado con adjuntos pendientes.", "error");
        return;
      }
      setSubmitMessage({ type: "success", text: creation.message || successText });
      showToast("Requerimiento enviado correctamente.");
      setTurnstileToken("");
      reset(requirementFormDefaults());
      onSuccess?.();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo enviar el requerimiento.";
      setSubmitMessage({ type: "error", text: message });
      showToast(message, "error");
    }
  }

  async function retryFailedFiles() {
    if (!lastCreation || !failedFiles.length) return;
    const pending = await uploadSelectedFiles(lastCreation.requirementId, lastCreation.uploadToken, failedFiles);
    if (pending.length) {
      setFailedFiles(pending);
      setSubmitMessage({ type: "warning", text: `Aún quedan archivos pendientes: ${pending.map((file) => file.name).join(", ")}.` });
      return;
    }
    const message = publicRequirementSuccessMessage(lastCreation.requirementCode);
    setFailedFiles([]);
    setSubmitMessage({ type: "success", text: message });
    showToast("Adjuntos cargados correctamente.");
    reset(requirementFormDefaults());
    onSuccess?.();
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
      <Field label="Nombre del solicitante" error={errors.requesterName?.message}><input {...register("requesterName")} /></Field>
      <Field label="Correo del solicitante" error={errors.requesterEmail?.message}><input type="email" placeholder="correo@uti.edu.ec" {...register("requesterEmail")} /></Field>
      <Field label="Facultad" error={errors.facultyId?.message}><select {...register("facultyId", { onChange: () => setValue("careerId", "") })}><option value="">Seleccione...</option>{catalogs.faculties.map(option)}</select></Field>
      <Field label="Carrera" error={errors.careerId?.message}><select disabled={!facultyId} {...register("careerId")}><option value="">Seleccione...</option>{careers.map(option)}</select></Field>
      <Field label="Sede" error={errors.campusId?.message}><select {...register("campusId")}><option value="">Seleccione...</option>{catalogs.campuses.map(option)}</select></Field>
      <Field label="Lugar" error={errors.place?.message}><input {...register("place")} /></Field>
      <Field label="Fecha y hora de inicio" error={errors.startAt?.message}><input type="datetime-local" {...register("startAt")} /></Field>
      <Field label="Fecha y hora de fin" error={errors.endAt?.message}><input type="datetime-local" {...register("endAt")} /></Field>
      <Field label="Público objetivo" error={errors.audienceType?.message}><select {...register("audienceType")}><option value="internal">Interno</option><option value="external">Externo</option><option value="mixed">Mixto</option></select></Field>
      <Field label="Formato" error={errors.eventFormatId?.message}><select {...register("eventFormatId")}><option value="">Seleccione...</option>{catalogs.eventFormats.map(option)}</select></Field>
      <Field label={`Objetivo del evento (${wordCount(eventObjective ?? "")}/${REQUIREMENT_WORD_LIMIT})`} error={errors.eventObjective?.message} wide><textarea aria-label="Objetivo del evento" {...register("eventObjective")} /></Field>
      <Field label={`Formato o dinámica (${wordCount(activityFormatDescription ?? "")}/${REQUIREMENT_WORD_LIMIT})`} error={errors.activityFormatDescription?.message} wide><textarea aria-label="Formato o dinámica" {...register("activityFormatDescription")} /></Field>
      <Field label="Adjuntos del requerimiento" error={errors.attachments?.message} wide>
        <input
          aria-label="Adjuntos del requerimiento"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          onChange={(event) => setValue("attachments", Array.from(event.target.files ?? []), { shouldValidate: true })}
        />
      </Field>
      {!!attachments.length && <p className="hint" role="status">{attachments.length} archivo(s) seleccionado(s).</p>}
      {turnstileSiteKey && <div id="public-requirement-turnstile" className="field-wide" aria-label="Verificación de seguridad" />}
      <div className="summary">
        <strong>Resumen</strong>
        <span>El requerimiento se registrará primero y luego se cargarán los adjuntos seleccionados.</span>
      </div>
      <div className="form-actions">
        <button className="button" type="submit" disabled={isSubmitting}><Save size={16} /> {isSubmitting ? "Enviando..." : "Enviar requerimiento"}</button>
        {failedFiles.length > 0 && <button className="button secondary" type="button" disabled={isSubmitting} onClick={() => void retryFailedFiles()}>Reintentar adjuntos</button>}
        {onCancel && <button className="button secondary" type="button" disabled={isSubmitting} onClick={onCancel}><X size={16} /> Cancelar</button>}
      </div>
      {submitMessage && <p className={`hint ${submitMessage.type}`} role={submitMessage.type === "error" ? "alert" : "status"}>{submitMessage.text}</p>}
    </form>
  );
}

function option(item: { id: string; name: string }) { return <option key={item.id} value={item.id}>{item.name}</option>; }

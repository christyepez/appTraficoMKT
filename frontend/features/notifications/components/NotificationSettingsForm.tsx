"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AccessibleDialog } from "../../../shared/components/AccessibleDialog";
import { defaultEmailTemplate, defaultTeamsTemplate, emptyNotificationSettings, type NotificationSettings } from "../models/notification.models";
import { notificationSettingsSchema, type NotificationSettingsValues } from "../schemas/notification.schema";
import styles from "../styles/Notifications.module.css";
import { NotificationTemplateEditor } from "./NotificationTemplateEditor";

export function NotificationSettingsForm({ item, onSave, onClose }: { item: NotificationSettings | null; onSave: (value: NotificationSettings) => Promise<unknown>; onClose: () => void }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm<NotificationSettingsValues>({ resolver: zodResolver(notificationSettingsSchema), defaultValues: item ?? emptyNotificationSettings });
  const email = useWatch({ control, name: "emailEnabled" });
  const teams = useWatch({ control, name: "teamsEnabled" });
  const html = useWatch({ control, name: "htmlTemplate" });
  const emailHtml = useWatch({ control, name: "emailHtmlTemplate" });
  const teamsHtml = useWatch({ control, name: "teamsHtmlTemplate" });

  async function submit(value: NotificationSettingsValues) {
    setError("");
    try {
      await onSave({
        ...value,
        powerAutomateWebhookUrl: value.powerAutomateWebhookUrl === "Configurado" || item?.powerAutomateWebhookUrl === "Configurado" ? "Configurado" : value.powerAutomateWebhookUrl,
        emailPowerAutomateWebhookUrl: value.emailPowerAutomateWebhookUrl === "Configurado" || item?.emailPowerAutomateWebhookUrl === "Configurado" ? "Configurado" : value.emailPowerAutomateWebhookUrl,
        teamsPowerAutomateWebhookUrl: value.teamsPowerAutomateWebhookUrl === "Configurado" || item?.teamsPowerAutomateWebhookUrl === "Configurado" ? "Configurado" : value.teamsPowerAutomateWebhookUrl
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar.");
    }
  }

  return <AccessibleDialog labelledBy="notification-form-title" onClose={onClose} closeDisabled={isSubmitting} panelClassName={`modal-panel-wide ${styles.modal}`}>
    <h2 id="notification-form-title">{item ? "Editar notificación" : "Crear notificación"}</h2>
    <form className="form top-space" noValidate onSubmit={handleSubmit(submit)}>
      <input type="hidden" {...register("id")}/>
      <label className="field field-wide"><span>Nombre</span><input {...register("name")}/>{errors.name && <small role="alert">{errors.name.message}</small>}</label>
      <label className="field field-wide"><span>Webhook legado</span><input placeholder={item?.powerAutomateWebhookUrl ? "Configurado" : "Opcional para compatibilidad"} {...register("powerAutomateWebhookUrl")}/></label>
      <label className="field field-wide"><span>Webhook Power Automate correo</span><input placeholder={item?.emailPowerAutomateWebhookUrl ? "Configurado" : "URL del flujo de correo"} {...register("emailPowerAutomateWebhookUrl")}/></label>
      <label className="field field-wide"><span>Webhook Power Automate Teams</span><input placeholder={item?.teamsPowerAutomateWebhookUrl ? "Configurado" : "URL del flujo de Teams"} {...register("teamsPowerAutomateWebhookUrl")}/></label>
      {email && <label className="field"><span>Correos destino</span><input {...register("emailTo")}/>{errors.emailTo && <small role="alert">{errors.emailTo.message}</small>}</label>}
      {teams && <label className="field"><span>Canal Teams</span><input {...register("teamsChannel")}/>{errors.teamsChannel && <small role="alert">{errors.teamsChannel.message}</small>}</label>}
      <NotificationTemplateEditor label="Plantilla HTML legado" value={html} onChange={(value) => setValue("htmlTemplate", value, { shouldDirty: true, shouldValidate: true })}/>
      {email && <NotificationTemplateEditor label="Plantilla HTML correo" defaultTemplate={defaultEmailTemplate} value={emailHtml} onChange={(value) => setValue("emailHtmlTemplate", value, { shouldDirty: true, shouldValidate: true })}/>}
      {teams && <NotificationTemplateEditor label="Plantilla HTML Teams" defaultTemplate={defaultTeamsTemplate} value={teamsHtml} onChange={(value) => setValue("teamsHtmlTemplate", value, { shouldDirty: true, shouldValidate: true })}/>}
      <div className="check-group">
        <label className="check-field">Enviar correo<input type="checkbox" {...register("emailEnabled")}/></label>
        <label className="check-field">Enviar Teams<input type="checkbox" {...register("teamsEnabled")}/></label>
        <label className="check-field">Activo<input type="checkbox" {...register("isActive")}/></label>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="form-actions"><button className="button" disabled={isSubmitting}>{isSubmitting ? "Guardando" : item ? "Guardar" : "Crear"}</button><button className="button secondary" type="button" disabled={isSubmitting} onClick={onClose}>Cancelar</button></div>
    </form>
  </AccessibleDialog>;
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { showToast } from "../../../app/lib";
import { changePassword } from "../../../core/auth/auth.service";
import { safeAuthMessage } from "../../../core/auth/auth.utils";
import { clearSession } from "../../../core/auth/session";
import { changePasswordSchema, type ChangePasswordValues } from "../schemas/auth.schemas";
import accessStyles from "../../../shared/styles/PublicAccess.module.css";

type Props = {
  updatePassword?: typeof changePassword;
  onChanged?: () => void;
};

function emailFromLocation() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("email") ?? "";
}

export function ChangePasswordForm({ updatePassword = changePassword, onChanged }: Props) {
  const [message, setMessage] = useState("Ingrese la clave temporal y defina una nueva clave.");
  const [isError, setIsError] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { email: emailFromLocation(), currentPassword: "", newPassword: "", confirmPassword: "" }
  });

  async function submit(values: ChangePasswordValues) {
    setIsError(false);
    try {
      await updatePassword(values.email, values.currentPassword, values.newPassword);
      clearSession();
      const success = "Clave actualizada correctamente. Inicie sesión nuevamente.";
      setMessage(success);
      showToast(success);
      if (onChanged) onChanged();
      else window.setTimeout(() => window.location.replace("/login"), 900);
    } catch (error) {
      const failure = safeAuthMessage(error instanceof Error ? error.message : "No se pudo cambiar la clave.");
      setMessage(failure);
      setIsError(true);
      showToast(failure, "error");
    }
  }

  return (
    <main className={accessStyles.page}>
      <section className={accessStyles.panel}>
        <div className={`brand ${accessStyles.brand}`}>
          <strong>Cambiar clave</strong>
          <span>Actualización segura de contraseña</span>
        </div>
        <form className="form" onSubmit={handleSubmit(submit)} noValidate>
          <label className="field">
            <span>Correo</span>
            <input type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
            {errors.email && <small className="field-error" role="alert">{errors.email.message}</small>}
          </label>
          <label className="field">
            <span>Clave temporal o actual</span>
            <input type="password" autoComplete="current-password" aria-invalid={Boolean(errors.currentPassword)} {...register("currentPassword")} />
            {errors.currentPassword && <small className="field-error" role="alert">{errors.currentPassword.message}</small>}
          </label>
          <label className="field">
            <span>Nueva clave</span>
            <input type="password" autoComplete="new-password" aria-invalid={Boolean(errors.newPassword)} {...register("newPassword")} />
            {errors.newPassword && <small className="field-error" role="alert">{errors.newPassword.message}</small>}
          </label>
          <label className="field">
            <span>Confirmar nueva clave</span>
            <input type="password" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} {...register("confirmPassword")} />
            {errors.confirmPassword && <small className="field-error" role="alert">{errors.confirmPassword.message}</small>}
          </label>
          <button className="button" type="submit" disabled={isSubmitting} title="Guardar nueva contraseña">
            <Save size={16} /> {isSubmitting ? "Guardando..." : "Cambiar clave"}
          </button>
        </form>
        <Link className="button secondary full" href="/login" title="Volver al inicio de sesión">Volver al login</Link>
        <p className="hint" role={isError ? "alert" : "status"}><KeyRound size={14} /> {message}</p>
      </section>
    </main>
  );
}

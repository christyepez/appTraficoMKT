"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { showToast } from "../../../app/lib";
import { requestPasswordReset } from "../../../core/auth/auth.service";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas/auth.schemas";
import accessStyles from "../../../shared/styles/PublicAccess.module.css";

type Props = { requestReset?: typeof requestPasswordReset };
const neutralSuccess = "Si el correo existe, se envió una clave temporal.";

export function ForgotPasswordForm({ requestReset = requestPasswordReset }: Props) {
  const [message, setMessage] = useState("Ingrese su correo para recibir una clave temporal.");
  const [isError, setIsError] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" }
  });

  async function submit(values: ForgotPasswordValues) {
    setIsError(false);
    try {
      await requestReset(values.email);
      setMessage(neutralSuccess);
      showToast(neutralSuccess);
    } catch {
      const failure = "No se pudo procesar la solicitud. Intente nuevamente.";
      setMessage(failure);
      setIsError(true);
      showToast(failure, "error");
    }
  }

  return (
    <main className={accessStyles.page}>
      <section className={accessStyles.panel}>
        <div className={`brand ${accessStyles.brand}`}>
          <strong>Recuperar contraseña</strong>
          <span>Clave temporal por correo configurado</span>
        </div>
        <form className="form" onSubmit={handleSubmit(submit)} noValidate>
          <label className="field">
            <span>Correo</span>
            <input type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
            {errors.email && <small className="field-error" role="alert">{errors.email.message}</small>}
          </label>
          <button className="button" type="submit" disabled={isSubmitting} title="Enviar clave temporal al correo">
            <Mail size={16} /> {isSubmitting ? "Enviando..." : "Enviar clave temporal"}
          </button>
        </form>
        <Link className="button secondary full" href="/change-password" title="Cambiar clave usando la clave temporal">
          <KeyRound size={16} /> Cambiar clave
        </Link>
        <Link className="button secondary full" href="/login" title="Volver al inicio de sesión">Volver al login</Link>
        <p className="hint" role={isError ? "alert" : "status"}><KeyRound size={14} /> {message}</p>
      </section>
    </main>
  );
}

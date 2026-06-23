"use client";

import { api, showToast } from "../lib";
import { KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("Ingrese su correo para recibir una clave temporal.");
  const [isSending, setIsSending] = useState(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    setIsSending(true);
    try {
      await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      const ok = "Si el correo existe, se envió una clave temporal.";
      setMessage(ok);
      showToast(ok);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo solicitar recuperación.";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand login-brand">
          <strong>Recuperar contraseña</strong>
          <span>Clave temporal por correo configurado</span>
        </div>
        <form className="form" onSubmit={send}>
          <label className="field">
            <span>Correo</span>
            <input name="email" type="email" required />
          </label>
          <button className="button" type="submit" disabled={isSending} title="Enviar clave temporal al correo">
            <Mail size={16} /> {isSending ? "Enviando" : "Enviar clave temporal"}
          </button>
        </form>
        <Link className="button secondary full" href="/change-password" title="Cambiar clave usando la clave temporal">
          <KeyRound size={16} /> Cambiar clave
        </Link>
        <Link className="button secondary full" href="/login" title="Volver al inicio de sesión">
          Volver al login
        </Link>
        <p className="hint"><KeyRound size={14} /> {message}</p>
      </section>
    </main>
  );
}

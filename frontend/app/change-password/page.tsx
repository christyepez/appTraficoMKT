"use client";

import { api, clearSession, showToast } from "../lib";
import { KeyRound, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Ingrese la clave temporal y defina una nueva clave.");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") ?? "");
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      showToast("La confirmación de clave no coincide.", "error");
      setMessage("La confirmación de clave no coincide.");
      return;
    }
    setIsSaving(true);
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          currentPassword: form.get("currentPassword"),
          newPassword
        })
      });
      clearSession();
      const ok = "Clave actualizada correctamente. Inicie sesión nuevamente.";
      setMessage(ok);
      showToast(ok);
      window.setTimeout(() => router.replace("/login"), 900);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo cambiar la clave.";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand login-brand">
          <strong>Cambiar clave</strong>
          <span>Actualización segura de contraseña</span>
        </div>
        <form className="form" onSubmit={save}>
          <label className="field">
            <span>Correo</span>
            <input name="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="field">
            <span>Clave temporal o actual</span>
            <input name="currentPassword" type="password" required />
          </label>
          <label className="field">
            <span>Nueva clave</span>
            <input name="newPassword" type="password" minLength={8} required />
          </label>
          <label className="field">
            <span>Confirmar nueva clave</span>
            <input name="confirmPassword" type="password" minLength={8} required />
          </label>
          <button className="button" type="submit" disabled={isSaving} title="Guardar nueva contraseña">
            <Save size={16} /> {isSaving ? "Guardando" : "Cambiar clave"}
          </button>
        </form>
        <Link className="button secondary full" href="/login" title="Volver al inicio de sesión">
          Volver al login
        </Link>
        <p className="hint"><KeyRound size={14} /> {message}</p>
      </section>
    </main>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginLocal } from "../../../core/auth/auth.service";
import { safeAuthMessage } from "../../../core/auth/auth.utils";
import { useAuthRedirect } from "../../../core/auth/hooks/use-auth-redirect";
import { saveSession, type AuthSession } from "../../../core/auth/session";
import { showToast } from "../../../app/lib";
import { loginSchema, type LoginValues } from "../schemas/auth.schemas";

type LoginFormProps = {
  onAuthenticated?: (session: AuthSession) => void;
  authenticate?: typeof loginLocal;
};

export function LoginForm({ onAuthenticated, authenticate = loginLocal }: LoginFormProps) {
  const [message, setMessage] = useState("");
  const redirect = useAuthRedirect(onAuthenticated);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@local.test", password: "Admin123!" }
  });

  function submit(values: LoginValues) {
    setMessage("");
    return authenticate(values.email, values.password)
      .then((session) => {
        saveSession(session);
        showToast("Inicio de sesión correcto.");
        redirect(session);
      })
      .catch((error: unknown) => {
        setMessage(safeAuthMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión."));
      });
  }

  return (
    <form className="form" onSubmit={handleSubmit(submit)} noValidate>
      <label className="field">
        <span>Correo</span>
        <input type="email" autoComplete="username" aria-invalid={Boolean(errors.email)} {...register("email")} />
        {errors.email && <small className="field-error" role="alert">{errors.email.message}</small>}
      </label>
      <label className="field">
        <span>Clave</span>
        <input type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register("password")} />
        {errors.password && <small className="field-error" role="alert">{errors.password.message}</small>}
      </label>
      <button className="button" type="submit" title="Ingresar con cuenta local" disabled={isSubmitting}>
        <LogIn size={16} /> {isSubmitting ? "Ingresando..." : "Ingresar"}
      </button>
      {message && <p className="hint" role="alert">{message}</p>}
    </form>
  );
}

"use client";

import { api, defaultBrandSettings, saveSession, showToast, type AuthSession, type BrandSettings } from "../lib";
import { ClipboardList, KeyRound, LogIn, Mail, PawPrint, Send, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Usa admin@local.test / Admin123!");
  const [brand, setBrand] = useState<BrandSettings>(defaultBrandSettings);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [catalogDefaults, setCatalogDefaults] = useState<{ faculty?: any; campus?: any; format?: any; career?: any }>({});

  useEffect(() => {
    api<BrandSettings>("/api/identity/brand-settings").then((data) => setBrand({ ...defaultBrandSettings, ...data })).catch(() => undefined);
    Promise.all([
      api<any[]>("/api/admin/faculties").catch(() => []),
      api<any[]>("/api/admin/campuses").catch(() => []),
      api<any[]>("/api/admin/catalogs/by-type/FormatoEvento").catch(() => []),
      api<any[]>("/api/admin/careers").catch(() => [])
    ]).then(([faculties, campuses, formats, careers]) => setCatalogDefaults({
      faculty: faculties.find((item) => item.isActive) ?? faculties[0],
      campus: campuses.find((item) => item.isActive) ?? campuses[0],
      format: formats.find((item) => item.isActive) ?? formats[0],
      career: careers.find((item) => item.isActive) ?? careers[0]
    })).catch(() => undefined);

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error_description") ?? params.get("error");
    if (error) setMessage(error);
    if (!code) return;

    const expectedState = window.sessionStorage.getItem("msal-state");
    const codeVerifier = window.sessionStorage.getItem("msal-code-verifier");
    if (!state || state !== expectedState || !codeVerifier) {
      setMessage("No se pudo validar el retorno de Microsoft.");
      return;
    }

    api<AuthSession>("/api/auth/microsoft/code", {
      method: "POST",
      body: JSON.stringify({
        code,
        codeVerifier,
        redirectUri: window.location.origin + window.location.pathname
      })
    })
      .then((session) => {
        window.sessionStorage.removeItem("msal-state");
        window.sessionStorage.removeItem("msal-code-verifier");
        saveSession(session);
        router.push(session.user.mustChangePassword ? `/change-password?email=${encodeURIComponent(session.user.email)}` : "/dashboard");
      })
      .catch((err: Error) => setMessage(err.message));
  }, [router]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const session = await api<AuthSession>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password")
        })
      });
      saveSession(session);
      showToast("Inicio de sesión correcto.");
      router.push(session.user.mustChangePassword ? `/change-password?email=${encodeURIComponent(session.user.email)}` : "/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo iniciar sesion.");
    }
  }

  async function microsoftLogin() {
    try {
      const config = await api<{ tenantId: string; clientId: string; authority: string; scopes: string[] }>("/api/auth/microsoft/config");
      const codeVerifier = randomString(64);
      const state = randomString(32);
      const codeChallenge = await sha256Base64Url(codeVerifier);
      window.sessionStorage.setItem("msal-state", state);
      window.sessionStorage.setItem("msal-code-verifier", codeVerifier);

      const authorize = new URL(`${config.authority}/oauth2/v2.0/authorize`);
      authorize.searchParams.set("client_id", config.clientId);
      authorize.searchParams.set("response_type", "code");
      authorize.searchParams.set("redirect_uri", window.location.origin + window.location.pathname);
      authorize.searchParams.set("response_mode", "query");
      authorize.searchParams.set("scope", config.scopes.join(" "));
      authorize.searchParams.set("state", state);
      authorize.searchParams.set("code_challenge", codeChallenge);
      authorize.searchParams.set("code_challenge_method", "S256");
      window.location.assign(authorize.toString());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo iniciar Microsoft SSO.");
    }
  }

  async function createFromChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startDate = String(form.get("startDate") || new Date().toISOString().slice(0, 10));
    try {
      await api("/api/requirements", {
        method: "POST",
        body: JSON.stringify({
          activityOrEvent: form.get("activityOrEvent"),
          requestedBy: form.get("requestedBy"),
          facultyId: catalogDefaults.faculty?.id,
          faculty: catalogDefaults.faculty?.name ?? "No definida",
          career: catalogDefaults.career?.name ?? "No definida",
          campusId: catalogDefaults.campus?.id,
          campus: catalogDefaults.campus?.name ?? "No definida",
          place: form.get("place") || "Por definir",
          startDate,
          endDate: form.get("endDate") || startDate,
          eventObjective: form.get("eventObjective"),
          eventFormatId: catalogDefaults.format?.id,
          eventFormat: catalogDefaults.format?.name ?? "Presencial",
          requestDate: new Date().toISOString().slice(0, 10)
        })
      });
      setChatMessage("Listo, el requerimiento fue creado. El equipo lo revisará en seguimiento.");
      showToast("Requerimiento creado desde chatbot.");
      event.currentTarget.reset();
    } catch (error) {
      setChatMessage(error instanceof Error ? error.message : "No se pudo crear el requerimiento.");
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand login-brand">
          <strong>Requerimientos MKT-UTI</strong>
          <span>Acceso seguro por cuenta local o Microsoft</span>
        </div>
        <form className="form" onSubmit={login}>
          <label className="field">
            <span>Correo</span>
            <input name="email" type="email" defaultValue="admin@local.test" required />
          </label>
          <label className="field">
            <span>Clave</span>
            <input name="password" type="password" defaultValue="Admin123!" required />
          </label>
          <button className="button" type="submit" title="Ingresar con cuenta local">
            <LogIn size={16} /> Ingresar
          </button>
        </form>
        <button className="button secondary full" type="button" title="Iniciar flujo de autenticación Microsoft Entra ID" onClick={microsoftLogin}>
          <Mail size={16} /> Ingresar con Office 365
        </button>
        <Link className="button secondary full" href="/forgot-password" title="Recuperar contraseña con clave temporal">
          <KeyRound size={16} /> Recuperar contraseña
        </Link>
        <Link className="button secondary full" href="/public-requirement" title="Crear requerimiento sin iniciar sesión">
          <ClipboardList size={16} /> Crear requerimiento sin login
        </Link>
        <p className="hint"><KeyRound size={14} /> {message}</p>
      </section>
      <button className="chatbot-launcher" type="button" title="Asistente Puma para crear requerimientos" onClick={() => setIsChatOpen(true)}>
        {brand.chatbotIcon ? <img src={brand.chatbotIcon} alt="Puma" /> : <PawPrint size={24} />}
      </button>
      {isChatOpen && (
        <section className="chatbot-panel">
          <div className="card-head">
            <div>
              <h2>Asistente Puma</h2>
              <p>Crear requerimiento rápido</p>
            </div>
            <button className="icon-button" type="button" title="Cerrar asistente" onClick={() => setIsChatOpen(false)}><X size={16} /></button>
          </div>
          <form className="form top-space" onSubmit={createFromChat}>
            <label className="field"><span>Actividad o evento</span><input name="activityOrEvent" required /></label>
            <label className="field"><span>Solicitante</span><input name="requestedBy" required /></label>
            <label className="field"><span>Lugar</span><input name="place" /></label>
            <label className="field"><span>Fecha inicio</span><input name="startDate" type="date" /></label>
            <label className="field"><span>Fecha fin</span><input name="endDate" type="date" /></label>
            <label className="field field-wide"><span>Objetivo</span><textarea name="eventObjective" required /></label>
            <button className="button"><Send size={16} /> Crear requerimiento</button>
          </form>
          {chatMessage && <p className="hint">{chatMessage}</p>}
        </section>
      )}
    </main>
  );
}

function randomString(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ("0" + byte.toString(16)).slice(-2)).join("");
}

async function sha256Base64Url(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

"use client";

import { api, defaultBrandSettings, saveSession, showToast, type AuthSession, type BrandSettings } from "../../../app/lib";
import { ClipboardList, KeyRound, Mail, PawPrint, Send, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedRoute, safeAuthMessage } from "../../../core/auth/auth.utils";
import { PublicRequirementForm } from "../../public-requirement/components/PublicRequirementForm";
import { isPublicFeatureActive } from "../../public-requirement/utils/public-requirement.utils";
import { LoginForm } from "./LoginForm";

export function LoginExperience() {
  const router = useRouter();
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error_description") ?? params.get("error");
    return error ? safeAuthMessage(error) : "";
  });
  const [brand, setBrand] = useState<BrandSettings>(defaultBrandSettings);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPublicFormOpen, setIsPublicFormOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [catalogDefaults, setCatalogDefaults] = useState<{ faculty?: any; campus?: any; format?: any; career?: any }>({});
  const popupAvailability = { enabled: brand.showPublicRequirementForm, activeFrom: brand.publicRequirementFormActiveFrom, activeUntil: brand.publicRequirementFormActiveUntil };
  const showPublicPopup = isPublicFeatureActive(popupAvailability);
  const showPublicFullPage = isPublicFeatureActive({ enabled: brand.showPublicRequirementFullPage, activeFrom: brand.publicRequirementFullPageActiveFrom, activeUntil: brand.publicRequirementFullPageActiveUntil });
  const showChatbot = isPublicFeatureActive({ enabled: brand.showLoginChatbot, activeFrom: brand.loginChatbotActiveFrom, activeUntil: brand.loginChatbotActiveUntil });

  useEffect(() => {
    api<BrandSettings>("/api/identity/brand-settings").then((data) => setBrand({ ...defaultBrandSettings, ...data })).catch(() => undefined);
    Promise.all([
      api<any[]>("/api/admin/faculties").catch(() => []),
      api<any[]>("/api/admin/campuses").catch(() => []),
      api<any[]>("/api/admin/catalogs/by-type/FormatoEvento").catch(() => []),
      api<any[]>("/api/admin/careers").catch(() => [])
    ]).then(([facultyData, campusData, formatData, careerData]) => {
      const activeFaculties = facultyData.filter((item) => item.isActive);
      const activeCampuses = campusData.filter((item) => item.isActive);
      const activeFormats = formatData.filter((item) => item.isActive);
      const activeCareers = careerData.filter((item) => item.isActive);
      setCatalogDefaults({
        faculty: activeFaculties[0] ?? facultyData[0],
        campus: activeCampuses[0] ?? campusData[0],
        format: activeFormats[0] ?? formatData[0],
        career: activeCareers[0] ?? careerData[0]
      });
    }).catch(() => undefined);

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code) return;

    const expectedState = window.sessionStorage.getItem("msal-state");
    const codeVerifier = window.sessionStorage.getItem("msal-code-verifier");
    if (!state || state !== expectedState || !codeVerifier) {
      queueMicrotask(() => setMessage("No se pudo validar el retorno de Microsoft."));
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
        window.location.replace(authenticatedRoute(session.user.mustChangePassword, session.user.email));
      })
      .catch((err: Error) => setMessage(safeAuthMessage(err.message)));
  }, [router]);

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
      setMessage(safeAuthMessage(error instanceof Error ? error.message : "No se pudo iniciar Microsoft SSO."));
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
          startTime: form.get("startTime") || null,
          endDate: form.get("endDate") || startDate,
          endTime: form.get("endTime") || null,
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
        <LoginForm />
        {brand.showOffice365Login && (
          <button className="button secondary full" type="button" title="Iniciar flujo de autenticación Microsoft Entra ID" onClick={microsoftLogin}>
            <Mail size={16} /> Ingresar con Office 365
          </button>
        )}
        <Link className="button secondary full" href="/forgot-password" title="Recuperar contraseña con clave temporal">
          <KeyRound size={16} /> Recuperar contraseña
        </Link>
        {(showPublicPopup || showPublicFullPage) && (
          <div className="login-actions-grid">
            {showPublicPopup && (
              <button className="button secondary full" type="button" title="Abrir formulario público de requerimientos" onClick={() => setIsPublicFormOpen(true)}>
                <ClipboardList size={16} /> Crear requerimiento sin login
              </button>
            )}
            {showPublicFullPage && (
              <Link className="button secondary full" href="/public-requirement" title="Abrir formulario público en página completa">
                <ClipboardList size={16} /> Abrir formulario completo
              </Link>
            )}
          </div>
        )}
        {(message || brand.showDemoCredentials) && <p className="hint"><KeyRound size={14} /> {message || "Usa admin@local.test / Admin123!"}</p>}
      </section>
      {isPublicFormOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel login-public-panel">
            <div className="card-head">
              <div>
                <h2>Crear requerimiento</h2>
                <p>Formulario público sin inicio de sesión</p>
              </div>
              <button className="icon-button" type="button" title="Cerrar formulario público" onClick={() => setIsPublicFormOpen(false)}><X size={16} /></button>
            </div>
            <PublicRequirementForm availability={popupAvailability} onCancel={() => setIsPublicFormOpen(false)} />
          </section>
        </div>
      )}
      {showChatbot && (
        <button className="chatbot-launcher" type="button" title="Asistente Puma para crear requerimientos" onClick={() => setIsChatOpen(true)}>
          {brand.chatbotIcon ? <Image src={brand.chatbotIcon} alt="Puma" width={24} height={24} unoptimized /> : <PawPrint size={24} />}
        </button>
      )}
      {showChatbot && isChatOpen && (
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
            <label className="field"><span>Correo del solicitante</span><input name="requestedBy" type="email" required placeholder="correo@uti.edu.ec" /></label>
            <label className="field"><span>Lugar</span><input name="place" /></label>
            <label className="field"><span>Fecha inicio</span><input name="startDate" type="date" /></label>
            <label className="field"><span>Hora inicio</span><input name="startTime" type="time" /></label>
            <label className="field"><span>Fecha fin</span><input name="endDate" type="date" /></label>
            <label className="field"><span>Hora fin</span><input name="endTime" type="time" /></label>
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

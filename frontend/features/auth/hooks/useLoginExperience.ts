"use client";

import { useEffect, useMemo, useState } from "react";
import { exchangeMicrosoftCode, getMicrosoftAuthConfig } from "../../../core/auth/auth.service";
import { authenticatedRoute, safeAuthMessage } from "../../../core/auth/auth.utils";
import { saveSession } from "../../../core/auth/session";
import { defaultBrandSettings, type BrandSettings } from "../../../core/branding/brand-settings";
import { showToast } from "../../../core/configuration/toast";
import type { PublicRequirementCatalogs, PublicRequirementPayload } from "../../public-requirement/models/public-requirement.models";
import { createPublicRequirement, getPublicBrandSettings, getPublicRequirementCatalogs } from "../../public-requirement/services/public-requirement.service";
import { isPublicFeatureActive } from "../../public-requirement/utils/public-requirement.utils";
import type { ChatRequirementValues } from "../schemas/auth.schemas";
import { microsoftAuthorizeUrl, randomString, sha256Base64Url } from "../utils/pkce.utils";

export function useLoginExperience() {
  const [message, setMessage] = useState(initialAuthError);
  const [brand, setBrand] = useState<BrandSettings>(defaultBrandSettings);
  const [catalogs, setCatalogs] = useState<PublicRequirementCatalogs | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPublicFormOpen, setIsPublicFormOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const availability = useMemo(() => ({
    popup: { enabled: brand.showPublicRequirementForm, activeFrom: brand.publicRequirementFormActiveFrom, activeUntil: brand.publicRequirementFormActiveUntil },
    fullPage: { enabled: brand.showPublicRequirementFullPage, activeFrom: brand.publicRequirementFullPageActiveFrom, activeUntil: brand.publicRequirementFullPageActiveUntil },
    chatbot: { enabled: brand.showLoginChatbot, activeFrom: brand.loginChatbotActiveFrom, activeUntil: brand.loginChatbotActiveUntil }
  }), [brand]);

  useEffect(() => {
    queueMicrotask(() => {
      getPublicBrandSettings().then(setBrand).catch(() => undefined);
      getPublicRequirementCatalogs().then(setCatalogs).catch(() => undefined);
      void completeMicrosoftLogin().catch((error: unknown) => setMessage(safeAuthMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión.")));
    });
  }, []);

  async function microsoftLogin() {
    try {
      const config = await getMicrosoftAuthConfig();
      const codeVerifier = randomString(64);
      const state = randomString(32);
      const redirectUri = window.location.origin + window.location.pathname;
      window.sessionStorage.setItem("msal-state", state);
      window.sessionStorage.setItem("msal-code-verifier", codeVerifier);
      window.location.assign(microsoftAuthorizeUrl(config, redirectUri, state, await sha256Base64Url(codeVerifier)));
    } catch (error) {
      setMessage(safeAuthMessage(error instanceof Error ? error.message : "No se pudo iniciar Microsoft SSO."));
    }
  }

  async function submitChat(values: ChatRequirementValues) {
    if (!catalogs?.faculties[0] || !catalogs.careers[0] || !catalogs.campuses[0] || !catalogs.eventFormats[0]) {
      setChatMessage("No hay catálogos activos suficientes para crear el requerimiento.");
      return false;
    }
    const startDate = values.startDate || new Date().toISOString().slice(0, 10);
    const payload: PublicRequirementPayload = {
      activityOrEvent: values.activityOrEvent.trim(), requestedBy: values.requestedBy.trim(),
      facultyId: catalogs.faculties[0].id, faculty: catalogs.faculties[0].name, career: catalogs.careers[0].name,
      campusId: catalogs.campuses[0].id, campus: catalogs.campuses[0].name, place: values.place.trim() || "Por definir",
      startDate, startTime: values.startTime || null, endDate: values.endDate || startDate, endTime: values.endTime || null,
      eventObjective: values.eventObjective.trim(), eventFormatId: catalogs.eventFormats[0].id,
      eventFormat: catalogs.eventFormats[0].name, requestDate: new Date().toISOString().slice(0, 10)
    };
    try {
      await createPublicRequirement(payload);
      setChatMessage("Listo, el requerimiento fue creado. El equipo lo revisará en seguimiento.");
      showToast("Requerimiento creado desde chatbot.");
      return true;
    } catch (error) {
      setChatMessage(error instanceof Error ? error.message : "No se pudo crear el requerimiento.");
      return false;
    }
  }

  return {
    message, brand, availability, isChatOpen, setIsChatOpen, isPublicFormOpen, setIsPublicFormOpen, chatMessage, microsoftLogin, submitChat,
    catalogsReady: Boolean(catalogs?.faculties[0] && catalogs.careers[0] && catalogs.campuses[0] && catalogs.eventFormats[0]),
    showPublicPopup: isPublicFeatureActive(availability.popup),
    showPublicFullPage: isPublicFeatureActive(availability.fullPage),
    showChatbot: isPublicFeatureActive(availability.chatbot)
  };
}

function initialAuthError() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error_description") ?? params.get("error");
  return error ? safeAuthMessage(error) : "";
}

async function completeMicrosoftLogin() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return;
  const state = params.get("state");
  const expectedState = window.sessionStorage.getItem("msal-state");
  const codeVerifier = window.sessionStorage.getItem("msal-code-verifier");
  if (!state || state !== expectedState || !codeVerifier) throw new Error("No se pudo validar el retorno de Microsoft.");
  const session = await exchangeMicrosoftCode(code, codeVerifier, window.location.origin + window.location.pathname);
  window.sessionStorage.removeItem("msal-state");
  window.sessionStorage.removeItem("msal-code-verifier");
  saveSession(session);
  window.location.replace(authenticatedRoute(session.user.mustChangePassword, session.user.email));
}

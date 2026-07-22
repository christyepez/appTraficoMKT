import { api } from "../api/api-client";
import type { AuthSession } from "./session";

export function loginLocal(email: string, password: string) {
  return api<AuthSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function requestPasswordReset(email: string) {
  return api("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export function changePassword(email: string, currentPassword: string, newPassword: string) {
  return api("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ email, currentPassword, newPassword })
  });
}

export type MicrosoftAuthConfig = {
  tenantId: string;
  clientId: string;
  authority: string;
  scopes: string[];
};

export function getMicrosoftAuthConfig() {
  return api<MicrosoftAuthConfig>("/api/auth/microsoft/config");
}

export function exchangeMicrosoftCode(code: string, codeVerifier: string, redirectUri: string) {
  return api<AuthSession>("/api/auth/microsoft/code", {
    method: "POST",
    body: JSON.stringify({ code, codeVerifier, redirectUri })
  });
}

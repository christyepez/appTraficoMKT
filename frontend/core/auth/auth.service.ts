import { api } from "../../app/lib";
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

import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, getSession, logoutSession, saveSession, type AuthSession } from "./session";

const session = (expiresAt: string, roles = ["Tecnico"]): AuthSession => ({
  accessToken: "opaque-value",
  expiresAt,
  user: { id: "1", name: "Ana", email: "ana@example.com", roles, screenPermissions: [] }
});

describe("auth session adapter", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("persiste y normaliza una sesión vigente", () => {
    const value = session(new Date(Date.now() + 60_000).toISOString());
    saveSession(value);
    expect(getSession()).toEqual(expect.objectContaining({ user: expect.objectContaining({ menuMode: "horizontal" }) }));
  });

  it("descarta sesiones vencidas o inválidas", () => {
    saveSession(session(new Date(Date.now() - 60_000).toISOString()));
    expect(getSession()).toBeNull();
    window.localStorage.setItem("requirements-session", "{");
    expect(getSession()).toBeNull();
  });

  it("limpia sesión, PKCE y registra el logout explícito", () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");
    saveSession(session(new Date(Date.now() + 60_000).toISOString()));
    window.sessionStorage.setItem("msal-state", "state");
    window.sessionStorage.setItem("msal-code-verifier", "verifier");
    logoutSession();
    expect(window.localStorage.getItem("requirements-session")).toBeNull();
    expect(window.sessionStorage.getItem("msal-state")).toBeNull();
    expect(window.sessionStorage.getItem("requirements-explicit-logout")).toBe("1");
    expect(dispatch).toHaveBeenCalled();
    clearSession();
  });
});

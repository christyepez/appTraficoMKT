import { describe, expect, it } from "vitest";
import type { AuthSession } from "../auth/session";
import { canAccessPath, firstAllowedPath, orderedNavigation, visibleNavigation } from "./navigation";

function session(roles: string[], screens: string[]): AuthSession {
  return { accessToken: "opaque", expiresAt: "2099-01-01", user: { id: "1", name: "Ana", email: "ana@example.com", roles, screenPermissions: screens } };
}

describe("navigation permissions", () => {
  it("filtra por pantallas y permite todo al administrador", () => {
    expect(visibleNavigation(session(["Tecnico"], ["activities", "agenda"])).map((item) => item.key)).toEqual(["activities", "agenda"]);
    expect(visibleNavigation(session(["Administrador"], [])).length).toBeGreaterThan(10);
  });

  it("resuelve acceso y primera ruta por rol", () => {
    expect(canAccessPath(session(["Tecnico"], ["activities"]), "/activities")).toBe(true);
    expect(canAccessPath(session(["Tecnico"], ["activities"]), "/users")).toBe(false);
    expect(firstAllowedPath(session(["Aprobador"], ["approvals"]))).toBe("/approvals");
    expect(firstAllowedPath(session(["Consulta"], ["audit"]))).toBe("/audit");
    expect(firstAllowedPath(session(["Consulta"], []))).toBe("/login");
  });

  it("respeta orden configurado y conserva elementos no listados", () => {
    const ordered = orderedNavigation("audit,dashboard");
    expect(ordered.slice(0, 2).map((item) => item.key)).toEqual(["audit", "dashboard"]);
  });
});

import { describe, expect, it } from "vitest";
import type { ManagedUser } from "../models/user.models";
import { defaultScreensForRole, filterUsers, mapUserPayload, matchesUserSearch, userDefaults } from "./user.utils";

const active: ManagedUser = { id: "1", name: "Ana", email: "ana@example.com", authProvider: "Local", allowMicrosoftLogin: false, roles: ["Administrador"], screenPermissions: ["dashboard", "users"], menuMode: "horizontal", menuCollapsed: false, isActive: true };
const inactive: ManagedUser = { ...active, id: "2", name: "Luis", email: "luis@example.com", roles: ["Auditor"], isActive: false };

describe("user utils", () => {
  it("normaliza pantallas por perfil sin compartir referencias", () => {
    expect(defaultScreensForRole("Administrador")).toContain("users");
    expect(defaultScreensForRole("Coordinador")).toContain("approvals");
    expect(defaultScreensForRole("Tecnico")).toContain("agenda");
    expect(defaultScreensForRole("Aprobador")).toEqual(["dashboard", "approvals", "my-notifications"]);
    expect(defaultScreensForRole("Auditor")).toContain("audit");
    expect(defaultScreensForRole("Desconocido")).toEqual(["dashboard"]);
    const first = defaultScreensForRole("Solicitante"); first.push("users");
    expect(defaultScreensForRole("Solicitante")).toEqual(["dashboard"]);
  });

  it("construye valores iniciales de alta y edición", () => {
    expect(userDefaults(null, ["Coordinador"])).toMatchObject({ role: "Coordinador", password: "User123!", isActive: true });
    expect(userDefaults(active, [])).toMatchObject({ role: "Administrador", password: "", authProvider: "Local" });
    expect(userDefaults({ ...active, authProvider: "otro" }, [])).toMatchObject({ authProvider: "Local" });
  });

  it("crea payload limpio y elimina pantallas duplicadas", () => {
    const values = { ...userDefaults(null, ["Administrador"]), name: " Ana ", email: " ana@example.com ", screenPermissions: ["dashboard", "dashboard"] };
    expect(mapUserPayload(values)).toMatchObject({ name: "Ana", email: "ana@example.com", roles: ["Administrador"], screenPermissions: ["dashboard"], facultyId: null, campusId: null });
  });

  it("busca por datos relacionados y filtra activos o inactivos", () => {
    expect(matchesUserSearch(active, "USERS")).toBe(true);
    expect(matchesUserSearch(active, "sin resultado")).toBe(false);
    expect(filterUsers([active, inactive], false, "ana")).toEqual([active]);
    expect(filterUsers([active, inactive], true, "auditor")).toEqual([inactive]);
  });
});

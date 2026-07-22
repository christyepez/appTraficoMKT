import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../app/lib";
import type { ManagedUser, SaveUserPayload } from "../models/user.models";
import { disableUser, getUsersWorkspace, saveUser } from "./user.service";

vi.mock("../../../app/lib", () => ({ api: vi.fn() }));
const apiMock = vi.mocked(api);
const payload: SaveUserPayload = { name: "Ana", email: "ana@example.com", password: "User123!", authProvider: "Microsoft", allowMicrosoftLogin: true, roles: ["Administrador"], screenPermissions: ["dashboard"], facultyId: null, campusId: null, menuMode: "vertical", menuCollapsed: true, isActive: true };
const managed = { id: "1", ...payload, authProvider: "Local" } as ManagedUser;

beforeEach(() => apiMock.mockReset());

describe("user service", () => {
  it("carga usuarios, roles y pantallas en paralelo", async () => {
    apiMock.mockResolvedValueOnce([managed] as never).mockResolvedValueOnce(["Administrador"] as never).mockResolvedValueOnce(["dashboard"] as never);
    await expect(getUsersWorkspace()).resolves.toEqual({ users: [managed], roles: ["Administrador"], screens: ["dashboard"] });
    expect(apiMock).toHaveBeenNthCalledWith(1, "/api/identity/users");
    expect(apiMock).toHaveBeenNthCalledWith(3, "/api/identity/screens");
  });

  it("crea incluyendo proveedor y edita sin mutarlo", async () => {
    apiMock.mockResolvedValue(managed as never);
    await saveUser(null, payload);
    expect(apiMock).toHaveBeenLastCalledWith("/api/identity/users", expect.objectContaining({ method: "POST", body: expect.stringContaining("authProvider") }));
    await saveUser(managed, payload);
    const options = apiMock.mock.calls.at(-1)?.[1];
    expect(apiMock).toHaveBeenLastCalledWith("/api/identity/users/1", expect.objectContaining({ method: "PUT" }));
    expect(JSON.parse(String(options?.body))).not.toHaveProperty("authProvider");
  });

  it("inactiva mediante el endpoint existente", async () => {
    apiMock.mockResolvedValue({} as never);
    await disableUser("id especial");
    expect(apiMock).toHaveBeenCalledWith("/api/identity/users/id especial", { method: "DELETE" });
  });
});

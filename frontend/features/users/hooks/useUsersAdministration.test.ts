import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSession, showToast } from "../../../app/lib";
import type { ManagedUser, SaveUserPayload } from "../models/user.models";
import { disableUser, getUsersWorkspace, saveUser } from "../services/user.service";
import { useUsersAdministration } from "./useUsersAdministration";

vi.mock("../../../app/lib", () => ({ getSession: vi.fn(), showToast: vi.fn() }));
vi.mock("../services/user.service", () => ({ getUsersWorkspace: vi.fn(), saveUser: vi.fn(), disableUser: vi.fn() }));
const loadMock = vi.mocked(getUsersWorkspace), saveMock = vi.mocked(saveUser), disableMock = vi.mocked(disableUser);
const managed = { id: "1", name: "Ana", email: "ana@example.com", authProvider: "Local", allowMicrosoftLogin: false, roles: ["Administrador"], screenPermissions: ["dashboard"], menuMode: "horizontal", menuCollapsed: false, isActive: true } as ManagedUser;
const payload = { ...managed, password: "User123!", facultyId: null, campusId: null } as SaveUserPayload;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockReturnValue({} as never);
  loadMock.mockResolvedValue({ users: [managed], roles: ["Administrador"], screens: ["dashboard"] });
  saveMock.mockResolvedValue(managed);
  disableMock.mockResolvedValue({} as never);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("useUsersAdministration", () => {
  it("carga y actualiza el workspace", async () => {
    const { result, unmount } = renderHook(() => useUsersAdministration(60_000));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.users).toEqual([managed]);
    await act(async () => { await result.current.refresh(); });
    expect(loadMock).toHaveBeenCalledTimes(2);
    unmount();
  });

  it("crea, edita e inactiva con confirmación", async () => {
    const { result, unmount } = renderHook(() => useUsersAdministration(60_000));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.save(null, payload); await result.current.save(managed, payload); });
    expect(saveMock).toHaveBeenNthCalledWith(1, null, payload);
    expect(result.current.message).toBe("Usuario editado.");
    await act(async () => { expect(await result.current.disable("1")).toBe(true); });
    expect(disableMock).toHaveBeenCalledWith("1");
    unmount();
  });

  it("respeta cancelación, evita dobles acciones y presenta errores", async () => {
    loadMock.mockRejectedValueOnce(new Error("Sin conexión"));
    const { result, unmount } = renderHook(() => useUsersAdministration(60_000));
    await waitFor(() => expect(result.current.loadError).toBe("Sin conexión"));
    expect(showToast).toHaveBeenCalledWith("Sin conexión", "error");
    await act(async () => { await result.current.refresh(); });
    vi.mocked(window.confirm).mockReturnValue(false);
    await act(async () => { expect(await result.current.disable("1")).toBe(false); });
    disableMock.mockRejectedValueOnce(new Error("No permitido"));
    vi.mocked(window.confirm).mockReturnValue(true);
    await act(async () => { expect(await result.current.disable("1")).toBe(false); });
    expect(showToast).toHaveBeenCalledWith("No permitido", "error");
    unmount();
  });
});

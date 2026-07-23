import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../core/api/api-client";
import { clearShellBrandCache, getCachedShellBrand, getShellBrand, getUnreadNotifications } from "./shell.service";

vi.mock("../../../core/api/api-client", () => ({ api: vi.fn() }));

describe("shell service", () => {
  beforeEach(() => {
    vi.mocked(api).mockReset();
    clearShellBrandCache();
  });
  it("combina marca y consulta notificaciones con parámetros codificados", async () => {
    vi.mocked(api).mockResolvedValueOnce({ title: "Marca" } as never);
    expect((await getShellBrand()).title).toBe("Marca");
    expect(getCachedShellBrand()?.title).toBe("Marca");
    expect((await getShellBrand()).title).toBe("Marca");
    expect(api).toHaveBeenCalledTimes(1);
    vi.mocked(api).mockResolvedValueOnce({ count: 4 } as never);
    expect(await getUnreadNotifications({ user: { email: "ana+test@example.com", name: "Ana Pérez" } } as never)).toBe(4);
    expect(api).toHaveBeenLastCalledWith(expect.stringContaining("ana%2Btest%40example.com"));
  });
  it("actualiza explícitamente la marca almacenada", async () => {
    vi.mocked(api).mockResolvedValueOnce({ title: "Inicial" } as never).mockResolvedValueOnce({ title: "Actualizada" } as never);
    await getShellBrand();
    expect((await getShellBrand({ refresh: true })).title).toBe("Actualizada");
    expect(getCachedShellBrand()?.title).toBe("Actualizada");
  });
  it("evita consulta sin correo", async () => {
    expect(await getUnreadNotifications({ user: { email: "" } } as never)).toBe(0);
    expect(api).not.toHaveBeenCalled();
  });
});

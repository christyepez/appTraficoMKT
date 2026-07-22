import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../core/api/api-client";
import { getShellBrand, getUnreadNotifications } from "./shell.service";

vi.mock("../../../core/api/api-client", () => ({ api: vi.fn() }));

describe("shell service", () => {
  beforeEach(() => vi.mocked(api).mockReset());
  it("combina marca y consulta notificaciones con parámetros codificados", async () => {
    vi.mocked(api).mockResolvedValueOnce({ title: "Marca" } as never);
    expect((await getShellBrand()).title).toBe("Marca");
    vi.mocked(api).mockResolvedValueOnce({ count: 4 } as never);
    expect(await getUnreadNotifications({ user: { email: "ana+test@example.com", name: "Ana Pérez" } } as never)).toBe(4);
    expect(api).toHaveBeenLastCalledWith(expect.stringContaining("ana%2Btest%40example.com"));
  });
  it("evita consulta sin correo", async () => {
    expect(await getUnreadNotifications({ user: { email: "" } } as never)).toBe(0);
    expect(api).not.toHaveBeenCalled();
  });
});

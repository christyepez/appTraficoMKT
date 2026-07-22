import { afterEach, describe, expect, it, vi } from "vitest";
import { getSession } from "../auth/session";
import { showToast } from "../configuration/toast";
import { api, friendlyHttpMessage } from "./api-client";

vi.mock("../auth/session", () => ({ getSession: vi.fn() }));
vi.mock("../configuration/toast", () => ({ showToast: vi.fn() }));

describe("api client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("agrega autenticación y serialización sin cambiar fetch", async () => {
    vi.mocked(getSession).mockReturnValue({ accessToken: "opaque", user: {} } as never);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: vi.fn().mockResolvedValue({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    await expect(api("/api/items", { method: "POST", body: "{}" })).resolves.toEqual({ ok: true });
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer opaque");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("normaliza errores y omite cuerpo 204", async () => {
    vi.mocked(getSession).mockReturnValue(null);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, text: vi.fn().mockResolvedValue("") }));
    await expect(api("/api/items")).rejects.toThrow("No tiene permisos");
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining("permisos"), "error");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204 }));
    await expect(api("/api/items")).resolves.toBeUndefined();
    expect(friendlyHttpMessage(500, "")).toBe("Error HTTP 500");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/api-client";
import { changePassword, exchangeMicrosoftCode, getMicrosoftAuthConfig, loginLocal, requestPasswordReset } from "./auth.service";

vi.mock("../api/api-client", () => ({ api: vi.fn() }));

describe("auth service", () => {
  beforeEach(() => vi.mocked(api).mockReset().mockResolvedValue({}));

  it("mantiene los contratos de acceso", async () => {
    await loginLocal("ana@example.com", "clave");
    expect(api).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ method: "POST" }));
    await requestPasswordReset("ana@example.com");
    expect(api).toHaveBeenCalledWith("/api/auth/forgot-password", expect.anything());
    await changePassword("ana@example.com", "actual", "nueva");
    expect(api).toHaveBeenCalledWith("/api/auth/change-password", expect.anything());
    await getMicrosoftAuthConfig();
    expect(api).toHaveBeenCalledWith("/api/auth/microsoft/config");
    await exchangeMicrosoftCode("code", "verifier", "https://app/login");
    expect(api).toHaveBeenCalledWith("/api/auth/microsoft/code", expect.objectContaining({ method: "POST" }));
  });
});

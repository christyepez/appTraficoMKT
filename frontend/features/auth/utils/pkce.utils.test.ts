import { describe, expect, it } from "vitest";
import { microsoftAuthorizeUrl, sha256Base64Url } from "./pkce.utils";

describe("PKCE", () => {
  it("genera challenge base64url y URL de autorizacion", async () => {
    expect(await sha256Base64Url("verifier")).toMatch(/^[A-Za-z0-9_-]+$/);
    const value = new URL(microsoftAuthorizeUrl({ authority: "https://login.test", clientId: "client", scopes: ["openid", "email"] }, "https://app.test/login", "state", "challenge"));
    expect(value.searchParams.get("code_challenge")).toBe("challenge");
    expect(value.searchParams.get("scope")).toBe("openid email");
  });
});

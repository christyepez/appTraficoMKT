export function randomString(length: number, cryptoValue: Crypto = crypto) {
  const bytes = new Uint8Array(length);
  cryptoValue.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ("0" + byte.toString(16)).slice(-2)).join("");
}

export async function sha256Base64Url(value: string, cryptoValue: Crypto = crypto) {
  const data = new TextEncoder().encode(value);
  const digest = await cryptoValue.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function microsoftAuthorizeUrl(config: { authority: string; clientId: string; scopes: string[] }, redirectUri: string, state: string, codeChallenge: string) {
  const authorize = new URL(`${config.authority}/oauth2/v2.0/authorize`);
  authorize.searchParams.set("client_id", config.clientId);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_mode", "query");
  authorize.searchParams.set("scope", config.scopes.join(" "));
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", codeChallenge);
  authorize.searchParams.set("code_challenge_method", "S256");
  return authorize.toString();
}

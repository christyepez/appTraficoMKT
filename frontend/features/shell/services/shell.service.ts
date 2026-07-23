import { api } from "../../../core/api/api-client";
import type { AuthSession } from "../../../core/auth/session";
import { defaultBrandSettings, type BrandSettings } from "../../../core/branding/brand-settings";

let cachedShellBrand: BrandSettings | null = null;

export function getCachedShellBrand(): BrandSettings | null {
  return cachedShellBrand;
}

export async function getShellBrand({ refresh = false }: { refresh?: boolean } = {}): Promise<BrandSettings> {
  if (!refresh && cachedShellBrand) return cachedShellBrand;
  const brand = await api<BrandSettings>("/api/identity/brand-settings");
  cachedShellBrand = { ...defaultBrandSettings, ...brand };
  return cachedShellBrand;
}

export function clearShellBrandCache() {
  cachedShellBrand = null;
}

export async function getUnreadNotifications(session: AuthSession) {
  if (!session.user.email) return 0;
  const query = new URLSearchParams({ email: session.user.email, name: session.user.name ?? "" });
  const result = await api<{ count: number }>(`/api/notification-records/unread-count?${query}`);
  return result.count;
}

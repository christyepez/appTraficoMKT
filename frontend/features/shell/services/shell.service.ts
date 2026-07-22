import { api } from "../../../core/api/api-client";
import type { AuthSession } from "../../../core/auth/session";
import { defaultBrandSettings, type BrandSettings } from "../../../core/branding/brand-settings";

export async function getShellBrand(): Promise<BrandSettings> {
  const brand = await api<BrandSettings>("/api/identity/brand-settings");
  return { ...defaultBrandSettings, ...brand };
}

export async function getUnreadNotifications(session: AuthSession) {
  if (!session.user.email) return 0;
  const query = new URLSearchParams({ email: session.user.email, name: session.user.name ?? "" });
  const result = await api<{ count: number }>(`/api/notification-records/unread-count?${query}`);
  return result.count;
}

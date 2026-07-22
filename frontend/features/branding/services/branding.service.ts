import { api } from "../../../app/lib";
import { defaultBrandSettings } from "../../../core/branding/brand-settings";
import type { BrandSettings } from "../models/branding.models";

export async function getBrandSettings(): Promise<BrandSettings> {
  const settings = await api<Partial<BrandSettings>>("/api/identity/brand-settings");
  return { ...defaultBrandSettings, ...settings };
}

export async function putBrandSettings(settings: BrandSettings): Promise<BrandSettings> {
  const saved = await api<Partial<BrandSettings>>("/api/identity/brand-settings", { method: "PUT", body: JSON.stringify(settings) });
  return { ...defaultBrandSettings, ...saved };
}

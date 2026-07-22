"use client";
import { useCallback, useEffect, useState } from "react";
import { showToast } from "../../../app/lib";
import { applyBrandVariables, defaultBrandSettings } from "../../../core/branding/brand-settings";
import type { BrandSettings } from "../models/branding.models";
import { getBrandSettings, putBrandSettings } from "../services/branding.service";

export function useBrandSettings() {
  const [settings, setSettings] = useState<BrandSettings>(defaultBrandSettings), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("Configuración institucional cargada.");
  const load = useCallback(async () => { setLoading(true); try { const value = await getBrandSettings(); setSettings(value); applyBrandVariables(value); setError(""); } catch (cause) { const feedback = cause instanceof Error ? cause.message : "No se pudo cargar la configuración de marca."; setError(feedback); showToast(feedback, "error"); } finally { setLoading(false); } }, []);
  useEffect(() => { let current = true; getBrandSettings().then((value) => { if (!current) return; setSettings(value); applyBrandVariables(value); setError(""); }).catch((cause) => { if (!current) return; const feedback = cause instanceof Error ? cause.message : "No se pudo cargar la configuración de marca."; setError(feedback); showToast(feedback, "error"); }).finally(() => { if (current) setLoading(false); }); return () => { current = false; }; }, []);
  const save = useCallback(async (value: BrandSettings) => { if (saving) return; setSaving(true); try { const saved = await putBrandSettings(value); setSettings(saved); applyBrandVariables(saved); window.dispatchEvent(new Event("brand-settings-changed")); setMessage("Marca guardada correctamente."); showToast("Marca global guardada correctamente."); } catch (cause) { const feedback = cause instanceof Error ? cause.message : "No se pudo guardar la configuración de marca."; showToast(feedback, "error"); throw cause; } finally { setSaving(false); } }, [saving]);
  const restore = useCallback(async () => { if (!window.confirm("¿Restaurar los valores institucionales de marca?")) return false; await save(defaultBrandSettings); setMessage("Marca restaurada a valores Indoamérica."); return true; }, [save]);
  return { settings, loading, saving, error, message, reload: load, save, restore };
}
export type BrandSettingsWorkspace = ReturnType<typeof useBrandSettings>;

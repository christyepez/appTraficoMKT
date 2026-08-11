"use client";

import { useCallback, useEffect, useState } from "react";
import { getPublicBrandSettings } from "../services/public-requirement.service";
import type { PublicAvailability } from "../models/public-requirement.models";
import { defaultBrandSettings, type BrandSettings } from "../../../core/branding/brand-settings";

export function usePublicRequirementAvailability(loadBrand = getPublicBrandSettings) {
  const [availability, setAvailability] = useState<PublicAvailability | null>(null);
  const [brand, setBrand] = useState<BrandSettings>(defaultBrandSettings);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const brand = await loadBrand();
      setBrand(brand);
      setAvailability({ enabled: brand.showPublicRequirementFullPage, activeFrom: brand.publicRequirementFullPageActiveFrom, activeUntil: brand.publicRequirementFullPageActiveUntil });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo validar la disponibilidad del formulario.");
    } finally {
      setLoading(false);
    }
  }, [loadBrand]);

  useEffect(() => { queueMicrotask(() => void reload()); }, [reload]);
  return { availability, brand, error, loading, reload };
}

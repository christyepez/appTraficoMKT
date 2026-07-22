"use client";

import { useCallback, useEffect, useState } from "react";
import { getPublicBrandSettings } from "../services/public-requirement.service";
import type { PublicAvailability } from "../models/public-requirement.models";

export function usePublicRequirementAvailability(loadBrand = getPublicBrandSettings) {
  const [availability, setAvailability] = useState<PublicAvailability | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const brand = await loadBrand();
      setAvailability({ enabled: brand.showPublicRequirementFullPage, activeFrom: brand.publicRequirementFullPageActiveFrom, activeUntil: brand.publicRequirementFullPageActiveUntil });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo validar la disponibilidad del formulario.");
    } finally {
      setLoading(false);
    }
  }, [loadBrand]);

  useEffect(() => { queueMicrotask(() => void reload()); }, [reload]);
  return { availability, error, loading, reload };
}

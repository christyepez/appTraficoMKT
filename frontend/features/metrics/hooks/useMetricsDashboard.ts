"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSession, showToast } from "../../../app/lib";
import type { MetricsConcept, MetricsWorkspaceData } from "../models/metrics.models";
import { getMetricsWorkspace } from "../services/metrics.service";
import { hasMetricData } from "../utils/metrics.utils";

const emptyData: MetricsWorkspaceData = { requirements: null, products: null, approvals: null, usage: null, activities: [], warnings: [] };

export function useMetricsDashboard(pollInterval = 30_000) {
  const [data, setData] = useState<MetricsWorkspaceData>(emptyData);
  const [concept, setConcept] = useState<MetricsConcept>("summary");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const activeLoad = useRef<Promise<void> | null>(null);

  const load = useCallback((initial = false) => {
    if (activeLoad.current) return activeLoad.current;
    const request = (async () => {
      initial ? setIsLoading(true) : setIsRefreshing(true);
      try {
        const workspace = await getMetricsWorkspace();
        const available = hasMetricData([workspace.requirements, workspace.products, workspace.approvals, workspace.usage]);
        setData(workspace);
        setLoadError(available ? "" : "No se pudieron cargar los indicadores generales.");
        if (!available && !getSession()) window.location.assign("/login");
      } catch (error) {
        const feedback = error instanceof Error ? error.message : "No se pudieron cargar las métricas.";
        setLoadError(feedback); if (initial) showToast(feedback, "error"); throw error;
      } finally { setIsLoading(false); setIsRefreshing(false); }
    })();
    activeLoad.current = request;
    void request.finally(() => { if (activeLoad.current === request) activeLoad.current = null; }).catch(() => undefined);
    return request;
  }, []);

  useEffect(() => { void load(true).catch(() => undefined); const timer = window.setInterval(() => void load(false).catch(() => undefined), pollInterval); return () => window.clearInterval(timer); }, [load, pollInterval]);

  return { ...data, concept, setConcept, isLoading, isRefreshing, loadError, refresh: () => load(false) };
}

export type MetricsDashboardWorkspace = ReturnType<typeof useMetricsDashboard>;

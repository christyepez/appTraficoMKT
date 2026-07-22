"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSession, showToast } from "../../../app/lib";
import type { AuditRow, AuditSource } from "../models/audit.models";
import { getAuditWorkspace } from "../services/audit.service";
import { filterAuditRows, normalizeAuditRows } from "../utils/audit.utils";

export function useAuditLog(pollInterval = 30_000) {
  const [rows, setRows] = useState<AuditRow[]>([]), [source, setSource] = useState<AuditSource>("Todas"), [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true), [isRefreshing, setIsRefreshing] = useState(false), [loadError, setLoadError] = useState(""), [warnings, setWarnings] = useState<string[]>([]);
  const activeLoad = useRef<Promise<void> | null>(null);
  const load = useCallback((initial = false) => {
    if (activeLoad.current) return activeLoad.current;
    const request = (async () => { initial ? setIsLoading(true) : setIsRefreshing(true); try { const data = await getAuditWorkspace(); const normalized = normalizeAuditRows(data.requirements, data.products, data.approvals); setRows(normalized); setWarnings(data.warnings); setLoadError(data.warnings.length === 3 ? "No se pudieron cargar los eventos de auditoría." : ""); if (data.warnings.length === 3 && !getSession()) window.location.assign("/login"); } catch (error) { const feedback = error instanceof Error ? error.message : "No se pudo cargar la auditoría."; setLoadError(feedback); if (initial) showToast(feedback, "error"); throw error; } finally { setIsLoading(false); setIsRefreshing(false); } })();
    activeLoad.current = request; void request.finally(() => { if (activeLoad.current === request) activeLoad.current = null; }).catch(() => undefined); return request;
  }, []);
  useEffect(() => { void load(true).catch(() => undefined); const timer = window.setInterval(() => void load(false).catch(() => undefined), pollInterval); return () => window.clearInterval(timer); }, [load, pollInterval]);
  const filteredRows = useMemo(() => filterAuditRows(rows, source, search), [rows, source, search]);
  return { rows, filteredRows, source, setSource, search, setSearch, warnings, isLoading, isRefreshing, loadError, refresh: () => load(false) };
}

export type AuditLogWorkspace = ReturnType<typeof useAuditLog>;

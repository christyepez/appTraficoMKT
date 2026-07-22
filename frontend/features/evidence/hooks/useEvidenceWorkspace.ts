"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSession, showToast } from "../../../app/lib";
import type { Activity, Approval, EvidenceItem } from "../models/evidence.models";
import { createExternalEvidence, deleteEvidence, getEvidenceWorkspace, markEvidenceAttached, uploadEvidence } from "../services/evidence.service";
import { filterProductsForSession, filterRequirementsForSession } from "../../../shared/utils/session-visibility.utils";

export function useEvidenceWorkspace(pollInterval = 10_000) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const activeLoad = useRef<Promise<void> | null>(null);
  const pendingRef = useRef(new Set<string>());

  const load = useCallback((initial = false) => {
    if (activeLoad.current) return activeLoad.current;
    const request = (async () => {
      initial ? setIsInitialLoading(true) : setIsRefreshing(true);
      try {
        const session = getSession();
        const workspace = await getEvidenceWorkspace();
        const requirements = filterRequirementsForSession(workspace.requirements, session);
        const visibleActivities = filterProductsForSession(workspace.activities, requirements, session);
        const activityIds = new Set(visibleActivities.map((activity) => activity.id));
        setActivities(visibleActivities);
        setEvidence(workspace.evidence.filter((item) => activityIds.has(item.activityId)));
        setApprovals(workspace.approvals.filter((item) => activityIds.has(item.activityId)));
        setLoadError("");
      } catch (error) {
        const feedback = error instanceof Error ? error.message : "No se pudieron cargar las evidencias.";
        setLoadError(feedback);
        if (initial) showToast(feedback, "error");
        if (!getSession()) window.location.assign("/login");
        throw error;
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    })();
    activeLoad.current = request;
    void request.finally(() => { if (activeLoad.current === request) activeLoad.current = null; }).catch(() => undefined);
    return request;
  }, []);

  const refreshAfterMutation = useCallback(async () => {
    if (activeLoad.current) await activeLoad.current.catch(() => undefined);
    await load(false);
  }, [load]);

  const report = useCallback((feedback: string, error = false) => {
    setMessage(feedback);
    showToast(feedback, error ? "error" : undefined);
  }, []);

  const withPending = useCallback(async (key: string, operation: () => Promise<void>) => {
    if (pendingRef.current.has(key)) return false;
    pendingRef.current.add(key);
    setPendingIds(new Set(pendingRef.current));
    try {
      await operation();
      await refreshAfterMutation();
      return true;
    } catch (error) {
      report(error instanceof Error ? error.message : "No se pudo completar la operación.", true);
      return false;
    } finally {
      pendingRef.current.delete(key);
      setPendingIds(new Set(pendingRef.current));
    }
  }, [refreshAfterMutation, report]);

  const uploadFile = useCallback((activityId: string, file: File, uploadedBy: string) => withPending(activityId, async () => {
    const form = new FormData();
    form.set("activityId", activityId);
    form.set("file", file);
    form.set("uploadedBy", uploadedBy);
    await uploadEvidence(form);
    await markEvidenceAttached(activityId);
    report("Evidencia adjuntada correctamente.");
  }), [report, withPending]);

  const uploadUrl = useCallback((activityId: string, fileName: string, storageUrl: string, uploadedBy: string) => withPending(activityId, async () => {
    await createExternalEvidence({ activityId, fileName, contentType: "text/uri-list", storageUrl, uploadedBy });
    await markEvidenceAttached(activityId);
    report("Evidencia adjuntada correctamente.");
  }), [report, withPending]);

  const remove = useCallback((evidenceId: string) => {
    if (!window.confirm("¿Eliminar lógicamente esta evidencia? El archivo físico no se borrará.")) return Promise.resolve(false);
    return withPending(evidenceId, async () => {
      await deleteEvidence(evidenceId);
      report("Evidencia eliminada lógicamente.");
    });
  }, [report, withPending]);

  useEffect(() => {
    const refresh = () => void load(false).catch(() => undefined);
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") refresh(); };
    void load(true).catch(() => undefined);
    const timer = window.setInterval(refresh, pollInterval);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [load, pollInterval]);

  return { activities, evidence, approvals, isInitialLoading, isRefreshing, loadError, message, pendingIds, refresh: () => load(false), uploadFile, uploadUrl, remove };
}

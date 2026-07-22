"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSession, showToast } from "../../../app/lib";
import type { Activity, Approval, ApprovalDecision, EvidenceItem } from "../models/approval.models";
import { getApprovalWorkspace, submitApproval } from "../services/approval.service";
import { canDecideApprovals, filterApprovalActivities } from "../utils/approval.utils";

export function useApprovalsWorkspace(pollInterval = 15_000) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [showApproved, setShowApproved] = useState(false);
  const [search, setSearch] = useState("");
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
        const data = await getApprovalWorkspace();
        setActivities(data.activities);
        setEvidence(data.evidence);
        setApprovals(data.approvals);
        setLoadError("");
      } catch (error) {
        const feedback = error instanceof Error ? error.message : "No se pudieron cargar las aprobaciones.";
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

  const decide = useCallback(async (activityId: string, decision: ApprovalDecision, comments: string) => {
    if (pendingRef.current.has(activityId) || !canDecideApprovals(getSession())) return false;
    pendingRef.current.add(activityId);
    setPendingIds(new Set(pendingRef.current));
    try {
      const session = getSession();
      await submitApproval(activityId, { decision, approvedBy: session?.user.name ?? session?.user.email ?? "Aprobador", comments });
      const feedback = decision === "Approved" ? "Producto aprobado correctamente." : "Producto rechazado correctamente.";
      setMessage(feedback);
      showToast(feedback);
      if (activeLoad.current) await activeLoad.current.catch(() => undefined);
      await load(false);
      return true;
    } catch (error) {
      const feedback = error instanceof Error ? error.message : "No se pudo registrar la decisión.";
      setMessage(feedback);
      showToast(feedback, "error");
      return false;
    } finally {
      pendingRef.current.delete(activityId);
      setPendingIds(new Set(pendingRef.current));
    }
  }, [load]);

  useEffect(() => {
    void load(true).catch(() => undefined);
    const timer = window.setInterval(() => void load(false).catch(() => undefined), pollInterval);
    return () => window.clearInterval(timer);
  }, [load, pollInterval]);

  const visibleActivities = useMemo(() => filterApprovalActivities(activities, showApproved, search), [activities, search, showApproved]);
  return { activities: visibleActivities, allActivities: activities, evidence, approvals, showApproved, setShowApproved, search, setSearch, canDecide: canDecideApprovals(getSession()), isInitialLoading, isRefreshing, loadError, message, pendingIds, refresh: () => load(false), decide };
}

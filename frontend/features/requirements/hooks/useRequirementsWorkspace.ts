"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSession, showToast } from "../../../app/lib";
import type { Activity } from "../../../shared/models/api.models";
import type { Requirement, RequirementCatalogs, RequirementPermissions, RequirementStatusAction, SaveRequirementPayload } from "../models/requirement.models";
import { deleteRequirement, getRequirementWorkspace, saveRequirement, updateRequirementStatus } from "../services/requirement.service";
import { filterRequirementsForSession, requirementPermissions } from "../utils/requirement.utils";

const emptyCatalogs: RequirementCatalogs = { faculties: [], careers: [], campuses: [], eventFormats: [] };

export function useRequirementsWorkspace(pollInterval = 15_000) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [catalogs, setCatalogs] = useState<RequirementCatalogs>(emptyCatalogs);
  const [permissions, setPermissions] = useState<RequirementPermissions>({ canCreate: false, canManage: false });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingRequirementIds, setPendingRequirementIds] = useState<Set<string>>(() => new Set());
  const activeLoad = useRef<Promise<void> | null>(null);
  const pendingRef = useRef(new Set<string>());

  const load = useCallback((initial = false) => {
    if (activeLoad.current) return activeLoad.current;
    const request = (async () => {
      initial ? setIsInitialLoading(true) : setIsRefreshing(true);
      try {
        const session = getSession();
        const workspace = await getRequirementWorkspace();
        const visible = filterRequirementsForSession(workspace.requirements, workspace.activities, session);
        const visibleIds = new Set(visible.map((item) => item.id));
        setRequirements(visible);
        setActivities(workspace.activities.filter((item) => visibleIds.has(item.requirementId)));
        setCatalogs(workspace.catalogs);
        setPermissions(requirementPermissions(session));
        setLoadError("");
      } catch (error) {
        const feedback = error instanceof Error ? error.message : "No se pudieron cargar los requerimientos.";
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

  const report = useCallback((feedback: string, type: "success" | "error" = "success") => {
    setMessage(feedback);
    showToast(feedback, type === "error" ? "error" : undefined);
  }, []);

  const save = useCallback(async (requirement: Requirement | null, payload: SaveRequirementPayload) => {
    await saveRequirement(requirement, payload);
    await refreshAfterMutation();
  }, [refreshAfterMutation]);

  const changeStatus = useCallback(async (requirementId: string, action: RequirementStatusAction) => {
    if (!startPending(pendingRef.current, requirementId)) return false;
    setPendingRequirementIds(new Set(pendingRef.current));
    try {
      await updateRequirementStatus(requirementId, action);
      report("Estado actualizado correctamente.");
      await refreshAfterMutation();
      return true;
    } catch (error) {
      report(error instanceof Error ? error.message : "No se pudo actualizar el estado.", "error");
      return false;
    } finally {
      pendingRef.current.delete(requirementId);
      setPendingRequirementIds(new Set(pendingRef.current));
    }
  }, [refreshAfterMutation, report]);

  const remove = useCallback(async (requirementId: string) => {
    if (pendingRef.current.has(requirementId) || !window.confirm("¿Eliminar este requerimiento? También se eliminarán lógicamente sus productos asociados.")) return false;
    startPending(pendingRef.current, requirementId);
    setPendingRequirementIds(new Set(pendingRef.current));
    try {
      await deleteRequirement(requirementId);
      report("Requerimiento eliminado correctamente.");
      await refreshAfterMutation();
      return true;
    } catch (error) {
      report(error instanceof Error ? error.message : "No se pudo eliminar el requerimiento.", "error");
      return false;
    } finally {
      pendingRef.current.delete(requirementId);
      setPendingRequirementIds(new Set(pendingRef.current));
    }
  }, [refreshAfterMutation, report]);

  useEffect(() => {
    const refresh = () => void load(false).catch(() => undefined);
    const refreshVisible = () => { if (document.visibilityState === "visible") refresh(); };
    void load(true).catch(() => undefined);
    const timer = window.setInterval(refresh, pollInterval);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [load, pollInterval]);

  return { requirements, activities, catalogs, permissions, isInitialLoading, isRefreshing, loadError, message, pendingRequirementIds, refresh: () => load(false), save, changeStatus, remove, report };
}

function startPending(values: Set<string>, id: string) {
  if (values.has(id)) return false;
  values.add(id);
  return true;
}

export type RequirementsWorkspace = ReturnType<typeof useRequirementsWorkspace>;

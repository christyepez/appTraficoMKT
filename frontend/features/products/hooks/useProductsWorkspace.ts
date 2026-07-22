"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { defaultBrandSettings, getSession, showToast } from "../../../app/lib";
import type { Requirement } from "../../../shared/models/api.models";
import type { Approval, EvidenceItem, Product, ProductCatalogs, ProductStatusAction, SaveProductPayload, Technician } from "../models/product.models";
import { createExternalProductEvidence, deleteProduct, deleteProductEvidence, getProductWorkspace, saveProduct, updateProductStatus, uploadProductEvidence } from "../services/product.service";
import { buildNextProductId, filterProductsForSession, filterRequirementsForSession } from "../utils/product.utils";

const emptyCatalogs: ProductCatalogs = {
  requirementTypes: [],
  targetAudiences: [],
  productTypes: [],
  diffusionChannels: [],
  mainKpis: []
};

export function useProductsWorkspace(pollInterval = 15_000) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [catalogs, setCatalogs] = useState<ProductCatalogs>(emptyCatalogs);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [suggestedProductId, setSuggestedProductId] = useState("PROD-0001");
  const [showProductIdField, setShowProductIdField] = useState(defaultBrandSettings.showProductIdField);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(() => new Set());
  const [pendingEvidenceIds, setPendingEvidenceIds] = useState<Set<string>>(() => new Set());
  const activeLoad = useRef<Promise<void> | null>(null);
  const pendingProductIdsRef = useRef<Set<string>>(new Set());
  const pendingEvidenceIdsRef = useRef<Set<string>>(new Set());

  const load = useCallback((initial = false) => {
    if (activeLoad.current) return activeLoad.current;

    const request = (async () => {
      initial ? setIsInitialLoading(true) : setIsRefreshing(true);
      try {
        const session = getSession();
        const workspace = await getProductWorkspace();
        const visibleRequirements = filterRequirementsForSession(workspace.requirements, session);
        const visibleProducts = filterProductsForSession(workspace.products, visibleRequirements, session);
        const visibleProductIds = new Set(visibleProducts.map((product) => product.id));
        const fallbackUser = session
          ? [{ id: session.user.id, name: session.user.name, email: session.user.email, roles: session.user.roles, isActive: true }]
          : [];
        const technicalUsers = workspace.technicians.filter(isActiveTechnician);

        setRequirements(visibleRequirements);
        setProducts(visibleProducts);
        setEvidence(workspace.evidence.filter((item) => visibleProductIds.has(item.activityId)));
        setApprovals(workspace.approvals.filter((item) => visibleProductIds.has(item.activityId)));
        setTechnicians(technicalUsers.length ? technicalUsers : fallbackUser);
        setCatalogs(workspace.catalogs);
        setSuggestedProductId(workspace.nextProductId ?? buildNextProductId(workspace.products));
        setShowProductIdField(workspace.showProductIdField);
        setLoadError("");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "No se pudo cargar productos.";
        setLoadError(errorMessage);
        if (initial) showToast(errorMessage, "error");
        if (!getSession()) window.location.assign("/login");
        throw error;
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    })();

    activeLoad.current = request;
    void request.finally(() => {
      if (activeLoad.current === request) activeLoad.current = null;
    }).catch(() => undefined);
    return request;
  }, []);

  const refreshAfterMutation = useCallback(async () => {
    if (activeLoad.current) await activeLoad.current.catch(() => undefined);
    await load(false);
  }, [load]);

  const reportFeedback = useCallback((feedback: string, type: "success" | "error" = "success") => {
    setMessage(feedback);
    showToast(feedback, type === "error" ? "error" : undefined);
  }, []);

  const save = useCallback(async (product: Product | null, payload: SaveProductPayload) => {
    await saveProduct(product, payload);
    await refreshAfterMutation();
  }, [refreshAfterMutation]);

  const changeStatus = useCallback(async (productId: string, action: Exclude<ProductStatusAction, "evidence-attached">) => {
    if (!startPending(pendingProductIdsRef.current, productId)) return;
    setPendingProductIds(new Set(pendingProductIdsRef.current));
    try {
      await updateProductStatus(productId, action);
      reportFeedback("Estado actualizado correctamente.");
      await refreshAfterMutation();
    } catch (error) {
      reportFeedback(error instanceof Error ? error.message : "No se pudo actualizar el estado.", "error");
    } finally {
      finishPending(pendingProductIdsRef.current, productId);
      setPendingProductIds(new Set(pendingProductIdsRef.current));
    }
  }, [refreshAfterMutation, reportFeedback]);

  const remove = useCallback(async (productId: string) => {
    if (pendingProductIdsRef.current.has(productId) || !window.confirm("¿Eliminar este producto? El registro quedará eliminado de forma lógica.")) return;
    startPending(pendingProductIdsRef.current, productId);
    setPendingProductIds(new Set(pendingProductIdsRef.current));
    try {
      await deleteProduct(productId);
      reportFeedback("Producto eliminado correctamente.");
      await refreshAfterMutation();
    } catch (error) {
      reportFeedback(error instanceof Error ? error.message : "No se pudo eliminar el producto.", "error");
    } finally {
      finishPending(pendingProductIdsRef.current, productId);
      setPendingProductIds(new Set(pendingProductIdsRef.current));
    }
  }, [refreshAfterMutation, reportFeedback]);

  const uploadEvidence = useCallback(async (productId: string, file: File, uploadedBy: string) => {
    if (!startPending(pendingEvidenceIdsRef.current, productId)) return false;
    setPendingEvidenceIds(new Set(pendingEvidenceIdsRef.current));
    try {
      const form = new FormData();
      form.set("activityId", productId);
      form.set("file", file);
      form.set("uploadedBy", uploadedBy);
      await uploadProductEvidence(form);
      await updateProductStatus(productId, "evidence-attached");
      reportFeedback("Adjunto cargado en el producto.");
      await refreshAfterMutation();
      return true;
    } catch (error) {
      reportFeedback(error instanceof Error ? error.message : "No se pudo cargar el adjunto.", "error");
      return false;
    } finally {
      finishPending(pendingEvidenceIdsRef.current, productId);
      setPendingEvidenceIds(new Set(pendingEvidenceIdsRef.current));
    }
  }, [refreshAfterMutation, reportFeedback]);

  const addExternalEvidence = useCallback(async (productId: string, fileName: string, storageUrl: string, uploadedBy: string) => {
    if (!startPending(pendingEvidenceIdsRef.current, productId)) return false;
    setPendingEvidenceIds(new Set(pendingEvidenceIdsRef.current));
    try {
      await createExternalProductEvidence({ activityId: productId, fileName, contentType: "text/uri-list", storageUrl, uploadedBy });
      await updateProductStatus(productId, "evidence-attached");
      reportFeedback("Adjunto cargado en el producto.");
      await refreshAfterMutation();
      return true;
    } catch (error) {
      reportFeedback(error instanceof Error ? error.message : "No se pudo registrar el enlace.", "error");
      return false;
    } finally {
      finishPending(pendingEvidenceIdsRef.current, productId);
      setPendingEvidenceIds(new Set(pendingEvidenceIdsRef.current));
    }
  }, [refreshAfterMutation, reportFeedback]);

  const removeEvidence = useCallback(async (evidenceId: string) => {
    if (pendingEvidenceIdsRef.current.has(evidenceId) || !window.confirm("¿Eliminar este adjunto? El archivo quedará inactivo.")) return false;
    startPending(pendingEvidenceIdsRef.current, evidenceId);
    setPendingEvidenceIds(new Set(pendingEvidenceIdsRef.current));
    try {
      await deleteProductEvidence(evidenceId);
      reportFeedback("Adjunto eliminado correctamente.");
      await refreshAfterMutation();
      return true;
    } catch (error) {
      reportFeedback(error instanceof Error ? error.message : "No se pudo eliminar el adjunto.", "error");
      return false;
    } finally {
      finishPending(pendingEvidenceIdsRef.current, evidenceId);
      setPendingEvidenceIds(new Set(pendingEvidenceIdsRef.current));
    }
  }, [refreshAfterMutation, reportFeedback]);

  useEffect(() => {
    void load(true).catch(() => undefined);
    const timer = window.setInterval(() => void load(false).catch(() => undefined), pollInterval);
    return () => window.clearInterval(timer);
  }, [load, pollInterval]);

  return {
    requirements,
    products,
    technicians,
    catalogs,
    evidence,
    approvals,
    suggestedProductId,
    showProductIdField,
    isInitialLoading,
    isRefreshing,
    loadError,
    message,
    pendingProductIds,
    pendingEvidenceIds,
    refresh: () => load(false),
    save,
    changeStatus,
    remove,
    uploadEvidence,
    addExternalEvidence,
    removeEvidence,
    reportFeedback
  };
}

function isActiveTechnician(user: Technician) {
  return user.isActive && user.roles.some((role) => role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "tecnico");
}

function startPending(values: Set<string>, value: string) {
  if (values.has(value)) return false;
  values.add(value);
  return true;
}

function finishPending(values: Set<string>, value: string) {
  values.delete(value);
}

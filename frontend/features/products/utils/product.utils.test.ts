import { describe, expect, it } from "vitest";
import type { AuthSession } from "../../../app/lib";
import type { Activity, Requirement } from "../../../shared/models/api.models";
import { approvalDecisionLabel, buildNextProductId, filterProductsForSession, filterRequirementsForSession, matchesProductSearch, normalizeProductStatus, productStatusLabel, productStepState, workflowButtonClass } from "./product.utils";

const product = (overrides: Partial<Activity> = {}): Activity => ({
  id: "p1", requirementId: "r1", productId: "PROD-0007", requirementTypeId: "rt1", requirementType: "Diseño",
  strategicObjective: "Difusión", targetAudienceId: "ta1", targetAudience: "Estudiantes", productTypeId: "pt1",
  productType: "Video", diffusionChannelId: "dc1", diffusionChannel: "Instagram", mainKpiId: "k1",
  mainKpi: "Alcance", productResponsible: "tecnico@uti.edu.ec", observations: "Campaña institucional",
  status: "Todo", statusId: "s1", ...overrides
});

const requirement = (overrides: Partial<Requirement> = {}): Requirement => ({
  id: "r1", code: "REQ-1", activityOrEvent: "Evento", requestedBy: "solicitante@uti.edu.ec", facultyId: "f1",
  faculty: "Facultad", career: "Carrera", campusId: "c1", campus: "Campus", place: "Auditorio", startDate: "2026-08-01",
  endDate: "2026-08-02", eventObjective: "Objetivo", eventFormatId: "ef1", eventFormat: "Presencial", requestDate: "2026-07-01",
  status: "InProgress", statusId: "s1", ...overrides
});

const session = (roles: string[] = ["Tecnico"]): AuthSession => ({
  accessToken: "token", expiresAt: "2099-01-01", user: {
    id: "u1", name: "Técnico", email: "tecnico@uti.edu.ec", roles, screenPermissions: ["activities"]
  }
});

describe("product status utilities", () => {
  it("normaliza rechazos y traduce estados y decisiones", () => {
    expect(normalizeProductStatus("Rejected")).toBe("InProgress");
    expect(normalizeProductStatus("Approved")).toBe("Approved");
    expect(productStatusLabel("Todo")).toBe("Por hacer");
    expect(productStatusLabel("Rejected")).toBe("Producto en proceso");
    expect(productStatusLabel("Custom")).toBe("Custom");
    expect(approvalDecisionLabel("Approved")).toBe("Aprobado");
    expect(approvalDecisionLabel("Rejected")).toBe("Rechazado");
    expect(approvalDecisionLabel("Pending")).toBe("Pending");
  });

  it("calcula cada paso del workflow", () => {
    expect(productStepState(product({ status: "Todo" }), "start")).toBe("ready");
    expect(productStepState(product({ status: "Todo" }), "evidence")).toBe("pending");
    expect(productStepState(product({ status: "InProgress" }), "start")).toBe("done");
    expect(productStepState(product({ status: "InProgress" }), "evidence")).toBe("ready");
    expect(productStepState(product({ status: "Rejected" }), "evidence")).toBe("ready");
    expect(productStepState(product({ status: "InProgress" }), "approval")).toBe("pending");
    expect(productStepState(product({ status: "EvidenceAttached" }), "approval")).toBe("ready");
    expect(productStepState(product({ status: "PendingApproval" }), "approval")).toBe("done");
    expect(workflowButtonClass("done")).toBe("icon-button success");
    expect(workflowButtonClass("ready")).toBe("icon-button warning");
    expect(workflowButtonClass("pending")).toBe("icon-button pending");
  });
});

describe("product collection utilities", () => {
  it("genera el siguiente código secuencial", () => {
    expect(buildNextProductId([])).toBe("PROD-0001");
    expect(buildNextProductId([product(), product({ productId: "PROD-0012" }), product({ productId: "OTRO" })])).toBe("PROD-0013");
  });

  it("filtra requerimientos según sesión y roles", () => {
    const items = [requirement({ requestedBy: "tecnico@uti.edu.ec" }), requirement({ id: "r2", requestedBy: "otro@uti.edu.ec" })];
    expect(filterRequirementsForSession(items, null)).toEqual(items);
    expect(filterRequirementsForSession(items, session(["Administrador"]))).toEqual(items);
    expect(filterRequirementsForSession(items, session())).toEqual([items[0]]);
  });

  it("muestra productos propios o de requerimientos visibles", () => {
    const items = [product(), product({ id: "p2", requirementId: "r2", productResponsible: "otro@uti.edu.ec" }), product({ id: "p3", requirementId: "r3", productResponsible: "otro@uti.edu.ec" })];
    expect(filterProductsForSession(items, [], null)).toEqual(items);
    expect(filterProductsForSession(items, [], session(["Coordinador"]))).toEqual(items);
    expect(filterProductsForSession(items, [requirement({ id: "r2" })], session())).toEqual([items[0], items[1]]);
  });

  it("busca en los campos funcionales", () => {
    expect(matchesProductSearch(product(), "")).toBe(true);
    expect(matchesProductSearch(product(), "instagram")).toBe(true);
    expect(matchesProductSearch(product(), "ALCANCE")).toBe(true);
    expect(matchesProductSearch(product(), "por hacer")).toBe(true);
    expect(matchesProductSearch(product(), "inexistente")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import type { AuthSession } from "../../../app/lib";
import type { Activity, Requirement } from "../../../shared/models/api.models";
import { activityStatusLabel, filterRequirementsForSession, isFinalRequirement, matchesRequirementSearch, requirementPermissions, requirementStatusLabel, requirementStepState, workflowButtonClass } from "./requirement.utils";

const requirements = [requirement("r1", "owner@example.com", "Draft"), requirement("r2", "other@example.com", "InAnalysis")];
const activities = [{ id: "p1", requirementId: "r2", productResponsible: "tech@example.com" }] as Activity[];

describe("requirement utils", () => {
  it("conserva acceso global para coordinación y restringe técnicos", () => {
    expect(filterRequirementsForSession(requirements, activities, session("Coordinador"))).toHaveLength(2);
    expect(filterRequirementsForSession(requirements, activities, session("Tecnico"))).toEqual([requirements[1]]);
    expect(filterRequirementsForSession(requirements, activities, session("Solicitante", "owner@example.com"))).toEqual([requirements[0]]);
    expect(filterRequirementsForSession(requirements, activities, null)).toHaveLength(2);
  });

  it("expone gestión salvo para auditoría o sesión ausente", () => {
    expect(requirementPermissions(session("Administrador"))).toEqual({ canCreate: true, canManage: true });
    expect(requirementPermissions(session("Auditor"))).toEqual({ canCreate: false, canManage: false });
    expect(requirementPermissions(null).canManage).toBe(false);
  });

  it("calcula los pasos del workflow", () => {
    expect(requirementStepState(requirements[0], "analysis")).toBe("ready");
    expect(requirementStepState(requirements[0], "execution")).toBe("pending");
    expect(requirementStepState(requirements[1], "analysis")).toBe("done");
    expect(requirementStepState(requirements[1], "execution")).toBe("ready");
    expect(requirementStepState(requirement("r3", "x", "InExecution"), "complete")).toBe("ready");
    expect(requirementStepState(requirement("r4", "x", "Completed"), "complete")).toBe("done");
  });

  it("formatea, filtra y clasifica estados", () => {
    expect(matchesRequirementSearch(requirements[0], "OWNER")).toBe(true);
    expect(matchesRequirementSearch(requirements[0], "inexistente")).toBe(false);
    expect(matchesRequirementSearch(requirements[0], "")).toBe(true);
    expect(requirementStatusLabel("PendingApproval")).toBe("Pendiente de aprobación");
    expect(requirementStatusLabel("Unknown")).toBe("Unknown");
    expect(activityStatusLabel("EvidenceAttached")).toBe("Evidencia adjunta");
    expect(activityStatusLabel("Unknown")).toBe("Unknown");
    expect(isFinalRequirement("Rejected")).toBe(true);
    expect(isFinalRequirement("Draft")).toBe(false);
    expect(workflowButtonClass("ready")).toContain("warning");
    expect(workflowButtonClass("done")).toContain("success");
    expect(workflowButtonClass("pending")).toContain("pending");
  });
});

function session(role: string, email = "tech@example.com"): AuthSession { return { accessToken: "t", expiresAt: "x", user: { id: "u", name: "Tech", email, roles: [role], screenPermissions: ["dashboard"] } }; }
function requirement(id: string, requestedBy: string, status: string): Requirement { return { id, code: `REQ-${id}`, activityOrEvent: "Feria", requestedBy, facultyId: "f", faculty: "Facultad", career: "Carrera", campusId: "c", campus: "Centro", place: "Auditorio", startDate: "2026-08-01", endDate: "2026-08-02", eventObjective: "Objetivo", eventFormatId: "e", eventFormat: "Presencial", requestDate: "2026-07-01", status, statusId: "s" }; }

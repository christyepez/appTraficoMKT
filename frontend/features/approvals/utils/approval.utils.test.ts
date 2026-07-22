import { describe, expect, it } from "vitest";
import { approvalDecisionSchema } from "../schemas/approval.schema";
import { approvalStatusLabel, canDecideApprovals, filterApprovalActivities, formatApprovalDate } from "./approval.utils";

describe("approval rules", () => {
  it("filtra pendientes, aprobados y búsqueda", () => {
    const activities = [activity(), activity({ id: "p2", productId: "DOS", status: "Approved" })];
    expect(filterApprovalActivities(activities, false, "video").map((item) => item.id)).toEqual(["p1"]);
    expect(filterApprovalActivities(activities, true, "dos").map((item) => item.id)).toEqual(["p2"]);
  });

  it("limita decisiones a roles autorizados", () => {
    const session = (roles: string[]) => ({ accessToken: "t", expiresAt: "x", user: { id: "u", name: "U", email: "u@x", roles, screenPermissions: [] } });
    expect(canDecideApprovals(session(["Aprobador"]))).toBe(true);
    expect(canDecideApprovals(session(["Auditor"]))).toBe(false);
    expect(canDecideApprovals(null)).toBe(false);
  });

  it("valida decisión y comentario requerido", () => {
    expect(approvalDecisionSchema.safeParse({ decision: "Approved", comments: "" }).success).toBe(false);
    expect(approvalDecisionSchema.safeParse({ decision: "Rejected", comments: "Requiere cambios" }).success).toBe(true);
  });

  it("presenta etiquetas y fechas", () => {
    expect(approvalStatusLabel("PendingApproval")).toBe("Pendiente de aprobación");
    expect(approvalStatusLabel("Custom")).toBe("Custom");
    expect(formatApprovalDate()).toBe("Sin fecha");
    expect(formatApprovalDate("2026-01-01T12:00:00Z")).not.toBe("Sin fecha");
  });
});

function activity(overrides: Record<string, unknown> = {}) {
  return { id: "p1", requirementId: "r1", productId: "UNO", requirementTypeId: "r", requirementType: "Diseño", strategicObjective: "Marca", targetAudienceId: "t", targetAudience: "Todos", productTypeId: "p", productType: "Video", diffusionChannelId: "d", diffusionChannel: "Web", mainKpiId: "k", mainKpi: "Alcance", productResponsible: "tech@example.com", observations: "", status: "PendingApproval", statusId: "s", ...overrides } as never;
}

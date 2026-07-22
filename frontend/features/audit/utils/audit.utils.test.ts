import { describe, expect, it } from "vitest";
import { filterAuditRows, formatAuditDate, normalizeAuditRows, prettyAuditValue } from "./audit.utils";

describe("audit utils", () => {
  it("normaliza y ordena las tres fuentes", () => {
    const rows = normalizeAuditRows([{ id: "r", requirementId: "req", toStatus: "InAnalysis", action: "Analizar", performedBy: "Ana", comments: "ok", occurredAt: "2026-07-01" }], [{ id: "p", activityId: "prod", requirementId: "req", toStatus: "Approved", action: "Aprobar", performedBy: "Luis", comments: "", occurredAt: "2026-07-03" }], [{ id: "a", activityId: "prod", decision: "Approved", action: "Decidir", performedBy: "Eva", payloadJson: "{}", occurredAt: "2026-07-02" }]);
    expect(rows.map((row) => row.source)).toEqual(["Productos", "Aprobaciones", "Requerimientos"]); expect(rows[0].relatedId).toBe("req");
  });
  it("filtra por fuente y texto", () => {
    const rows = normalizeAuditRows([], [], [{ id: "a", activityId: "p", decision: "Rejected", action: "Decidir", performedBy: "Eva", payloadJson: "motivo", occurredAt: "invalid" }]);
    expect(filterAuditRows(rows, "Aprobaciones", "eva")).toHaveLength(1); expect(filterAuditRows(rows, "Productos", "")).toEqual([]); expect(filterAuditRows(rows, "Todas", "sin coincidencia")).toEqual([]);
  });
  it("formatea JSON y oculta secretos anidados", () => {
    const value = prettyAuditValue(JSON.stringify({ token: "abc", nested: { password: "123", visible: "ok" }, list: [{ secret: "x" }] })); expect(value).toContain("[OCULTO]"); expect(value).toContain("visible"); expect(value).not.toContain("abc"); expect(prettyAuditValue("texto")).toBe("texto"); expect(prettyAuditValue("")).toBe("Sin detalle adicional.");
  });
  it("formatea fechas seguras", () => { expect(formatAuditDate()).toBe("Sin datos"); expect(formatAuditDate("invalid")).toBe("Fecha no disponible"); expect(formatAuditDate("2026-07-01T10:00:00Z")).not.toContain("disponible"); });
});

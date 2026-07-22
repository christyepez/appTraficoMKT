import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MetricSection } from "./MetricSection";
import { MetricsDashboard } from "./MetricsDashboard";
import { MetricsToolbar } from "./MetricsToolbar";
import { ParticipationStory } from "./ParticipationStory";
import { StageSection } from "./StageSection";
import { UsageSection } from "./UsageSection";

describe("metrics components", () => {
  it("cambia concepto y actualiza desde la barra", async () => {
    const user = userEvent.setup(), onConcept = vi.fn(), onRefresh = vi.fn(); render(<MetricsToolbar concept="summary" refreshing={false} onConcept={onConcept} onRefresh={onRefresh} />); await user.selectOptions(screen.getByLabelText("Concepto"), "times"); await user.click(screen.getByRole("button", { name: "Actualizar" })); expect(onConcept).toHaveBeenCalledWith("times"); expect(onRefresh).toHaveBeenCalled();
  });
  it("renderiza segmentos, etapas y vacíos", () => {
    const { rerender, container } = render(<MetricSection title="Estados" items={[{ name: "Activo", count: 2, percentage: 120 }]} />); expect(screen.getByText("Activo")).toBeInTheDocument(); expect(container.querySelector(".metric-bar span")).toHaveStyle({ width: "100%" }); rerender(<StageSection title="Etapas" items={[]} />); expect(screen.getByText(/Sin datos históricos/)).toBeInTheDocument();
  });
  it("presenta participación y usabilidad con datos incompletos", () => {
    const requirements = { byFaculty: [{ name: "Ingeniería", count: 4, percentage: 80 }], byCampus: [], byFormat: [], averageHoursByStage: [] } as never; const { rerender } = render(<ParticipationStory requirements={requirements} />); expect(screen.getAllByText(/Ingeniería/)).toHaveLength(2); expect(screen.getByText("Sin datos de sedes.")).toBeInTheDocument(); rerender(<UsageSection usage={null} activities={[]} />); expect(screen.getByText("Sin actividad reciente de usuarios.")).toBeInTheDocument();
  });
  it("muestra carga, error y datos parciales", () => {
    const { rerender } = render(<MetricsDashboard workspace={workspace({ isLoading: true })} />); expect(screen.getByRole("status", { name: "" })).toHaveTextContent("Cargando métricas"); rerender(<MetricsDashboard workspace={workspace({ isLoading: false, loadError: "Sin indicadores" })} />); expect(screen.getByRole("alert")).toHaveTextContent("Sin indicadores"); rerender(<MetricsDashboard workspace={workspace({ isLoading: false, warnings: ["Sin productos"] })} />); expect(screen.getByText(/Datos parciales/)).toBeInTheDocument(); expect(screen.getByText("Proyectos por estado")).toBeInTheDocument();
  });
  it("renderiza las seis vistas por concepto", () => {
    const view = render(<MetricsDashboard workspace={workspace({ concept: "workload" })} />); expect(screen.getByText("Carga operativa del equipo")).toBeInTheDocument();
    for (const [concept, title] of [["times", "Tiempo promedio por etapa de requerimiento"], ["impact", "Incidencia por canal de difusión"], ["participation", "Participación por áreas"], ["usage", "Usabilidad de usuarios"]] as const) { view.rerender(<MetricsDashboard workspace={workspace({ concept })} />); expect(screen.getByRole("heading", { name: title })).toBeInTheDocument(); }
  });
});

function workspace(overrides: Record<string, unknown> = {}) {
  return { requirements: { totalRequirements: 2, completedRequirements: 1, averageCycleDays: 3, byStatus: [], byFaculty: [], byCampus: [], byFormat: [], averageHoursByStage: [] }, products: { totalProducts: 2, approvedProducts: 1, averageCycleDays: 2, byStatus: [], workloadByResponsible: [], byProductType: [], byDiffusionChannel: [], byMainKpi: [], byTargetAudience: [], averageHoursByStage: [] }, approvals: { auditEvents: 1, byDecision: [] }, usage: { totalUsers: 1, activeUsers: 1, usersLoggedLast7Days: 1, averageHoursSinceLastLogin: 1, recentUsers: [] }, activities: [], warnings: [], concept: "summary", setConcept: vi.fn(), isLoading: false, isRefreshing: false, loadError: "", refresh: vi.fn().mockResolvedValue(undefined), ...overrides } as never;
}

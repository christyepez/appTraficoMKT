import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CapacityIndicator } from "./CapacityIndicator";
import { MetricSummary } from "./MetricSummary";
import { TechnicianWorkload } from "./TechnicianWorkload";
const summary = { plannedHours: 20, capacityHours: 40, occupancy: 50, availability: 20, pendingPlanning: 2, atRisk: 1 };
describe("metric components", () => { it("presenta resumen y capacidad", () => { render(<><MetricSummary value={summary} /><CapacityIndicator value={summary} /></>); expect(screen.getByText("50%")).toBeInTheDocument(); expect(screen.getByText("1 productos en riesgo")).toBeInTheDocument(); }); it("renderiza carga accesible y vacío", () => { const { rerender } = render(<TechnicianWorkload title="Carga" items={[{ label: "Tech", blocks: 2, hours: 10, percent: 80 }]} />); expect(screen.getByRole("progressbar", { name: "Tech" })).toHaveAttribute("aria-valuenow", "80"); rerender(<TechnicianWorkload title="Carga" items={[]} />); expect(screen.getByText(/Sin datos/)).toBeInTheDocument(); }); });

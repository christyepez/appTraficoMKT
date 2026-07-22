import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PublicRequirementCatalogs } from "../models/public-requirement.models";
import { PublicRequirementForm } from "./PublicRequirementForm";

vi.mock("../../../app/lib", () => ({ showToast: vi.fn() }));

const catalogs: PublicRequirementCatalogs = {
  faculties: [{ id: "f1", name: "Ingeniería", isActive: true }, { id: "f2", name: "Diseño", isActive: true }],
  careers: [{ id: "c1", name: "Sistemas", facultyId: "f1", isActive: true }, { id: "c2", name: "Gráfico", facultyId: "f2", isActive: true }],
  campuses: [{ id: "s1", name: "Quito", isActive: true }],
  eventFormats: [{ id: "e1", name: "Presencial", isActive: true }]
};
const enabled = { enabled: true };

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Actividad o evento"), "Feria");
  await user.type(screen.getByLabelText("Correo del solicitante"), "ana@example.com");
  await user.selectOptions(screen.getByLabelText("Facultad"), "f1");
  await user.selectOptions(screen.getByLabelText("Carrera"), "c1");
  await user.selectOptions(screen.getByLabelText("Sede"), "s1");
  await user.type(screen.getByLabelText("Lugar"), "Auditorio");
  await user.type(screen.getByLabelText("Fecha inicio"), "2026-01-10");
  await user.type(screen.getByLabelText("Fecha fin"), "2026-01-10");
  await user.selectOptions(screen.getByLabelText("Formato"), "e1");
  await user.type(screen.getByLabelText("Objetivo del evento"), "Presentar proyectos");
}

describe("PublicRequirementForm", () => {
  it("muestra fuera de periodo sin solicitar catálogos", () => {
    const loadCatalogs = vi.fn();
    render(<PublicRequirementForm availability={{ enabled: true, activeFrom: "2026-02-01T00:00:00Z" }} now={Date.parse("2026-01-01T00:00:00Z")} loadCatalogs={loadCatalogs} />);
    expect(screen.getByRole("status")).toHaveTextContent("no está activo");
    expect(loadCatalogs).not.toHaveBeenCalled();
  });

  it("carga catálogos y filtra carreras por facultad", async () => {
    const user = userEvent.setup();
    render(<PublicRequirementForm availability={enabled} loadCatalogs={vi.fn().mockResolvedValue(catalogs)} />);
    await screen.findByLabelText("Facultad");
    expect(screen.getByLabelText("Carrera")).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("Facultad"), "f1");
    expect(screen.getByRole("option", { name: "Sistemas" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Gráfico" })).not.toBeInTheDocument();
  });

  it("valida, envía una vez y muestra confirmación", async () => {
    const user = userEvent.setup();
    let resolveRequest!: () => void;
    const submitRequirement = vi.fn().mockReturnValue(new Promise<void>((resolve) => { resolveRequest = resolve; }));
    render(<PublicRequirementForm availability={enabled} loadCatalogs={vi.fn().mockResolvedValue(catalogs)} submitRequirement={submitRequirement} />);
    await screen.findByLabelText("Facultad");
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Enviar requerimiento" }));
    await waitFor(() => expect(submitRequirement).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Enviando..." }));
    expect(submitRequirement).toHaveBeenCalledTimes(1);
    resolveRequest();
    expect(await screen.findByRole("status")).toHaveTextContent("enviado correctamente");
  });

  it("permite reintentar carga y presenta error de envío", async () => {
    const user = userEvent.setup();
    const loadCatalogs = vi.fn().mockRejectedValueOnce(new Error("Sin catálogos")).mockResolvedValue(catalogs);
    const submitRequirement = vi.fn().mockRejectedValue(new Error("Servicio no disponible"));
    render(<PublicRequirementForm availability={enabled} loadCatalogs={loadCatalogs} submitRequirement={submitRequirement} />);
    await user.click(await screen.findByRole("button", { name: "Reintentar" }));
    await screen.findByLabelText("Facultad");
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Enviar requerimiento" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Servicio no disponible");
  });
});

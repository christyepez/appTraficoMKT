import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PublicRequirementCatalogs, PublicRequirementCreationResult } from "../models/public-requirement.models";
import { PublicRequirementForm } from "./PublicRequirementForm";

vi.mock("../../../app/lib", () => ({ showToast: vi.fn() }));

const catalogs: PublicRequirementCatalogs = {
  faculties: [{ id: "f1", name: "Ingeniería", isActive: true }, { id: "f2", name: "Diseño", isActive: true }],
  careers: [{ id: "c1", name: "Sistemas", facultyId: "f1", isActive: true }, { id: "c2", name: "Gráfico", facultyId: "f2", isActive: true }],
  campuses: [{ id: "s1", name: "Quito", isActive: true }],
  eventFormats: [{ id: "e1", name: "Presencial", isActive: true }]
};
const enabled = { enabled: true };
const creation: PublicRequirementCreationResult = {
  requirementId: "r1",
  requirementCode: "REQ-2026-0001",
  uploadToken: "token",
  uploadTokenExpiresAt: "2026-01-10T10:00:00Z",
  message: "Su requerimiento fue registrado correctamente con el código REQ-2026-0001. El área de Marketing revisará la información enviada."
};

async function fill(user: ReturnType<typeof userEvent.setup>) {
  fireEvent.change(screen.getByLabelText("Actividad o evento"), { target: { value: "Feria" } });
  fireEvent.change(screen.getByLabelText("Nombre del solicitante"), { target: { value: "Ana Torres" } });
  fireEvent.change(screen.getByLabelText("Correo del solicitante"), { target: { value: "ana@example.com" } });
  await user.selectOptions(screen.getByLabelText("Facultad"), "f1");
  await user.selectOptions(screen.getByLabelText("Carrera"), "c1");
  await user.selectOptions(screen.getByLabelText("Sede"), "s1");
  fireEvent.change(screen.getByLabelText("Lugar"), { target: { value: "Auditorio" } });
  fireEvent.change(screen.getByLabelText("Fecha y hora de inicio"), { target: { value: "2026-01-10T09:00" } });
  fireEvent.change(screen.getByLabelText("Fecha y hora de fin"), { target: { value: "2026-01-10T10:00" } });
  await user.selectOptions(screen.getByLabelText("Público objetivo"), "mixed");
  await user.selectOptions(screen.getByLabelText("Formato"), "e1");
  fireEvent.change(screen.getByLabelText("Objetivo del evento"), { target: { value: "Presentar proyectos" } });
  fireEvent.change(screen.getByLabelText("Formato o dinámica"), { target: { value: "Exposición con agenda guiada" } });
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

  it("crea una vez, carga adjuntos y muestra el código", async () => {
    const user = userEvent.setup();
    let resolveRequest!: (value: PublicRequirementCreationResult) => void;
    const submitRequirement = vi.fn().mockReturnValue(new Promise<PublicRequirementCreationResult>((resolve) => { resolveRequest = resolve; }));
    const uploadAttachment = vi.fn().mockResolvedValue({ attachmentId: "a1", fileName: "brief.pdf", success: true });
    render(<PublicRequirementForm availability={enabled} loadCatalogs={vi.fn().mockResolvedValue(catalogs)} submitRequirement={submitRequirement} uploadAttachment={uploadAttachment} />);
    await screen.findByLabelText("Facultad");
    await fill(user);
    await user.upload(screen.getByLabelText("Adjuntos del requerimiento"), new File(["pdf"], "brief.pdf", { type: "application/pdf" }));
    await user.click(screen.getByRole("button", { name: "Enviar requerimiento" }));
    await waitFor(() => expect(submitRequirement).toHaveBeenCalledTimes(1));
    expect(submitRequirement).toHaveBeenCalledWith(expect.objectContaining({ requesterName: "Ana Torres", requesterEmail: "ana@example.com", requestedBy: "ana@example.com", audienceType: "mixed", activityFormatDescription: "Exposición con agenda guiada" }));
    resolveRequest(creation);
    expect(await screen.findByText(/REQ-2026-0001/)).toBeInTheDocument();
    expect(uploadAttachment).toHaveBeenCalledWith("r1", "token", expect.any(File));
  });

  it("permite reintentar solo adjuntos fallidos sin duplicar requerimiento", async () => {
    const user = userEvent.setup();
    const submitRequirement = vi.fn().mockResolvedValue(creation);
    const uploadAttachment = vi.fn().mockRejectedValueOnce(new Error("Archivo ocupado")).mockResolvedValueOnce({ attachmentId: "a1", fileName: "brief.pdf", success: true });
    render(<PublicRequirementForm availability={enabled} loadCatalogs={vi.fn().mockResolvedValue(catalogs)} submitRequirement={submitRequirement} uploadAttachment={uploadAttachment} />);
    await screen.findByLabelText("Facultad");
    await fill(user);
    await user.upload(screen.getByLabelText("Adjuntos del requerimiento"), new File(["pdf"], "brief.pdf", { type: "application/pdf" }));
    await user.click(screen.getByRole("button", { name: "Enviar requerimiento" }));
    expect(await screen.findByText(/Puede reintentarlos/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar adjuntos" }));
    await waitFor(() => expect(screen.getByText(/REQ-2026-0001/)).toBeInTheDocument());
    expect(submitRequirement).toHaveBeenCalledTimes(1);
    expect(uploadAttachment).toHaveBeenCalledTimes(2);
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

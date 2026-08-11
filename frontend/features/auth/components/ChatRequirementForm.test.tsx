import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RequirementFormCatalogs } from "../../requirements/domain/requirement-form.types";
import { ChatRequirementForm } from "./ChatRequirementForm";

const catalogs: RequirementFormCatalogs = {
  faculties: [{ id: "f", name: "Facultad" }],
  careers: [{ id: "c", name: "Carrera", facultyId: "f" }],
  campuses: [{ id: "s", name: "Sede" }],
  eventFormats: [{ id: "e", name: "Presencial" }]
};

async function next(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Siguiente" }));
}

describe("ChatRequirementForm", () => {
  it("valida antes de avanzar", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<ChatRequirementForm catalogs={catalogs} onSubmit={submit} message="" />);
    await next(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Ingrese la actividad");
    expect(submit).not.toHaveBeenCalled();
  });

  it("recorre pasos, permite volver y envía valores tipados", async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(true);
    render(<ChatRequirementForm catalogs={catalogs} onSubmit={submit} message="Su requerimiento fue registrado correctamente con el código REQ-1." />);

    fireEvent.change(screen.getByLabelText("Actividad o evento"), { target: { value: "Feria" } });
    await next(user);
    fireEvent.change(screen.getByLabelText("Nombre del solicitante"), { target: { value: "Ana Torres" } });
    fireEvent.change(screen.getByLabelText("Correo del solicitante"), { target: { value: "ana@example.com" } });
    await next(user);
    await user.selectOptions(screen.getByLabelText("Facultad"), "f");
    await user.selectOptions(screen.getByLabelText("Carrera"), "c");
    await user.selectOptions(screen.getByLabelText("Sede"), "s");
    fireEvent.change(screen.getByLabelText("Lugar"), { target: { value: "Auditorio" } });
    await next(user);
    fireEvent.change(screen.getByLabelText("Fecha y hora de inicio"), { target: { value: "2026-01-10T09:00" } });
    fireEvent.change(screen.getByLabelText("Fecha y hora de fin"), { target: { value: "2026-01-10T10:00" } });
    await next(user);
    await user.selectOptions(screen.getByLabelText("Público objetivo"), "mixed");
    await user.selectOptions(screen.getByLabelText("Formato"), "e");
    await next(user);
    fireEvent.change(screen.getByLabelText("Objetivo del evento"), { target: { value: "Difusión" } });
    await next(user);
    fireEvent.change(screen.getByLabelText("Formato o dinámica"), { target: { value: "Exposición" } });
    await next(user);
    await user.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByLabelText("Formato o dinámica")).toHaveValue("Exposición");
    await next(user);
    await next(user);
    expect(screen.getByRole("group", { name: "Resumen del requerimiento" })).toHaveTextContent("Feria");
    await user.click(screen.getByRole("button", { name: "Confirmar requerimiento" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ activityOrEvent: "Feria", requesterName: "Ana Torres", requesterEmail: "ana@example.com", facultyId: "f", careerId: "c", campusId: "s", audienceType: "mixed" }));
    expect(screen.getByText(/REQ-1/)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatRequirementForm } from "./ChatRequirementForm";

describe("ChatRequirementForm", () => {
  it("valida antes de enviar", async () => {
    const submit = vi.fn();
    render(<ChatRequirementForm onSubmit={submit} message="" />);
    await userEvent.click(screen.getByRole("button", { name: "Crear requerimiento" }));
    expect(await screen.findAllByRole("alert")).toHaveLength(3);
    expect(submit).not.toHaveBeenCalled();
  });

  it("envía valores tipados y muestra confirmación", async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(true);
    render(<ChatRequirementForm onSubmit={submit} message="Listo, requerimiento creado." />);
    await user.type(screen.getByLabelText("Actividad o evento"), "Feria");
    await user.type(screen.getByLabelText("Correo del solicitante"), "ana@example.com");
    await user.type(screen.getByLabelText("Objetivo"), "Difusión");
    await user.click(screen.getByRole("button", { name: "Crear requerimiento" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ activityOrEvent: "Feria", requestedBy: "ana@example.com" }));
    expect(screen.getByRole("status")).toHaveTextContent("Listo");
  });
});

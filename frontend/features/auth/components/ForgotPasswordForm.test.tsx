import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

vi.mock("../../../app/lib", () => ({ showToast: vi.fn() }));

describe("ForgotPasswordForm", () => {
  it("valida correo y evita enviar dos veces", async () => {
    const user = userEvent.setup();
    const requestReset = vi.fn();
    render(<ForgotPasswordForm requestReset={requestReset} />);
    await user.click(screen.getByRole("button", { name: "Enviar clave temporal" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("correo válido");
    expect(requestReset).not.toHaveBeenCalled();
  });

  it("confirma sin revelar si el usuario existe", async () => {
    const user = userEvent.setup();
    const requestReset = vi.fn().mockResolvedValue({});
    render(<ForgotPasswordForm requestReset={requestReset} />);
    await user.type(screen.getByLabelText("Correo"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar clave temporal" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Si el correo existe");
    expect(requestReset).toHaveBeenCalledTimes(1);
  });

  it("presenta error genérico sin filtrar el backend", async () => {
    const user = userEvent.setup();
    const requestReset = vi.fn().mockRejectedValue(new Error("usuario ana@example.com no existe"));
    render(<ForgotPasswordForm requestReset={requestReset} />);
    await user.type(screen.getByLabelText("Correo"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar clave temporal" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No se pudo procesar"));
    expect(screen.queryByText(/no existe/)).not.toBeInTheDocument();
  });
});

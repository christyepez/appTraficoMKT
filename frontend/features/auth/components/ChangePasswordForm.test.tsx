import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession } from "../../../core/auth/session";
import { ChangePasswordForm } from "./ChangePasswordForm";

vi.mock("../../../core/auth/session", () => ({ clearSession: vi.fn() }));
vi.mock("../../../app/lib", () => ({ showToast: vi.fn() }));

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Correo"), "ana@example.com");
  await user.type(screen.getByLabelText("Clave temporal o actual"), "Temporal123!");
  await user.type(screen.getByLabelText("Nueva clave"), "Nueva123!");
}

describe("ChangePasswordForm", () => {
  beforeEach(() => window.history.replaceState({}, "", "/change-password"));

  it("valida confirmación antes de invocar el servicio", async () => {
    const user = userEvent.setup();
    const updatePassword = vi.fn();
    render(<ChangePasswordForm updatePassword={updatePassword} onChanged={vi.fn()} />);
    await fill(user);
    await user.type(screen.getByLabelText("Confirmar nueva clave"), "Diferente123!");
    await user.click(screen.getByRole("button", { name: "Cambiar clave" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no coinciden");
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("precarga correo, limpia sesión y redirige después del cambio", async () => {
    window.history.replaceState({}, "", "/change-password?email=ana%40example.com");
    const user = userEvent.setup();
    const updatePassword = vi.fn().mockResolvedValue({});
    const onChanged = vi.fn();
    render(<ChangePasswordForm updatePassword={updatePassword} onChanged={onChanged} />);
    expect(screen.getByLabelText("Correo")).toHaveValue("ana@example.com");
    await user.type(screen.getByLabelText("Clave temporal o actual"), "Temporal123!");
    await user.type(screen.getByLabelText("Nueva clave"), "Nueva123!");
    await user.type(screen.getByLabelText("Confirmar nueva clave"), "Nueva123!");
    await user.click(screen.getByRole("button", { name: "Cambiar clave" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(updatePassword).toHaveBeenCalledWith("ana@example.com", "Temporal123!", "Nueva123!");
    expect(clearSession).toHaveBeenCalled();
  });

  it("oculta URLs internas en errores", async () => {
    const user = userEvent.setup();
    const updatePassword = vi.fn().mockRejectedValue(new Error("error https://internal.local/secret"));
    render(<ChangePasswordForm updatePassword={updatePassword} onChanged={vi.fn()} />);
    await fill(user);
    await user.type(screen.getByLabelText("Confirmar nueva clave"), "Nueva123!");
    await user.click(screen.getByRole("button", { name: "Cambiar clave" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo completar");
    expect(screen.queryByText(/internal\.local/)).not.toBeInTheDocument();
  });
});

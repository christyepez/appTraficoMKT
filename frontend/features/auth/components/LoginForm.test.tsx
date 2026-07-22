import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveSession, type AuthSession } from "../../../core/auth/session";
import { LoginForm } from "./LoginForm";

vi.mock("../../../core/auth/session", () => ({ saveSession: vi.fn() }));
vi.mock("../../../app/lib", () => ({ showToast: vi.fn() }));

const value: AuthSession = {
  accessToken: "opaque-value",
  expiresAt: "2099-01-01T00:00:00Z",
  user: { id: "1", name: "Ana", email: "ana@example.com", roles: [], screenPermissions: [], mustChangePassword: true }
};

describe("LoginForm", () => {
  let authenticate: ReturnType<typeof vi.fn>;

  beforeEach(() => { authenticate = vi.fn(); });

  it("valida sin enviar credenciales incompletas", async () => {
    const user = userEvent.setup();
    render(<LoginForm onAuthenticated={vi.fn()} authenticate={authenticate} />);
    await user.clear(screen.getByLabelText("Correo"));
    await user.clear(screen.getByLabelText("Clave"));
    await user.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(await screen.findAllByRole("alert")).toHaveLength(2);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it("guarda y delega la redirección de cambio obligatorio", async () => {
    const user = userEvent.setup();
    const onAuthenticated = vi.fn();
    authenticate.mockResolvedValue(value);
    render(<LoginForm onAuthenticated={onAuthenticated} authenticate={authenticate} />);
    await user.click(screen.getByRole("button", { name: "Ingresar" }));
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith(value));
    expect(saveSession).toHaveBeenCalledWith(value);
  });

  it("presenta un error seguro y recuperable", async () => {
    authenticate.mockRejectedValue(new Error("falló https://internal.local/token"));
    render(<LoginForm onAuthenticated={vi.fn()} authenticate={authenticate} />);
    await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo completar");
    expect(screen.queryByText(/internal\.local/)).not.toBeInTheDocument();
  });
});

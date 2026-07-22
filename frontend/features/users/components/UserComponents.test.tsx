import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ManagedUser } from "../models/user.models";
import { UserForm } from "./UserForm";
import { UserList } from "./UserList";
import { UserStatusActions } from "./UserStatusActions";

const managed: ManagedUser = { id: "1", name: "Ana", email: "ana@example.com", authProvider: "Local", allowMicrosoftLogin: false, roles: ["Administrador"], screenPermissions: ["dashboard", "users"], menuMode: "horizontal", menuCollapsed: false, isActive: true };
const roles = ["Solicitante", "Administrador"];
const screens = ["dashboard", "users"];

describe("user components", () => {
  it("valida y crea un usuario, perfil y pantallas", async () => {
    const user = userEvent.setup(), save = vi.fn().mockResolvedValue(undefined), close = vi.fn();
    render(<UserForm user={null} roles={roles} screens={screens} onSave={save} onClose={close} />);
    await user.clear(screen.getByLabelText("Nombre"));
    await user.clear(screen.getByLabelText("Email"));
    await user.click(screen.getByRole("button", { name: "Crear" }));
    expect(await screen.findByText("Ingrese el nombre.")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^Nombre/), "Ana");
    await user.type(screen.getByLabelText(/^Email/), "ana@example.com");
    await user.selectOptions(screen.getByLabelText("Perfil"), "Administrador");
    await user.click(screen.getByRole("button", { name: "Crear" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(null, expect.objectContaining({ roles: ["Administrador"], screenPermissions: expect.arrayContaining(["users"]) })));
    expect(close).toHaveBeenCalled();
  });

  it("edita estado sin exigir una clave nueva y muestra error API", async () => {
    const user = userEvent.setup(), save = vi.fn().mockRejectedValue(new Error("Correo duplicado"));
    render(<UserForm user={{ ...managed, isActive: false }} roles={roles} screens={screens} onSave={save} onClose={vi.fn()} />);
    await user.click(screen.getByLabelText("Activo"));
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert", { name: "" })).toHaveTextContent("Correo duplicado");
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }), expect.objectContaining({ password: "", isActive: true }));
  });

  it("muestra estados de lista y delega acciones", async () => {
    const user = userEvent.setup(), retry = vi.fn(), edit = vi.fn(), disable = vi.fn();
    const props = { users: [], search: "", inactive: false, loading: true, error: "", pendingIds: new Set<string>(), onRetry: retry, onEdit: edit, onDisable: disable };
    const view = render(<UserList {...props} />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando");
    view.rerender(<UserList {...props} loading={false} error="Error API" />);
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalled();
    view.rerender(<UserList {...props} loading={false} users={[managed]} />);
    const editButton = screen.getByRole("button", { name: "Editar" });
    const disableButton = screen.getByRole("button", { name: "Inactivar" });
    expect(editButton).toHaveClass("button", "secondary");
    expect(disableButton).toHaveClass("button", "danger");
    await user.click(editButton);
    await user.click(disableButton);
    expect(edit).toHaveBeenCalledWith(managed);
    expect(disable).toHaveBeenCalledWith("1");
  });

  it("bloquea acciones pendientes o sobre usuarios inactivos", () => {
    render(<UserStatusActions user={{ ...managed, isActive: false }} pending={true} onEdit={vi.fn()} onDisable={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Editar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Procesando" })).toBeDisabled();
  });
});

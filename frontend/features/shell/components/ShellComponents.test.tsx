import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AuthSession } from "../../../core/auth/session";
import { defaultBrandSettings } from "../../../core/branding/brand-settings";
import { AppHeader } from "./AppHeader";
import { AppMenu } from "./AppMenu";

const session: AuthSession = { accessToken: "opaque", expiresAt: "2099-01-01", user: { id: "1", name: "Ana", email: "ana@example.com", roles: ["Tecnico"], screenPermissions: ["activities", "agenda"] } };

describe("shell components", () => {
  it("muestra perfil, tema, idioma y notificaciones", async () => {
    const user = userEvent.setup();
    const onLanguage = vi.fn(), onLogout = vi.fn();
    render(<AppHeader brand={{ ...defaultBrandSettings, title: "Marca", subtitle: "Campaña" }} userName="Ana" language="es" unreadNotifications={3} onLanguage={onLanguage} onLogout={onLogout} />);
    expect(screen.getByText("Marca")).toBeInTheDocument();
    expect(screen.getByLabelText(/3 pendientes/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Idioma"), "en");
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(onLanguage).toHaveBeenCalledWith("en");
    expect(onLogout).toHaveBeenCalled();
  });

  it("filtra menú, marca ruta y permite plegar", async () => {
    const user = userEvent.setup(), onToggle = vi.fn();
    render(<AppMenu session={session} pathname="/activities" language="es" menuMode="horizontal" menuOrder="agenda,activities" isMobile={false} expanded onToggle={onToggle} />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent?.trim())).toEqual(["Agenda técnica", "Productos"]);
    expect(screen.getByRole("link", { name: "Productos" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Plegar menú" }));
    expect(onToggle).toHaveBeenCalled();
  });

  it("representa menú móvil colapsado", () => {
    render(<AppMenu session={session} pathname="/agenda" language="en" menuMode="vertical" menuOrder="" isMobile expanded={false} onToggle={vi.fn()} />);
    expect(screen.getByRole("navigation")).toHaveClass("mobile-collapsed");
    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute("aria-expanded", "false");
  });
});

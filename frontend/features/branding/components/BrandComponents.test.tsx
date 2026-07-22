import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { defaultBrandSettings } from "../../../core/branding/brand-settings";
import { BrandForm } from "./BrandForm";
import { BrandSettingsPanel } from "./BrandSettingsPanel";

describe("branding components", () => {
  it("navega por tarjetas, previsualiza, cancela y guarda formato enriquecido", async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue(undefined);
    document.documentElement.style.removeProperty("--primary");
    render(<BrandForm settings={defaultBrandSettings} saving={false} onSave={save} onRestore={vi.fn()}/>);

    expect(screen.getByRole("button", { name: "Configurar Textos" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Configurar Textos" }));
    const title = screen.getByLabelText("Contenido del título");
    await user.clear(title);
    await user.type(title, "Nueva marca");
    await user.click(screen.getByRole("button", { name: "Negrita del título" }));
    expect(screen.getByRole("button", { name: "Negrita del título" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Vista previa aislada")).toHaveTextContent("Nueva marca");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Configurar Textos" }));
    expect(screen.getByLabelText("Contenido del título")).toHaveValue(defaultBrandSettings.title);
    await user.clear(screen.getByLabelText("Contenido del título"));
    await user.type(screen.getByLabelText("Contenido del título"), "Nueva marca");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ title: "Nueva marca" })));
  });

  it("muestra validación y estados de carga/error", async () => {
    const user = userEvent.setup();
    const view = render(<BrandForm settings={defaultBrandSettings} saving={false} onSave={vi.fn()} onRestore={vi.fn()}/>);
    await user.click(screen.getByRole("button", { name: "Configurar Textos" }));
    await user.clear(screen.getByLabelText("Contenido del título"));
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Ingrese el título.")).toBeInTheDocument();
    view.unmount();

    const workspace = { settings: defaultBrandSettings, loading: true, saving: false, error: "", message: "Marca", reload: vi.fn(), save: vi.fn(), restore: vi.fn() };
    const panel = render(<BrandSettingsPanel workspace={workspace}/>);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando");
    panel.rerender(<BrandSettingsPanel workspace={{ ...workspace, loading: false, error: "Error API" }}/>);
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(workspace.reload).toHaveBeenCalled();
  });
});

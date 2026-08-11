import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { emptyNotificationSettings } from "../models/notification.models";
import { NotificationSettingsForm } from "./NotificationSettingsForm";
import { NotificationSettingsList } from "./NotificationSettingsList";

describe("settings components", () => {
  it("valida, cambia modo y crea", async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue(undefined);
    render(<NotificationSettingsForm item={null} onSave={save} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Crear" }));
    expect(await screen.findByText("Ingrese al menos un correo destino.")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Correos destino/), "ana@example.com");
    await user.type(screen.getByLabelText(/^Canal Teams/), "General");

    const legacyTemplate = screen.getByText("Plantilla HTML legado").closest("section");
    expect(legacyTemplate).not.toBeNull();
    await user.click(within(legacyTemplate!).getByRole("button", { name: "HTML" }));
    expect(screen.getByLabelText("Codigo HTML de Plantilla HTML legado")).toBeInTheDocument();

    await user.click(within(legacyTemplate!).getByRole("button", { name: "Vista previa" }));
    expect(screen.getByTitle("Vista previa segura de Plantilla HTML legado")).toHaveAttribute("sandbox", "");

    await user.click(screen.getByRole("button", { name: "Crear" }));
    await waitFor(() => expect(save).toHaveBeenCalled());
  });

  it("diferencia estados y acciones", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const edit = vi.fn();
    const disable = vi.fn();
    const props = {
      items: [],
      search: "",
      loading: true,
      error: "",
      pendingIds: new Set<string>(),
      onRetry: retry,
      onEdit: edit,
      onDisable: disable
    };

    const view = render(<NotificationSettingsList {...props} />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    view.rerender(<NotificationSettingsList {...props} loading={false} error="Error" />);
    const retryButton = screen.getByRole("button", { name: "Reintentar" });
    expect(retryButton).toHaveClass("button", "secondary");
    await user.click(retryButton);

    view.rerender(
      <NotificationSettingsList
        {...props}
        loading={false}
        items={[{ ...emptyNotificationSettings, id: "1", emailEnabled: false, teamsEnabled: false }]}
      />
    );
    const editButton = screen.getByRole("button", { name: `Editar ${emptyNotificationSettings.name}` });
    const disableButton = screen.getByRole("button", { name: `Inactivar ${emptyNotificationSettings.name}` });
    expect(editButton).toHaveClass("icon-button");
    expect(disableButton).toHaveClass("icon-button", "danger");

    await user.click(editButton);
    await user.click(disableButton);
    expect(edit).toHaveBeenCalled();
    expect(disable).toHaveBeenCalledWith("1");
  });
});

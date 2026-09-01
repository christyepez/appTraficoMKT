import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotificationSettingsForm } from "./NotificationSettingsForm";
import type { NotificationSettings } from "../models/notification.models";

const configured: NotificationSettings = {
  id: "notif-1",
  name: "Alertas operativas",
  emailEnabled: false,
  emailTo: "",
  teamsEnabled: false,
  teamsChannel: "",
  powerAutomateWebhookUrl: "Configurado",
  emailPowerAutomateWebhookUrl: "Configurado",
  teamsPowerAutomateWebhookUrl: "Configurado",
  htmlTemplate: "",
  emailHtmlTemplate: "",
  teamsHtmlTemplate: "",
  isActive: true
};

describe("NotificationSettingsForm", () => {
  it("preserves configured webhooks when the user does not replace them", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<NotificationSettingsForm item={configured} onSave={onSave} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toMatchObject({
      powerAutomateWebhookUrl: "Configurado",
      emailPowerAutomateWebhookUrl: "Configurado",
      teamsPowerAutomateWebhookUrl: "Configurado"
    });
  });

  it("replaces a configured webhook when the user enters a new HTTPS URL", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<NotificationSettingsForm item={configured} onSave={onSave} onClose={vi.fn()} />);

    const emailWebhook = screen.getByLabelText(/Webhook Power Automate correo/i);
    fireEvent.change(emailWebhook, { target: { value: "https://example.com/new-email-flow" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toMatchObject({
      powerAutomateWebhookUrl: "Configurado",
      emailPowerAutomateWebhookUrl: "https://example.com/new-email-flow",
      teamsPowerAutomateWebhookUrl: "Configurado"
    });
  });

  it("blocks malformed or non-HTTPS webhook values", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<NotificationSettingsForm item={configured} onSave={onSave} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Webhook legado/i), { target: { value: "http://example.com/flow" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("El webhook debe usar HTTPS.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});

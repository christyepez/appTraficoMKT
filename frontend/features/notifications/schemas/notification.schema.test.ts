import { describe, expect, it } from "vitest";
import { notificationSettingsSchema } from "./notification.schema";

const base = {
  id: "",
  name: "Alertas",
  emailEnabled: false,
  emailTo: "",
  teamsEnabled: false,
  teamsChannel: "",
  powerAutomateWebhookUrl: "",
  emailPowerAutomateWebhookUrl: "",
  teamsPowerAutomateWebhookUrl: "",
  htmlTemplate: "",
  emailHtmlTemplate: "",
  teamsHtmlTemplate: "",
  isActive: true
};

describe("notificationSettingsSchema", () => {
  it("accepts empty and configured webhook values", () => {
    expect(notificationSettingsSchema.safeParse(base).success).toBe(true);
    expect(notificationSettingsSchema.safeParse({ ...base, powerAutomateWebhookUrl: "Configurado" }).success).toBe(true);
  });

  it("accepts valid HTTPS Power Automate webhook URLs", () => {
    const result = notificationSettingsSchema.safeParse({
      ...base,
      powerAutomateWebhookUrl: "https://prod-00.westeurope.logic.azure.com/workflows/a/triggers/manual/paths/invoke",
      emailPowerAutomateWebhookUrl: "https://example.com/email-flow",
      teamsPowerAutomateWebhookUrl: "https://example.com/teams-flow"
    });
    expect(result.success).toBe(true);
  });

  it("rejects non HTTPS or malformed webhook URLs", () => {
    expect(notificationSettingsSchema.safeParse({ ...base, powerAutomateWebhookUrl: "http://example.com/flow" }).success).toBe(false);
    expect(notificationSettingsSchema.safeParse({ ...base, emailPowerAutomateWebhookUrl: "not-a-url" }).success).toBe(false);
  });

  it("requires destination data when channels are enabled", () => {
    expect(notificationSettingsSchema.safeParse({ ...base, emailEnabled: true }).success).toBe(false);
    expect(notificationSettingsSchema.safeParse({ ...base, teamsEnabled: true }).success).toBe(false);
  });
});

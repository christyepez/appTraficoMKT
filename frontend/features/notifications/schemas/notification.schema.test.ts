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
  it("accepts a base inactive configuration", () => {
    expect(notificationSettingsSchema.safeParse(base).success).toBe(true);
  });

  it("accepts configured sentinel webhook values returned by the backend", () => {
    expect(notificationSettingsSchema.safeParse({
      ...base,
      powerAutomateWebhookUrl: "Configurado",
      emailPowerAutomateWebhookUrl: "Configurado",
      teamsPowerAutomateWebhookUrl: "Configurado"
    }).success).toBe(true);
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

  it("rejects webhook values over 1200 characters", () => {
    expect(notificationSettingsSchema.safeParse({
      ...base,
      teamsPowerAutomateWebhookUrl: `https://example.com/${"a".repeat(1200)}`
    }).success).toBe(false);
  });

  it("requires an email destination when email delivery is enabled", () => {
    expect(notificationSettingsSchema.safeParse({ ...base, emailEnabled: true }).success).toBe(false);
  });

  it("validates every configured email destination", () => {
    expect(notificationSettingsSchema.safeParse({ ...base, emailEnabled: true, emailTo: "valid@example.com;invalid" }).success).toBe(false);
    expect(notificationSettingsSchema.safeParse({ ...base, emailEnabled: true, emailTo: "one@example.com;two@example.com" }).success).toBe(true);
  });

  it("requires a Teams channel when Teams delivery is enabled", () => {
    expect(notificationSettingsSchema.safeParse({ ...base, teamsEnabled: true }).success).toBe(false);
    expect(notificationSettingsSchema.safeParse({ ...base, teamsEnabled: true, teamsChannel: "Marketing" }).success).toBe(true);
  });
});

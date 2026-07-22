import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMicrosoftAuthConfig } from "../../../core/auth/auth.service";
import { defaultBrandSettings } from "../../../core/branding/brand-settings";
import { createPublicRequirement, getPublicBrandSettings, getPublicRequirementCatalogs } from "../../public-requirement/services/public-requirement.service";
import { useLoginExperience } from "./useLoginExperience";

vi.mock("../../../core/auth/auth.service", () => ({ exchangeMicrosoftCode: vi.fn(), getMicrosoftAuthConfig: vi.fn() }));
vi.mock("../../../core/auth/session", () => ({ saveSession: vi.fn() }));
vi.mock("../../../core/configuration/toast", () => ({ showToast: vi.fn() }));
vi.mock("../../public-requirement/services/public-requirement.service", () => ({
  createPublicRequirement: vi.fn(), getPublicBrandSettings: vi.fn(), getPublicRequirementCatalogs: vi.fn()
}));

const catalogs = {
  faculties: [{ id: "f", name: "Facultad", isActive: true }], careers: [{ id: "c", name: "Carrera", isActive: true }],
  campuses: [{ id: "s", name: "Sede", isActive: true }], eventFormats: [{ id: "e", name: "Presencial", isActive: true }]
};
const values = { activityOrEvent: "Feria", requestedBy: "ana@example.com", place: "", startDate: "", startTime: "", endDate: "", endTime: "", eventObjective: "Difusión" };

describe("useLoginExperience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/login");
    vi.mocked(getPublicBrandSettings).mockResolvedValue(defaultBrandSettings);
    vi.mocked(getPublicRequirementCatalogs).mockResolvedValue(catalogs);
    vi.mocked(createPublicRequirement).mockReset().mockResolvedValue({});
  });

  it("carga marca y catálogos y crea el requerimiento rápido", async () => {
    const { result } = renderHook(() => useLoginExperience());
    await waitFor(() => expect(result.current.catalogsReady).toBe(true));
    await act(async () => expect(await result.current.submitChat(values)).toBe(true));
    expect(createPublicRequirement).toHaveBeenCalledWith(expect.objectContaining({ facultyId: "f", place: "Por definir" }));
    expect(result.current.chatMessage).toMatch(/^Listo/);
  });

  it("conserva el formulario ante error de envío", async () => {
    vi.mocked(createPublicRequirement).mockRejectedValue(new Error("Servicio no disponible"));
    const { result } = renderHook(() => useLoginExperience());
    await waitFor(() => expect(result.current.catalogsReady).toBe(true));
    await act(async () => expect(await result.current.submitChat(values)).toBe(false));
    expect(result.current.chatMessage).toBe("Servicio no disponible");
  });

  it("explica cuando los catálogos públicos no permiten crear el requerimiento", async () => {
    vi.mocked(getPublicRequirementCatalogs).mockResolvedValue({ ...catalogs, faculties: [] });
    const { result } = renderHook(() => useLoginExperience());
    await waitFor(() => expect(getPublicRequirementCatalogs).toHaveBeenCalled());
    await act(async () => expect(await result.current.submitChat(values)).toBe(false));
    expect(result.current.chatMessage).toMatch(/No hay catálogos activos/);
    expect(createPublicRequirement).not.toHaveBeenCalled();
  });

  it("presenta de forma segura el error devuelto al login", async () => {
    window.history.replaceState({}, "", "/login?error_description=Acceso%20denegado");
    const { result } = renderHook(() => useLoginExperience());
    expect(result.current.message).toBe("Acceso denegado");
    await waitFor(() => expect(result.current.catalogsReady).toBe(true));
  });

  it("rechaza un retorno de Microsoft con estado inválido", async () => {
    window.history.replaceState({}, "", "/login?code=code&state=incorrecto");
    window.sessionStorage.setItem("msal-state", "esperado");
    window.sessionStorage.setItem("msal-code-verifier", "verifier");
    const { result } = renderHook(() => useLoginExperience());
    await waitFor(() => expect(result.current.message).toMatch(/validar el retorno de Microsoft/));
  });

  it("informa si no puede preparar Microsoft SSO", async () => {
    vi.mocked(getMicrosoftAuthConfig).mockRejectedValue(new Error("SSO temporalmente no disponible"));
    const { result } = renderHook(() => useLoginExperience());
    await act(async () => result.current.microsoftLogin());
    expect(result.current.message).toBe("SSO temporalmente no disponible");
  });
});

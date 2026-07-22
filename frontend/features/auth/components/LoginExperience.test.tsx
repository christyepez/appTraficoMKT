import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultBrandSettings } from "../../../core/branding/brand-settings";
import { LoginExperience } from "./LoginExperience";

const state = {
  message: "", brand: defaultBrandSettings,
  availability: { popup: { enabled: true }, fullPage: { enabled: true }, chatbot: { enabled: true } },
  isChatOpen: false, setIsChatOpen: vi.fn(), isPublicFormOpen: false, setIsPublicFormOpen: vi.fn(), chatMessage: "",
  microsoftLogin: vi.fn(), submitChat: vi.fn(), showPublicPopup: true, showPublicFullPage: true, showChatbot: true
  , catalogsReady: true
};

vi.mock("../hooks/useLoginExperience", () => ({ useLoginExperience: () => state }));
vi.mock("./LoginForm", () => ({ LoginForm: () => <form aria-label="Acceso local" /> }));
vi.mock("../../public-requirement/components/PublicRequirementForm", () => ({ PublicRequirementForm: () => <form aria-label="Requerimiento público" /> }));

describe("LoginExperience", () => {
  beforeEach(() => { state.isChatOpen = false; state.isPublicFormOpen = false; vi.clearAllMocks(); });

  it("presenta los canales públicos y abre sus controles", async () => {
    render(<LoginExperience />);
    await userEvent.click(screen.getByRole("button", { name: "Crear requerimiento sin login" }));
    await userEvent.click(screen.getByRole("button", { name: "Abrir asistente Puma" }));
    expect(state.setIsPublicFormOpen).toHaveBeenCalledWith(true);
    expect(state.setIsChatOpen).toHaveBeenCalledWith(true);
  });

  it("nombra los dialogs y permite cerrarlos", async () => {
    state.isChatOpen = true; state.isPublicFormOpen = true;
    render(<LoginExperience />);
    expect(screen.getAllByRole("dialog")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Cerrar asistente" }));
    expect(state.setIsChatOpen).toHaveBeenCalledWith(false);
  });
});

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSession } from "../../../core/auth/session";
import { defaultBrandSettings } from "../../../core/branding/brand-settings";
import { getShellBrand, getUnreadNotifications } from "../services/shell.service";
import { useAppShell } from "./useAppShell";

const push = vi.fn();
let pathname = "/activities";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => pathname }));
vi.mock("../../../core/auth/session", () => ({ getSession: vi.fn(), logoutSession: vi.fn() }));
vi.mock("../services/shell.service", () => ({ getShellBrand: vi.fn(), getUnreadNotifications: vi.fn() }));

const session = { accessToken: "opaque", expiresAt: "2099-01-01", user: { id: "1", name: "Ana", email: "ana@example.com", roles: ["Tecnico"], screenPermissions: ["activities"], menuMode: "vertical", menuCollapsed: true } };

describe("useAppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname = "/activities";
    vi.mocked(getSession).mockReturnValue(session as never);
    vi.mocked(getShellBrand).mockResolvedValue({ ...defaultBrandSettings, primary: "#123456" });
    vi.mocked(getUnreadNotifications).mockResolvedValue(2);
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });

  it("carga sesión, tema, preferencias y notificaciones", async () => {
    const { result, unmount } = renderHook(() => useAppShell(60_000));
    await waitFor(() => expect(result.current.session?.user.name).toBe("Ana"));
    await waitFor(() => expect(result.current.unreadNotifications).toBe(2));
    expect(result.current.desktopMenuVisible).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("#123456");
    unmount();
  });

  it("redirige sesión ausente o pantalla denegada", async () => {
    vi.mocked(getSession).mockReturnValue(null);
    const missing = renderHook(() => useAppShell(60_000));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    missing.unmount();
    push.mockClear();
    pathname = "/users";
    vi.mocked(getSession).mockReturnValue(session as never);
    const denied = renderHook(() => useAppShell(60_000));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/activities"));
    denied.unmount();
  });
});

import { describe, expect, it, vi } from "vitest";
import { currentLanguage, setLanguage, translate } from "./i18n";
import { showToast } from "./toast";

describe("ui configuration", () => {
  it("persiste idioma y traduce con fallback", () => {
    window.localStorage.clear();
    setLanguage("en");
    expect(currentLanguage()).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(translate("Requerimientos")).toBe("Requirements");
    expect(translate("Texto libre")).toBe("Texto libre");
  });

  it("publica toast global", () => {
    const listener = vi.fn();
    window.addEventListener("app-toast", listener);
    showToast("Guardado", "success");
    expect(listener).toHaveBeenCalled();
    expect(window.localStorage.getItem("requirements-last-toast")).toContain("Guardado");
    window.removeEventListener("app-toast", listener);
  });
});

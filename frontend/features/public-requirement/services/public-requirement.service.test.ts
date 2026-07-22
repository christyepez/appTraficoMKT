import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../app/lib";
import { createPublicRequirement, getPublicBrandSettings, getPublicRequirementCatalogs } from "./public-requirement.service";

vi.mock("../../../app/lib", () => ({ api: vi.fn(), defaultBrandSettings: { title: "Base", showPublicRequirementFullPage: false } }));

describe("public requirement service", () => {
  beforeEach(() => vi.mocked(api).mockReset());

  it("carga y filtra los cuatro catálogos", async () => {
    vi.mocked(api).mockResolvedValueOnce([{ id: "f1", name: "Activa", isActive: true }, { id: "f2", name: "Inactiva", isActive: false }] as never).mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never);
    const result = await getPublicRequirementCatalogs();
    expect(result.faculties).toHaveLength(1);
    expect(api).toHaveBeenCalledTimes(4);
  });

  it("conserva endpoints de marca y creación", async () => {
    vi.mocked(api).mockResolvedValueOnce({ title: "Configurada" } as never);
    expect(await getPublicBrandSettings()).toEqual(expect.objectContaining({ title: "Configurada" }));
    vi.mocked(api).mockResolvedValueOnce({} as never);
    await createPublicRequirement({ activityOrEvent: "Evento" } as never);
    expect(api).toHaveBeenLastCalledWith("/api/requirements", expect.objectContaining({ method: "POST" }));
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../app/lib";
import { createPublicRequirement, getPublicBrandSettings, getPublicRequirementCatalogs, uploadPublicRequirementAttachment } from "./public-requirement.service";

vi.mock("../../../app/lib", () => ({ api: vi.fn(), defaultBrandSettings: { title: "Base", showPublicRequirementFullPage: false } }));

describe("public requirement service", () => {
  beforeEach(() => vi.mocked(api).mockReset());

  it("carga y filtra los cuatro catálogos", async () => {
    vi.mocked(api).mockResolvedValueOnce([{ id: "f1", name: "Activa", isActive: true }, { id: "f2", name: "Inactiva", isActive: false }] as never).mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never);
    const result = await getPublicRequirementCatalogs();
    expect(result.faculties).toHaveLength(1);
    expect(api).toHaveBeenCalledTimes(4);
  });

  it("conserva endpoints de marca y creación pública", async () => {
    vi.mocked(api).mockResolvedValueOnce({ title: "Configurada" } as never);
    expect(await getPublicBrandSettings()).toEqual(expect.objectContaining({ title: "Configurada" }));
    vi.mocked(api).mockResolvedValueOnce({ requirementCode: "REQ-1" } as never);
    await createPublicRequirement({ activityOrEvent: "Evento", idempotencyKey: "idem-1" } as never);
    expect(api).toHaveBeenLastCalledWith("/api/requirements/public", expect.objectContaining({ method: "POST", headers: { "Idempotency-Key": "idem-1" } }));
  });

  it("sube adjuntos públicos con token temporal", async () => {
    vi.mocked(api).mockResolvedValueOnce({} as never);
    const file = new File(["pdf"], "brief.pdf", { type: "application/pdf" });
    await expect(uploadPublicRequirementAttachment("r1", "token", file)).resolves.toEqual(expect.objectContaining({ fileName: "brief.pdf", success: true }));
    expect(api).toHaveBeenCalledWith("/api/requirements/r1/attachments", expect.objectContaining({ method: "POST", headers: { "X-Requirement-Upload-Token": "token" } }));
  });
});

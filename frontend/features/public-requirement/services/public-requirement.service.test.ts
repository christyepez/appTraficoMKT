import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPublicRequirement, getPublicBrandSettings, getPublicRequirementCatalogs, uploadPublicRequirementAttachment } from "./public-requirement.service";

vi.mock("../../../app/lib", () => ({ defaultBrandSettings: { title: "Base", showPublicRequirementFullPage: false } }));

describe("public requirement service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("carga y filtra los cuatro catálogos", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      faculties: [{ id: "f1", name: "Activa", isActive: true }, { id: "f2", name: "Inactiva", isActive: false }],
      careers: [],
      campuses: [],
      eventFormats: []
    }));
    const result = await getPublicRequirementCatalogs();
    expect(result.faculties).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith("/api/admin/public/catalogs/requirements", expect.objectContaining({ cache: "no-store" }));
  });

  it("conserva endpoints de marca y creación pública", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ title: "Configurada" }));
    expect(await getPublicBrandSettings()).toEqual(expect.objectContaining({ title: "Configurada" }));
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ requirementCode: "REQ-1" }));
    await createPublicRequirement({ activityOrEvent: "Evento", idempotencyKey: "idem-1" } as never);
    expect(fetch).toHaveBeenLastCalledWith("/api/requirements/public", expect.objectContaining({ method: "POST", headers: expect.any(Headers) }));
    expect((vi.mocked(fetch).mock.calls.at(-1)?.[1]?.headers as Headers).get("Idempotency-Key")).toBe("idem-1");
    expect((vi.mocked(fetch).mock.calls.at(-1)?.[1]?.headers as Headers).has("Authorization")).toBe(false);
  });

  it("sube adjuntos públicos con token temporal", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}));
    const file = new File(["pdf"], "brief.pdf", { type: "application/pdf" });
    await expect(uploadPublicRequirementAttachment("r1", "token", file)).resolves.toEqual(expect.objectContaining({ fileName: "brief.pdf", success: true }));
    expect(fetch).toHaveBeenCalledWith("/api/requirements/r1/attachments", expect.objectContaining({ method: "POST", headers: expect.any(Headers) }));
    expect((vi.mocked(fetch).mock.calls.at(-1)?.[1]?.headers as Headers).get("X-Requirement-Upload-Token")).toBe("token");
  });
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

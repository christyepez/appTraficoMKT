import { afterEach, describe, expect, it, vi } from "vitest";
import { SatisfactionServiceError } from "../models/satisfaction.models";
import { getSatisfactionContext, submitSatisfaction } from "./satisfaction.service";

function response(status: number, body: unknown = {}) {
  return { status, ok: status >= 200 && status < 300, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe("satisfaction service", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("consulta y envía sin alterar el token opaco", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response(200, { requirementCode: "REQ-1", alreadySubmitted: false })).mockResolvedValueOnce(response(201));
    vi.stubGlobal("fetch", fetchMock);
    expect((await getSatisfactionContext("opaque-value")).requirementCode).toBe("REQ-1");
    await submitSatisfaction("opaque-value", { overallRating: 5 } as never);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/requirements/satisfaction/opaque-value", expect.objectContaining({ cache: "no-store" }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/requirements/satisfaction/opaque-value", expect.objectContaining({ method: "POST" }));
  });

  it.each([[404, "invalid"], [410, "expired"], [409, "used"], [500, "api"]] as const)("clasifica HTTP %s como %s", async (status, code) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(status)));
    await expect(getSatisfactionContext("opaque-value")).rejects.toMatchObject<SatisfactionServiceError>({ code });
  });

  it("diferencia errores de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(getSatisfactionContext("opaque-value")).rejects.toMatchObject({ code: "network" });
  });
});

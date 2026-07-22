import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../app/lib";
import type { Requirement } from "../../../shared/models/api.models";
import { deleteRequirement, getRequirementWorkspace, saveRequirement, updateRequirementStatus } from "./requirement.service";
vi.mock("../../../app/lib", () => ({ api: vi.fn() }));
const apiMock = vi.mocked(api);

beforeEach(() => apiMock.mockReset());
describe("requirement service", () => {
  it("consolida endpoints y elimina catálogos inactivos", async () => {
    apiMock.mockImplementation((url: string) => Promise.resolve(url === "/api/requirements" ? [{ id: "r" }] : url === "/api/activities" ? [{ id: "p" }] : [{ id: "a", isActive: true }, { id: "i", isActive: false }]) as never);
    const result = await getRequirementWorkspace();
    expect(result.requirements).toHaveLength(1); expect(result.activities).toHaveLength(1); expect(result.catalogs.faculties).toHaveLength(1); expect(apiMock).toHaveBeenCalledTimes(6);
  });
  it("tolera fallos en datos auxiliares", async () => {
    apiMock.mockResolvedValueOnce([] as never);
    for (let index = 0; index < 5; index += 1) apiMock.mockRejectedValueOnce(new Error("optional"));
    const result = await getRequirementWorkspace(); expect(result.activities).toEqual([]); expect(result.catalogs.eventFormats).toEqual([]);
  });
  it("crea, edita, transiciona y elimina", async () => {
    apiMock.mockResolvedValue({} as never); const payload = { activityOrEvent: "Feria" } as never; const existing = { id: "r1" } as Requirement;
    await saveRequirement(null, payload); expect(apiMock).toHaveBeenLastCalledWith("/api/requirements", expect.objectContaining({ method: "POST" }));
    await saveRequirement(existing, payload); expect(apiMock).toHaveBeenLastCalledWith("/api/requirements/r1", expect.objectContaining({ method: "PUT" }));
    await updateRequirementStatus("r1", "analysis"); expect(apiMock).toHaveBeenLastCalledWith("/api/requirements/r1/analysis", { method: "PATCH" });
    await deleteRequirement("r1"); expect(apiMock).toHaveBeenLastCalledWith("/api/requirements/r1", { method: "DELETE" });
  });
});

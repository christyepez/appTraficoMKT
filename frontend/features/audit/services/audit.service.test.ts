import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../app/lib";
import { getAuditWorkspace } from "./audit.service";
vi.mock("../../../app/lib", () => ({ api: vi.fn() })); const apiMock = vi.mocked(api);
beforeEach(() => apiMock.mockReset());
describe("audit service", () => {
  it("carga las tres fuentes", async () => { apiMock.mockImplementation((url: string) => Promise.resolve([{ url }]) as never); const result = await getAuditWorkspace(); expect(result.requirements[0]).toEqual({ url: "/api/requirements/audit" }); expect(result.warnings).toEqual([]); expect(apiMock).toHaveBeenCalledTimes(3); });
  it("mantiene fuentes parciales", async () => { apiMock.mockResolvedValueOnce([{ id: "r" }] as never).mockRejectedValueOnce(new Error("products")).mockRejectedValueOnce(new Error("approvals")); const result = await getAuditWorkspace(); expect(result.requirements).toHaveLength(1); expect(result.products).toEqual([]); expect(result.warnings).toHaveLength(2); });
});

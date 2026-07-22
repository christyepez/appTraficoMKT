import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../app/lib";
import { getMetricsWorkspace } from "./metrics.service";
vi.mock("../../../app/lib", () => ({ api: vi.fn() }));
const apiMock = vi.mocked(api);
beforeEach(() => apiMock.mockReset());

describe("metrics service", () => {
  it("consolida las cinco fuentes", async () => {
    apiMock.mockImplementation((url: string) => Promise.resolve({ source: url }) as never);
    const result = await getMetricsWorkspace(); expect(result.requirements).toEqual({ source: "/api/requirements/metrics" }); expect(result.activities).toEqual({ source: "/api/activities" }); expect(result.warnings).toEqual([]); expect(apiMock).toHaveBeenCalledTimes(5);
  });
  it("conserva respuestas parciales y describe fallos", async () => {
    apiMock.mockResolvedValueOnce({ totalRequirements: 2 } as never).mockRejectedValueOnce(new Error("products")).mockRejectedValueOnce(new Error("approvals")).mockResolvedValueOnce({ totalUsers: 1 } as never).mockRejectedValueOnce(new Error("activities"));
    const result = await getMetricsWorkspace(); expect(result.requirements).not.toBeNull(); expect(result.products).toBeNull(); expect(result.activities).toEqual([]); expect(result.warnings).toHaveLength(3);
  });
});

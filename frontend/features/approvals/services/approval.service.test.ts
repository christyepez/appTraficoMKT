import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../app/lib";
import { getApprovalWorkspace, submitApproval } from "./approval.service";

vi.mock("../../../app/lib", () => ({ api: vi.fn() }));
const apiMock = vi.mocked(api);

beforeEach(() => vi.clearAllMocks());

describe("approval.service", () => {
  it("carga cola, evidencias y decisiones existentes", async () => {
    apiMock.mockImplementation((path) => Promise.resolve({ "/api/activities": [{ id: "p1" }], "/api/evidence": [{ id: "e1" }], "/api/approvals": [{ id: "a1" }] }[path] ?? []) as never);
    const result = await getApprovalWorkspace();
    expect(result.activities).toEqual([{ id: "p1" }]);
    expect(apiMock).toHaveBeenCalledTimes(3);
  });

  it("envía una decisión al endpoint actual", async () => {
    apiMock.mockResolvedValue(undefined as never);
    const payload = { decision: "rejected" as const, decidedByEmail: "aprobador@example.com", comments: "Requiere cambios", source: "web" as const };
    await submitApproval("a1", payload);
    expect(apiMock).toHaveBeenCalledWith("/api/approvals/a1/decision", { method: "POST", body: JSON.stringify(payload) });
  });
});

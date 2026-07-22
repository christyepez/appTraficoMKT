import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../app/lib";
import { createExternalEvidence, deleteEvidence, getEvidenceWorkspace, markEvidenceAttached, uploadEvidence } from "./evidence.service";

vi.mock("../../../app/lib", () => ({ api: vi.fn() }));
const apiMock = vi.mocked(api);

beforeEach(() => vi.clearAllMocks());

describe("evidence.service", () => {
  it("carga el workspace desde los endpoints existentes", async () => {
    apiMock.mockImplementation((path) => Promise.resolve({
      "/api/requirements": [{ id: "r1" }], "/api/activities": [{ id: "p1" }], "/api/evidence": [{ id: "e1" }], "/api/approvals": [{ id: "a1" }]
    }[path] ?? []) as never);
    const workspace = await getEvidenceWorkspace();
    expect(workspace.activities).toEqual([{ id: "p1" }]);
    expect(apiMock).toHaveBeenCalledTimes(4);
  });

  it("encapsula carga, URL, estado y eliminación", async () => {
    apiMock.mockResolvedValue({} as never);
    const form = new FormData();
    await uploadEvidence(form);
    expect(apiMock).toHaveBeenLastCalledWith("/api/evidence/upload", { method: "POST", body: form });
    await createExternalEvidence({ activityId: "p1", fileName: "video", contentType: "text/uri-list", storageUrl: "https://example.com", uploadedBy: "Equipo" });
    expect(apiMock).toHaveBeenLastCalledWith("/api/evidence", expect.objectContaining({ method: "POST" }));
    await markEvidenceAttached("p1");
    expect(apiMock).toHaveBeenLastCalledWith("/api/activities/p1/evidence-attached", { method: "PATCH" });
    await deleteEvidence("e1");
    expect(apiMock).toHaveBeenLastCalledWith("/api/evidence/e1", { method: "DELETE" });
  });
});

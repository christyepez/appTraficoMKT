import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, defaultBrandSettings } from "../../../app/lib";
import { deleteAgendaItem, getAgendaWorkspace, saveAgendaItem } from "./agenda.service";
vi.mock("../../../app/lib", () => ({ api: vi.fn(), defaultBrandSettings: { workdayStartTime: "08:00", workdayEndTime: "17:00", replanningWindowDays: 3 } }));
const apiMock = vi.mocked(api);
beforeEach(() => vi.clearAllMocks());
describe("agenda.service", () => {
  it("carga las cinco fuentes y aplica jornada fallback", async () => { apiMock.mockImplementation((path) => Promise.resolve(path === "/api/identity/brand-settings" ? {} : []) as never); const data = await getAgendaWorkspace(); expect(data.workdayStartTime).toBe(defaultBrandSettings.workdayStartTime); expect(apiMock).toHaveBeenCalledTimes(5); });
  it("crea, edita y elimina con los endpoints actuales", async () => { apiMock.mockResolvedValue({} as never); const payload = { activityId: "p", technicianName: "T", technicianEmail: "t@x", startAt: "s", endAt: "e", title: "T", notes: "", createdBy: "u" }; await saveAgendaItem(null, payload); expect(apiMock).toHaveBeenLastCalledWith("/api/agenda", expect.objectContaining({ method: "POST" })); await saveAgendaItem({ id: "a1" } as never, payload); expect(apiMock).toHaveBeenLastCalledWith("/api/agenda/a1", expect.objectContaining({ method: "PUT" })); await deleteAgendaItem("a1"); expect(apiMock).toHaveBeenLastCalledWith("/api/agenda/a1", { method: "DELETE" }); });
});

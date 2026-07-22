import { describe, expect, it } from "vitest";
import { attachableActivities, isFinalActivity, toggleExpanded } from "./evidence-workspace.utils";

describe("evidence workspace utils", () => {
  it("distingue productos finales y adjuntables", () => {
    expect(isFinalActivity("Approved")).toBe(true);
    expect(isFinalActivity("InProgress")).toBe(false);
    expect(attachableActivities([{ id: "p1", status: "Todo" }, { id: "p2", status: "Completed" }] as never).map((item) => item.id)).toEqual(["p1"]);
  });

  it("expande y contrae una tarjeta sin mutar", () => {
    const initial = ["p1"];
    expect(toggleExpanded(initial, "p2")).toEqual(["p1", "p2"]);
    expect(toggleExpanded(initial, "p1")).toEqual([]);
    expect(initial).toEqual(["p1"]);
  });
});

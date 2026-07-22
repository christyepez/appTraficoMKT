import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePublicRequirementAvailability } from "./usePublicRequirementAvailability";

describe("usePublicRequirementAvailability", () => {
  it("carga disponibilidad y permite reintentar", async () => {
    const loadBrand = vi.fn().mockResolvedValue({ showPublicRequirementFullPage: true, publicRequirementFullPageActiveFrom: null, publicRequirementFullPageActiveUntil: null });
    const { result } = renderHook(() => usePublicRequirementAvailability(loadBrand as never));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.availability?.enabled).toBe(true);
    await act(async () => result.current.reload());
    expect(loadBrand).toHaveBeenCalledTimes(2);
  });

  it("expone error recuperable", async () => {
    const loadBrand = vi.fn().mockRejectedValue(new Error("Sin conexión"));
    const { result } = renderHook(() => usePublicRequirementAvailability(loadBrand as never));
    await waitFor(() => expect(result.current.error).toBe("Sin conexión"));
  });
});

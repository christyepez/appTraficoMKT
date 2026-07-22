import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SatisfactionServiceError } from "../models/satisfaction.models";
import { useSatisfaction } from "./useSatisfaction";

const context = { requirementCode: "REQ-1", activityOrEvent: "Evento", requestedBy: "ana@example.com", alreadySubmitted: false };
const payload = { overallRating: 5, timelinessRating: 4, qualityRating: 5, wouldRecommend: true, comments: "Bien" };

describe("useSatisfaction", () => {
  it("presenta formulario para token válido y confirmación final", async () => {
    const load = vi.fn().mockResolvedValue(context);
    const send = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() => useSatisfaction("opaque-value", load, send));
    await waitFor(() => expect(result.current.state).toBe("form"));
    await act(async () => { expect(await result.current.submit(payload)).toBe(true); });
    expect(result.current.state).toBe("submitted");
    expect(result.current.message).toContain("Gracias");
  });

  it("reconoce encuesta ya usada", async () => {
    const load = vi.fn().mockResolvedValue({ ...context, alreadySubmitted: true });
    const { result } = renderHook(() => useSatisfaction("opaque-value", load, vi.fn()));
    await waitFor(() => expect(result.current.state).toBe("used"));
  });

  it.each(["invalid", "expired", "network"] as const)("presenta estado %s", async (code) => {
    const load = vi.fn().mockRejectedValue(new SatisfactionServiceError(code, `Estado ${code}`));
    const { result } = renderHook(() => useSatisfaction("opaque-value", load, vi.fn()));
    await waitFor(() => expect(result.current.state).toBe(code === "network" ? "error" : code));
    expect(result.current.message).toContain("Estado");
  });

  it("impide un segundo envío simultáneo y conserva error recuperable", async () => {
    let rejectRequest!: (reason: Error) => void;
    const send = vi.fn().mockReturnValue(new Promise((_, reject) => { rejectRequest = reject; }));
    const load = vi.fn().mockResolvedValue(context);
    const { result } = renderHook(() => useSatisfaction("opaque-value", load, send));
    await waitFor(() => expect(result.current.state).toBe("form"));
    let first!: Promise<boolean>;
    await act(async () => {
      first = result.current.submit(payload);
      expect(await result.current.submit(payload)).toBe(false);
    });
    expect(send).toHaveBeenCalledTimes(1);
    await act(async () => { rejectRequest(new SatisfactionServiceError("api", "Servicio no disponible")); await first; });
    expect(result.current.state).toBe("form");
    expect(result.current.message).toBe("Servicio no disponible");
  });
});

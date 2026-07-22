import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SatisfactionForm } from "./SatisfactionForm";

describe("SatisfactionForm", () => {
  it("expone escalas accesibles y valida las tres respuestas", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<SatisfactionForm submitting={false} onSubmit={submit} />);
    expect(within(screen.getByRole("group", { name: "Satisfacción general" })).getAllByRole("radio")).toHaveLength(5);
    await user.click(screen.getByRole("button", { name: "Enviar respuesta" }));
    expect(await screen.findAllByRole("alert")).toHaveLength(3);
    expect(submit).not.toHaveBeenCalled();
  });

  it("convierte escalas y bloquea el botón durante envío", async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(true);
    render(<SatisfactionForm submitting={false} onSubmit={submit} />);
    for (const name of ["Satisfacción general", "Cumplimiento de tiempos", "Calidad del resultado"]) {
      await user.click(within(screen.getByRole("group", { name })).getByRole("radio", { name: /^5/ }));
    }
    await user.click(screen.getByLabelText("Recomendaría este servicio"));
    await user.type(screen.getByLabelText("Comentarios"), "Excelente");
    await user.click(screen.getByRole("button", { name: "Enviar respuesta" }));
    expect(submit).toHaveBeenCalledWith({ overallRating: 5, timelinessRating: 5, qualityRating: 5, wouldRecommend: true, comments: "Excelente" });
    render(<SatisfactionForm submitting onSubmit={submit} />);
    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
  });
});

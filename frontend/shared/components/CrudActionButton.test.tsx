import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CrudActionButton } from "./CrudActionButton";

describe("CrudActionButton", () => {
  it.each([
    ["create", "Crear registro"],
    ["edit", "Editar registro"],
    ["delete", "Eliminar registro"]
  ] as const)("renderiza la acción %s con etiqueta accesible", (action, label) => {
    render(<CrudActionButton action={action} label={label} />);
    const button = screen.getByRole("button", { name: label });
    expect(button).toHaveClass("icon-button");
    expect(button.querySelector("svg")).toBeInTheDocument();
    if (action === "delete") expect(button).toHaveClass("danger");
  });
});

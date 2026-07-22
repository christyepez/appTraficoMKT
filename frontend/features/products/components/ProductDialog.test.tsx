import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProductDialog } from "./ProductDialog";

describe("ProductDialog", () => {
  it("gestiona foco, ciclo de tabulación, Escape y restauración", async () => {
    const user = userEvent.setup();
    const opener = document.createElement("button");
    opener.textContent = "Abrir";
    document.body.append(opener);
    opener.focus();
    const onClose = vi.fn();
    const { unmount } = render(
      <ProductDialog labelledBy="dialog-title" onClose={onClose}>
        <h2 id="dialog-title">Detalle</h2>
        <button>Primero</button>
        <button>Último</button>
      </ProductDialog>
    );

    expect(screen.getByRole("button", { name: "Primero" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Último" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it("no cierra con Escape durante una operación bloqueada", () => {
    const onClose = vi.fn();
    render(<ProductDialog labelledBy="locked-title" onClose={onClose} closeDisabled><h2 id="locked-title">Guardando</h2></ProductDialog>);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globals = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
const calendar = readFileSync(resolve(process.cwd(), "shared/styles/CalendarPatterns.module.css"), "utf8");
const publicAccess = readFileSync(resolve(process.cwd(), "shared/styles/PublicAccess.module.css"), "utf8");

describe("responsive visual contract", () => {
  it("usa todo el viewport sin límites de escritorio heredados", () => {
    expect(globals).toContain("min-height: 100dvh");
    expect(globals).not.toMatch(/max-width:\s*(1180|1480|1560)px/);
    expect(calendar).toContain("max-width: none");
    expect(publicAccess).toContain("min-height: 100dvh");
  });

  it("mantiene los controles principales sin borde visible", () => {
    expect(globals).toMatch(/\.field input,[\s\S]*?border:\s*0;/);
    expect(globals).toMatch(/\.icon-button\s*{[\s\S]*?border:\s*0;/);
    expect(globals).toMatch(/\.button\.secondary\s*{[\s\S]*?border:\s*0;/);
    expect(calendar).toMatch(/\.root :global\(\.segmented-control\)\s*{[\s\S]*?border:\s*0;/);
  });

  it("agrupa checkbox y estabiliza los botones de actualización", () => {
    expect(globals).toMatch(/\.check-field input\[type="checkbox"\][\s\S]*?order:\s*2;/);
    expect(globals).toMatch(/\.check-group\s*{[\s\S]*?grid-column:\s*1\s*\/\s*-1;/);
    expect(globals).toMatch(/\.button:has\(\.lucide-refresh-cw\)\s*{[\s\S]*?min-width:\s*132px;/);
  });
});

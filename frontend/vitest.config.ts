import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["features/{products,evidence,approvals,agenda,agenda-calendar,agenda-metrics,requirements,metrics,audit}/{hooks,schemas,services,utils}/**/*.ts", "shared/utils/**/*.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 80
      }
    }
  }
});

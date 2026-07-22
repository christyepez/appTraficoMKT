import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["features/{products,evidence,approvals,agenda,agenda-calendar,agenda-metrics,requirements,metrics,audit,administration,users,branding,notifications,storage,initial-import,auth,public-requirement,satisfaction,shell}/{hooks,schemas,services,utils}/**/*.ts", "core/{branding,auth,api,configuration,permissions}/**/*.ts", "shared/utils/**/*.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 80
      }
    }
  }
});

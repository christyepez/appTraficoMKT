import { describe, expect, it } from "vitest";
import { changePasswordSchema, forgotPasswordSchema, loginSchema } from "./auth.schemas";

describe("auth schemas", () => {
  it("valida credenciales locales", () => {
    expect(loginSchema.safeParse({ email: "ana@example.com", password: "clave" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "correo", password: "" }).success).toBe(false);
  });

  it("valida recuperación y confirmación de clave", () => {
    expect(forgotPasswordSchema.safeParse({ email: "ana@example.com" }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ email: "ana@example.com", currentPassword: "temporal", newPassword: "Nueva123!", confirmPassword: "otra" }).success).toBe(false);
  });
});

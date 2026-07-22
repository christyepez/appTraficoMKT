import { describe, expect, it } from "vitest";
import { userFormSchema } from "./user.schema";

const valid = {
  name: "Ana",
  email: "ana@example.com",
  password: "User123!",
  authProvider: "Local" as const,
  allowMicrosoftLogin: false,
  role: "Solicitante",
  screenPermissions: ["dashboard"],
  menuMode: "horizontal" as const,
  menuCollapsed: false,
  isActive: true,
  editing: false
};

describe("userFormSchema", () => {
  it("acepta el alta válida", () => expect(userFormSchema.safeParse(valid).success).toBe(true));

  it("exige correo, pantalla y clave inicial válida", () => {
    const result = userFormSchema.safeParse({ ...valid, email: "incorrecto", password: "123", screenPermissions: [] });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(expect.arrayContaining(["email", "password", "screenPermissions"]));
  });

  it("permite editar sin cambiar la clave y valida una clave nueva", () => {
    expect(userFormSchema.safeParse({ ...valid, editing: true, password: "" }).success).toBe(true);
    expect(userFormSchema.safeParse({ ...valid, editing: true, password: "breve" }).success).toBe(false);
  });
});

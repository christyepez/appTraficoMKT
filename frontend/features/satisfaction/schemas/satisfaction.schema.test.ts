import { describe, expect, it } from "vitest";
import { satisfactionSchema } from "./satisfaction.schema";

const valid = { overallRating: "5", timelinessRating: "4", qualityRating: "5", wouldRecommend: true, comments: "Excelente" };

describe("satisfaction schema", () => {
  it("acepta las tres escalas y comentario válido", () => expect(satisfactionSchema.safeParse(valid).success).toBe(true));
  it("rechaza escalas vacías o fuera del rango y comentarios extensos", () => {
    expect(satisfactionSchema.safeParse({ ...valid, overallRating: "" }).success).toBe(false);
    expect(satisfactionSchema.safeParse({ ...valid, qualityRating: "6" }).success).toBe(false);
    expect(satisfactionSchema.safeParse({ ...valid, comments: "x".repeat(2001) }).success).toBe(false);
  });
});

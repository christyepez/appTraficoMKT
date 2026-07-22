import { z } from "zod";

const rating = z.enum(["1", "2", "3", "4", "5"], { message: "Seleccione una calificación." });

export const satisfactionSchema = z.object({
  overallRating: rating,
  timelinessRating: rating,
  qualityRating: rating,
  wouldRecommend: z.boolean(),
  comments: z.string().trim().max(2000, "Los comentarios no pueden superar 2000 caracteres.")
});

export type SatisfactionValues = z.infer<typeof satisfactionSchema>;

export const satisfactionDefaults = {
  wouldRecommend: false,
  comments: ""
};

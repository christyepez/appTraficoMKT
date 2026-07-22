import { z } from "zod";

export const evidenceUploadSchema = z.object({
  activityId: z.string().min(1, "Seleccione un producto."),
  mode: z.enum(["file", "url"]),
  url: z.string(),
  urlName: z.string().max(240, "Use máximo 240 caracteres."),
  uploadedBy: z.string().trim().min(1, "Indique quién adjunta la evidencia.")
});

export type EvidenceUploadValues = z.infer<typeof evidenceUploadSchema>;

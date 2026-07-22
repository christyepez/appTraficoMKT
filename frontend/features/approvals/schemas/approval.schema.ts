import { z } from "zod";

export const approvalDecisionSchema = z.object({
  decision: z.enum(["Approved", "Rejected"]),
  comments: z.string().trim().min(3, "Ingrese un comentario de al menos 3 caracteres.").max(1000, "Use máximo 1000 caracteres.")
});

export type ApprovalDecisionValues = z.infer<typeof approvalDecisionSchema>;

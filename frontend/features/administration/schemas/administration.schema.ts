import { z } from "zod";
const code = z.string().trim().regex(/^[A-Za-z0-9_-]{2,40}$/, "Use entre 2 y 40 letras, números, guion o guion bajo.");
const name = z.string().trim().min(1, "Ingrese el nombre.");
const base = { code, name, isActive: z.boolean() };
export const administrationFormSchema = z.discriminatedUnion("variant", [
  z.object({ variant: z.literal("faculties"), ...base }), z.object({ variant: z.literal("campuses"), ...base }),
  z.object({ variant: z.literal("careers"), ...base, facultyId: z.string().min(1, "Seleccione una facultad.") }),
  z.object({ variant: z.literal("catalogs"), ...base, type: z.string().trim().min(1, "Ingrese el tipo de catálogo.").max(80) }),
  z.object({ variant: z.literal("approvers"), name, email: z.string().trim().email("Ingrese un correo válido."), approvalLevel: z.number().int().min(1, "El nivel mínimo es 1."), facultyId: z.string(), isActive: z.boolean() })
]);
export const catalogFormSchema = z.discriminatedUnion("variant", administrationFormSchema.options.slice(0, 4) as [typeof administrationFormSchema.options[0], typeof administrationFormSchema.options[1], typeof administrationFormSchema.options[2], typeof administrationFormSchema.options[3]]);
export const approverFormSchema = administrationFormSchema.options[4];
export type AdministrationFormValues = z.infer<typeof administrationFormSchema>;
export type CatalogFormValues = z.infer<typeof catalogFormSchema>;
export type ApproverFormValues = z.infer<typeof approverFormSchema>;

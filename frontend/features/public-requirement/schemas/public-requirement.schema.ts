import { buildRequirementFormSchema, requirementFormSchema } from "../../requirements/domain/requirement-form.schema";
import { requirementFormDefaults } from "../../requirements/domain/requirement-form.mappers";
import type { RequirementFormCatalogs, RequirementFormValues } from "../../requirements/domain/requirement-form.types";

export const publicRequirementSchema = requirementFormSchema;
export const publicRequirementDefaults = requirementFormDefaults();
export type PublicRequirementValues = RequirementFormValues;

export function buildPublicRequirementSchema(catalogs: RequirementFormCatalogs) {
  return buildRequirementFormSchema(catalogs);
}

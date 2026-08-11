import { defaultRequirementAudienceType } from "./requirement-form.constants";
import type { LegacyRequirementPayload, RequirementFormCatalogs, RequirementFormSource, RequirementFormValues } from "./requirement-form.types";
import { joinDateTime, selectedCatalogNames, splitDateTime } from "./requirement-form.utils";

export const emptyRequirementFormValues: RequirementFormValues = {
  activityOrEvent: "",
  requesterName: "",
  requesterEmail: "",
  facultyId: "",
  faculty: "",
  careerId: "",
  career: "",
  campusId: "",
  campus: "",
  place: "",
  startAt: "",
  endAt: "",
  audienceType: defaultRequirementAudienceType,
  eventFormatId: "",
  eventFormat: "",
  eventObjective: "",
  activityFormatDescription: "",
  attachments: []
};

export function requirementFormDefaults(source?: RequirementFormSource | null): RequirementFormValues {
  if (!source) return { ...emptyRequirementFormValues, attachments: [] };
  const requesterEmail = source.requesterEmail?.trim() || source.requestedBy?.trim() || "";
  return {
    activityOrEvent: source.activityOrEvent ?? "",
    requesterName: source.requesterName?.trim() || requesterEmail,
    requesterEmail,
    facultyId: source.facultyId ?? "",
    faculty: source.faculty ?? "",
    careerId: source.careerId ?? "",
    career: source.career ?? "",
    campusId: source.campusId ?? "",
    campus: source.campus ?? "",
    place: source.place ?? "",
    startAt: source.startAt ?? joinDateTime(source.startDate, source.startTime),
    endAt: source.endAt ?? joinDateTime(source.endDate, source.endTime),
    audienceType: normalizeAudienceType(source.audienceType),
    eventFormatId: source.eventFormatId ?? "",
    eventFormat: source.eventFormat ?? "",
    eventObjective: source.eventObjective ?? "",
    activityFormatDescription: source.activityFormatDescription ?? "",
    attachments: []
  };
}

export function mapRequirementFormToLegacyPayload(values: RequirementFormValues, catalogs: RequirementFormCatalogs, requestDate = new Date().toISOString().slice(0, 10)): LegacyRequirementPayload {
  const start = splitDateTime(values.startAt);
  const end = splitDateTime(values.endAt);
  const names = selectedCatalogNames(values, catalogs);
  return {
    activityOrEvent: values.activityOrEvent.trim(),
    requestedBy: values.requesterEmail.trim(),
    requesterName: values.requesterName.trim(),
    requesterEmail: values.requesterEmail.trim(),
    facultyId: values.facultyId,
    faculty: names.faculty,
    careerId: values.careerId || null,
    career: names.career,
    campusId: values.campusId,
    campus: names.campus,
    place: values.place.trim(),
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    audienceType: values.audienceType,
    eventObjective: values.eventObjective.trim(),
    eventFormatId: values.eventFormatId ?? "",
    eventFormat: names.eventFormat,
    activityFormatDescription: values.activityFormatDescription.trim(),
    requestDate
  };
}

export function normalizeAudienceType(value: RequirementFormSource["audienceType"]) {
  return value === "external" || value === "mixed" || value === "internal" ? value : defaultRequirementAudienceType;
}

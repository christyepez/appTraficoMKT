import type { PublicAvailability, PublicRequirementCatalogs, PublicRequirementPayload } from "../models/public-requirement.models";
import type { PublicRequirementValues } from "../schemas/public-requirement.schema";

export function isPublicFeatureActive(availability: PublicAvailability, now = Date.now()) {
  if (!availability.enabled) return false;
  const from = availability.activeFrom ? new Date(availability.activeFrom).getTime() : Number.NEGATIVE_INFINITY;
  const until = availability.activeUntil ? new Date(availability.activeUntil).getTime() : Number.POSITIVE_INFINITY;
  if (Number.isNaN(from) || Number.isNaN(until)) return false;
  return now >= from && now <= until;
}

export function mapPublicRequirementPayload(values: PublicRequirementValues, catalogs: PublicRequirementCatalogs, requestDate = new Date().toISOString().slice(0, 10)): PublicRequirementPayload {
  return {
    activityOrEvent: values.activityOrEvent.trim(),
    requestedBy: values.requestedBy.trim(),
    facultyId: values.facultyId,
    faculty: catalogs.faculties.find((item) => item.id === values.facultyId)?.name ?? "",
    career: catalogs.careers.find((item) => item.id === values.careerId)?.name ?? "",
    campusId: values.campusId,
    campus: catalogs.campuses.find((item) => item.id === values.campusId)?.name ?? "",
    place: values.place.trim(),
    startDate: values.startDate,
    startTime: values.startTime || null,
    endDate: values.endDate,
    endTime: values.endTime || null,
    eventObjective: values.eventObjective.trim(),
    eventFormatId: values.eventFormatId,
    eventFormat: catalogs.eventFormats.find((item) => item.id === values.eventFormatId)?.name ?? "",
    requestDate
  };
}

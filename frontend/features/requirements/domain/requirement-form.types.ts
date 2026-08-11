import type { audienceTypes } from "./requirement-form.constants";

export type RequirementAudienceType = (typeof audienceTypes)[number];

export type RequirementFormCatalog = {
  id: string;
  name: string;
  isActive?: boolean;
  facultyId?: string;
};

export type RequirementFormCatalogs = {
  faculties: RequirementFormCatalog[];
  careers: RequirementFormCatalog[];
  campuses: RequirementFormCatalog[];
  eventFormats: RequirementFormCatalog[];
};

export type RequirementFormValues = {
  activityOrEvent: string;
  requesterName: string;
  requesterEmail: string;
  facultyId: string;
  faculty: string;
  careerId?: string;
  career: string;
  campusId: string;
  campus: string;
  place: string;
  startAt: string;
  endAt: string;
  audienceType: RequirementAudienceType;
  eventFormatId?: string;
  eventFormat?: string;
  eventObjective: string;
  activityFormatDescription: string;
  attachments: File[];
};

export type LegacyRequirementPayload = {
  activityOrEvent: string;
  requestedBy: string;
  requesterName?: string;
  requesterEmail?: string;
  facultyId: string;
  faculty: string;
  careerId?: string | null;
  career: string;
  campusId: string;
  campus: string;
  place: string;
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  audienceType?: RequirementAudienceType;
  eventObjective: string;
  eventFormatId: string;
  eventFormat: string;
  activityFormatDescription?: string;
  requestDate: string;
};

export type RequirementFormSource = {
  activityOrEvent?: string;
  requestedBy?: string;
  requesterName?: string | null;
  requesterEmail?: string | null;
  facultyId?: string;
  faculty?: string;
  careerId?: string | null;
  career?: string;
  campusId?: string;
  campus?: string;
  place?: string;
  startDate?: string;
  startTime?: string | null;
  endDate?: string;
  endTime?: string | null;
  startAt?: string;
  endAt?: string;
  audienceType?: RequirementAudienceType | string | null;
  eventFormatId?: string;
  eventFormat?: string;
  eventObjective?: string;
  activityFormatDescription?: string | null;
};

export type RequirementAttachmentValidationResult = {
  valid: boolean;
  message?: string;
};

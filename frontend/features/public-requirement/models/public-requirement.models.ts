export type PublicCatalog = {
  id: string;
  name: string;
  isActive: boolean;
  facultyId?: string;
};

export type PublicRequirementCatalogs = {
  faculties: PublicCatalog[];
  careers: PublicCatalog[];
  campuses: PublicCatalog[];
  eventFormats: PublicCatalog[];
};

export type PublicRequirementPayload = {
  activityOrEvent: string;
  requestedBy: string;
  facultyId: string;
  faculty: string;
  career: string;
  campusId: string;
  campus: string;
  place: string;
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  eventObjective: string;
  eventFormatId: string;
  eventFormat: string;
  requestDate: string;
};

export type PublicAvailability = {
  enabled: boolean;
  activeFrom?: string | null;
  activeUntil?: string | null;
};

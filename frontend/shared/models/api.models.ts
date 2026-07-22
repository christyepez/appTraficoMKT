export type Requirement = {
  id: string;
  code: string;
  activityOrEvent: string;
  requestedBy: string;
  facultyId: string;
  faculty: string;
  career: string;
  campusId: string;
  campus: string;
  place: string;
  startDate: string;
  startTime?: string | null;
  endDate: string;
  endTime?: string | null;
  eventObjective: string;
  eventFormatId: string;
  eventFormat: string;
  requestDate: string;
  status: string;
  statusId: string;
};

export type Activity = {
  id: string;
  requirementId: string;
  productId: string;
  requirementTypeId: string;
  requirementType: string;
  strategicObjective: string;
  targetAudienceId: string;
  targetAudience: string;
  productTypeId: string;
  productType: string;
  diffusionChannelId: string;
  diffusionChannel: string;
  mainKpiId: string;
  mainKpi: string;
  productResponsible: string;
  productDeliveryDate?: string;
  observations: string;
  status: string;
  statusId: string;
};

export type NamedCatalog = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  type?: string;
};

export type Approver = {
  id: string;
  name: string;
  email: string;
  facultyId?: string;
  campusId?: string;
  approvalLevel: number;
  isActive: boolean;
};

export type EvidenceItem = {
  id: string;
  activityId: string;
  fileName: string;
  contentType?: string;
  storageUrl: string;
  uploadedBy: string;
  createdAt?: string;
};

export type Approval = {
  id: string;
  activityId: string;
  decision: string;
  approvedBy: string;
  comments: string;
  createdAt?: string;
};

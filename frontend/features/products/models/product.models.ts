import type { Activity, Requirement } from "../../../shared/models/api.models";

export type Product = Activity;

export type CatalogItem = {
  id: string;
  type: string;
  code: string;
  name: string;
  isActive: boolean;
};

export type ProductCatalogs = {
  requirementTypes: CatalogItem[];
  targetAudiences: CatalogItem[];
  productTypes: CatalogItem[];
  diffusionChannels: CatalogItem[];
  mainKpis: CatalogItem[];
};

export type EvidenceItem = {
  id: string;
  activityId: string;
  fileName: string;
  storageUrl: string;
  uploadedBy: string;
};

export type Technician = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
};

export type Approval = {
  id: string;
  activityId: string;
  decision: string;
  approvedBy: string;
  comments: string;
  createdAt: string;
};

export type ProductWorkspaceData = {
  requirements: Requirement[];
  products: Product[];
  evidence: EvidenceItem[];
  approvals: Approval[];
  technicians: Technician[];
  nextProductId: string | null;
  showProductIdField: boolean;
  catalogs: ProductCatalogs;
};

export type SaveProductPayload = {
  requirementId: string;
  productId: string | null;
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
  productDeliveryDate: string | null;
  observations: string;
};

export type ExternalEvidencePayload = {
  activityId: string;
  fileName: string;
  contentType: "text/uri-list";
  storageUrl: string;
  uploadedBy: FormDataEntryValue | null;
};

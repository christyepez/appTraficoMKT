import type { Activity, Approval, EvidenceItem, Requirement, Technician } from "../../../shared/models/api.models";

export type { Approval, EvidenceItem, ExternalEvidencePayload, Technician } from "../../../shared/models/api.models";

export type Product = Activity;
export type ProductStatusAction = "start" | "submit-approval" | "evidence-attached";

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

export const REQUIREMENT_WORD_LIMIT = 70;
export const REQUIREMENT_ATTACHMENT_LIMIT = 5;
export const REQUIREMENT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

export const requirementAttachmentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
] as const;

export const requirementAttachmentExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"] as const;

export const audienceTypes = ["internal", "external", "mixed"] as const;

export const defaultRequirementAudienceType = "internal";

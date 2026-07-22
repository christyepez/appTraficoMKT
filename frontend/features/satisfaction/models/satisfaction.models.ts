export type SatisfactionContext = {
  requirementCode: string;
  activityOrEvent: string;
  requestedBy: string;
  alreadySubmitted: boolean;
  submittedAt?: string;
};

export type SatisfactionPayload = {
  overallRating: number;
  timelinessRating: number;
  qualityRating: number;
  wouldRecommend: boolean;
  comments: string;
};

export type SatisfactionState = "loading" | "form" | "used" | "invalid" | "expired" | "error" | "submitted";
export type SatisfactionErrorCode = "invalid" | "expired" | "used" | "api" | "network";

export class SatisfactionServiceError extends Error {
  constructor(public readonly code: SatisfactionErrorCode, message: string) {
    super(message);
    this.name = "SatisfactionServiceError";
  }
}

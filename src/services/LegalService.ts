import { get, post } from "@/services/ApiService.ts";

export const LegalDocumentType = {
  TERMS: "TERMS",
  PRIVACY: "PRIVACY",
} as const;

export type LegalDocumentType = (typeof LegalDocumentType)[keyof typeof LegalDocumentType];

export interface LegalDocumentSubmission {
  type: LegalDocumentType;
  version: string;
}

export interface LegalRequirement {
  type: LegalDocumentType;
  version: string;
  publishedDate: string;
  effectiveDate: string;
  acceptanceRequired: boolean;
}

export interface LegalRequirementsResponse {
  documents: LegalRequirement[];
}

export interface LegalDocumentConsentState {
  type: LegalDocumentType;
  currentVersion: string;
  acceptedVersion: string | null;
  acceptanceRequired: boolean;
  actionRequired: boolean;
}

export interface LegalConsentState {
  required: boolean;
  documents: LegalDocumentConsentState[];
}

export interface RegistrationLegalConsent {
  age18Confirmed: boolean;
  documents: LegalDocumentSubmission[];
}

export const getLegalRequirements = (): Promise<LegalRequirementsResponse> =>
  get<LegalRequirementsResponse>("/public/legal/requirements");

export const acceptLegalConsents = (documents: LegalDocumentSubmission[]): Promise<LegalConsentState> =>
  post<LegalConsentState>("/private/legal/consents", { documents });

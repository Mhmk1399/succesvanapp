export const CONTRACT_STATUSES = [
  "draft",
  "generating",
  "ready",
  "sent",
  "delivered",
  "viewed",
  "signing",
  "completed",
  "declined",
  "voided",
  "expired",
  "error",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export type ContractDocumentKind = "source" | "signed" | "certificate";

export type SafeContractSummary = {
  _id: string;
  bookingId: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  contractNumber: string;
  contractType?: "rental_agreement" | "reservation_extension";
  extension?: { newReturnDateTime?: string; agreedPrice?: number };
  status: ContractStatus;
  bookingReference?: string;
  vehicleLabel?: string;
  docusign?: {
    envelopeId?: string;
    envelopeStatus?: string;
    sentAt?: string;
    deliveredAt?: string;
    viewedAt?: string;
    completedAt?: string;
    declinedAt?: string;
    voidedAt?: string;
    declineReason?: string;
    voidReason?: string;
    statusChangedAt?: string;
  };
  files: {
    source: boolean;
    signed: boolean;
    certificate: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
};

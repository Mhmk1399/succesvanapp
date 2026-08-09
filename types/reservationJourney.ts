import type {
  DepositOption,
  PublicJourneyStep,
  ReservationStatus,
} from "@/constants/reservationStatus";

export type { PublicJourneyStep };

export type JourneyStepState =
  | "completed"
  | "current"
  | "upcoming"
  | "blocked"
  | "failed";

export interface ReservationJourneyStep {
  key: PublicJourneyStep;
  label: string;
  state: JourneyStepState;
  date?: string;
  description?: string;
}

export type ReservationNextActionType =
  | "none"
  | "pay_deposit"
  | "sign_contract"
  | "upload_documents"
  | "view_collection"
  | "view_return"
  | "view_refund"
  | "contact_support"
  | "book_again";

export interface ReservationNextAction {
  type: ReservationNextActionType;
  title: string;
  description: string;
  buttonLabel?: string;
  href?: string;
  disabled?: boolean;
}

export type ContractPanelStatus =
  | "not_created"
  | "generating"
  | "awaiting_customer_signature"
  | "signed"
  | "expired";

export interface ReservationJourneyViewModel {
  reservationId: string;
  bookingReference: string;
  vehicleName: string;
  vehicleImage?: string;
  pickupDateTime: string;
  returnDateTime: string;
  durationLabel: string;
  publicStatusLabel: string;
  mainStatus: ReservationStatus;
  steps: ReservationJourneyStep[];
  nextAction: ReservationNextAction;
  deposit?: {
    amount: number;
    option?: DepositOption;
    status: string;
    paidAt?: string;
    dueAt?: string;
    receiptUrl?: string;
    failureReason?: string;
  };
  contract?: {
    status: ContractPanelStatus;
    contractId?: string;
    contractNumber?: string;
    signedAt?: string;
  };
  collection?: {
    location: string;
    collectionCode?: string;
    readyAt?: string;
  };
  refund?: {
    depositPaid: number;
    deductionsTotal: number;
    refundAmount: number;
    status: string;
    reference?: string;
    expectedBy?: string;
  };
}

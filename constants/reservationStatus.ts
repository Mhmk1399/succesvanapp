export const RESERVATION_JOURNEY_STATUSES = [
  "pending",
  "confirmed",
  "deposit_pending",
  "deposit_paid",
  "contract_pending",
  "contract_signed",
  "ready_for_collection",
  "handover_in_progress",
  "delivered",
  "vehicle_returned",
  "return_inspection",
  "deposit_review",
  "refund_processing",
  "refund_completed",
  "completed",
] as const;

export const RESERVATION_PROBLEM_STATUSES = ["canceled", "expired"] as const;

export const RESERVATION_STATUSES = [
  ...RESERVATION_JOURNEY_STATUSES,
  ...RESERVATION_PROBLEM_STATUSES,
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const RESERVATION_STATUS_ALIASES: Record<string, ReservationStatus> = {
  pending_review: "pending",
  rental_active: "delivered",
  collected: "delivered",
  cancelled: "canceled",
};

export function normalizeReservationStatus(
  value: unknown,
): ReservationStatus | null {
  if (typeof value !== "string") return null;
  const status = value.trim().toLowerCase();
  if ((RESERVATION_STATUSES as readonly string[]).includes(status)) {
    return status as ReservationStatus;
  }
  return RESERVATION_STATUS_ALIASES[status] ?? null;
}

export function isProblemStatus(status: ReservationStatus) {
  return (RESERVATION_PROBLEM_STATUSES as readonly string[]).includes(status);
}

export const PUBLIC_JOURNEY_STEPS = [
  "submitted",
  "confirmed",
  "licence",
  "deposit",
  "vehicle_assignment",
  "contract",
  "collection",
  "active_rental",
  "return",
  "refund",
  "complete",
] as const;

export type PublicJourneyStep = (typeof PUBLIC_JOURNEY_STEPS)[number];

export const STATUS_TO_PUBLIC_STEP: Record<ReservationStatus, PublicJourneyStep> =
  {
    pending: "submitted",
    confirmed: "confirmed",
    deposit_pending: "deposit",
    deposit_paid: "vehicle_assignment",
    contract_pending: "contract",
    contract_signed: "contract",
    ready_for_collection: "collection",
    handover_in_progress: "collection",
    delivered: "active_rental",
    vehicle_returned: "return",
    return_inspection: "return",
    deposit_review: "refund",
    refund_processing: "refund",
    refund_completed: "refund",
    completed: "complete",
    canceled: "submitted",
    expired: "submitted",
  };

export const PUBLIC_STEP_LABELS: Record<PublicJourneyStep, string> = {
  submitted: "Submitted",
  confirmed: "Confirmed",
  licence: "Licence",
  deposit: "Deposit",
  vehicle_assignment: "Assign Vehicle",
  contract: "Contract",
  collection: "Collection",
  active_rental: "Active Rental",
  return: "Return",
  refund: "Refund",
  complete: "Complete",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Pending Review",
  confirmed: "Booking Confirmed",
  deposit_pending: "Deposit Payment",
  deposit_paid: "Deposit Paid",
  contract_pending: "Contract Signing",
  contract_signed: "Contract Signed",
  ready_for_collection: "Ready for Collection",
  handover_in_progress: "Vehicle Handover",
  delivered: "Rental Active",
  vehicle_returned: "Vehicle Returned",
  return_inspection: "Return Inspection",
  deposit_review: "Deposit Review",
  refund_processing: "Refund Processing",
  refund_completed: "Refund Completed",
  completed: "Complete",
  canceled: "Canceled",
  expired: "Expired",
};

export const DEPOSIT_OPTION_LABELS = {
  full: "Full deposit (bank transfer)",
  secure: "Safe & secure deposit",
  office: "Pay at office",
} as const;

export type DepositOption = keyof typeof DEPOSIT_OPTION_LABELS;

export function statusLabel(value: unknown) {
  const status = normalizeReservationStatus(value);
  return status ? RESERVATION_STATUS_LABELS[status] : String(value || "-");
}

export function statusTone(value: unknown) {
  const status = normalizeReservationStatus(value);
  switch (status) {
    case "pending":
    case "confirmed":
    case "deposit_pending":
    case "contract_pending":
      return { fg: "#f59e0b", bg: "rgba(245,158,11,0.14)" };
    case "deposit_paid":
    case "contract_signed":
    case "refund_completed":
      return { fg: "#34d399", bg: "rgba(52,211,153,0.14)" };
    case "ready_for_collection":
    case "vehicle_returned":
    case "return_inspection":
      return { fg: "#38bdf8", bg: "rgba(56,189,248,0.14)" };
    case "handover_in_progress":
    case "delivered":
    case "deposit_review":
    case "refund_processing":
    case "completed":
      return { fg: "#a78bfa", bg: "rgba(167,139,250,0.14)" };
    case "canceled":
    case "expired":
      return { fg: "#fb7185", bg: "rgba(251,113,133,0.14)" };
    default:
      return { fg: "#9ca3af", bg: "rgba(156,163,175,0.14)" };
  }
}

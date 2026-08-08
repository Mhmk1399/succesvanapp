import type { Reservation } from "@/types/type";
import type { SafeContractSummary } from "@/types/contract";
import type {
  ContractPanelStatus,
  JourneyStepState,
  ReservationJourneyStep,
  ReservationJourneyViewModel,
  ReservationNextAction,
} from "@/types/reservationJourney";
import {
  isProblemStatus,
  normalizeReservationStatus,
  PUBLIC_JOURNEY_STEPS,
  PUBLIC_STEP_LABELS,
  RESERVATION_STATUS_LABELS,
  STATUS_TO_PUBLIC_STEP,
  type PublicJourneyStep,
  type ReservationStatus,
} from "@/constants/reservationStatus";
import { formatDateTimeInLondon } from "@/utils/londonTime";

const ACTION_REQUIRED_STATUSES: ReservationStatus[] = [
  "confirmed",
  "deposit_pending",
  "contract_pending",
];

const LICENCE_REQUIRED_STATUSES: ReservationStatus[] = [
  "confirmed",
  "deposit_pending",
  "deposit_paid",
  "contract_pending",
];

export function formatDateTime(value?: string | Date) {
  return formatDateTimeInLondon(value);
}

export function formatMoney(value?: number) {
  return `£${Number(value || 0).toFixed(2)}`;
}

const reservationDateTime = (
  reservation: Reservation,
  type: "start" | "end",
) => {
  if (type === "start") {
    if (reservation.startDateDisplay && reservation.pickupTime) {
      return `${reservation.startDateDisplay} ${reservation.pickupTime}`;
    }
    return formatDateTime(reservation.startDate);
  }
  if (reservation.endDateDisplay && reservation.returnTime) {
    return `${reservation.endDateDisplay} ${reservation.returnTime}`;
  }
  return formatDateTime(reservation.endDate);
};

const durationLabel = (reservation: Reservation) => {
  const start = new Date(reservation.startDate).getTime();
  const end = new Date(reservation.endDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return "-";
  }
  const days = Math.ceil((end - start) / 86_400_000);
  return days === 1 ? "1 day" : `${days} days`;
};

const contractPanelStatus = (
  contract?: SafeContractSummary | null,
): ContractPanelStatus => {
  if (!contract) return "not_created";
  switch (contract.status) {
    case "draft":
    case "generating":
    case "ready":
      return "generating";
    case "sent":
    case "delivered":
    case "viewed":
    case "signing":
      return "awaiting_customer_signature";
    case "completed":
      return "signed";
    default:
      return "expired";
  }
};

const stepDate = (reservation: Reservation, step: PublicJourneyStep) => {
  const history = reservation.statusHistory || [];
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const status = normalizeReservationStatus(history[i].status);
    if (status && STATUS_TO_PUBLIC_STEP[status] === step) {
      return formatDateTime(history[i].changedAt);
    }
  }
  return undefined;
};

const buildSteps = (
  reservation: Reservation,
  status: ReservationStatus,
): ReservationJourneyStep[] => {
  const officeDepositSelected = reservation.deposit?.option === "office";
  const waitingForVehicleAfterOfficePay =
    officeDepositSelected &&
    ["confirmed", "deposit_pending", "deposit_paid"].includes(status);
  const waitingForDeposit = status === "confirmed" && !officeDepositSelected;
  const problem = isProblemStatus(status);
  const licenceMissing =
    !problem &&
    LICENCE_REQUIRED_STATUSES.includes(status) &&
    !isReservationLicenceReady(reservation);
  let referenceStatus: ReservationStatus = status;

  if (problem) {
    referenceStatus = "pending";
    for (const entry of reservation.statusHistory || []) {
      const normalized = normalizeReservationStatus(entry.status);
      if (normalized && !isProblemStatus(normalized)) {
        referenceStatus = normalized;
      }
    }
  }

  const currentStep = licenceMissing
    ? "licence"
    : waitingForVehicleAfterOfficePay
    ? "vehicle_assignment"
    : waitingForDeposit
      ? "deposit"
      : STATUS_TO_PUBLIC_STEP[referenceStatus];
  const currentIndex = PUBLIC_JOURNEY_STEPS.indexOf(currentStep);
  const done = status === "completed";
  const actionRequired =
    licenceMissing ||
    (ACTION_REQUIRED_STATUSES.includes(status) && !waitingForVehicleAfterOfficePay);

  return PUBLIC_JOURNEY_STEPS.map((key, index) => {
    let state: JourneyStepState;
    if (done || index < currentIndex) {
      state = "completed";
    } else if (index === currentIndex) {
      state = problem ? "failed" : actionRequired ? "blocked" : "current";
    } else {
      state = "upcoming";
    }

    return {
      key,
      label:
        key === "licence" && licenceMissing
          ? "Upload licence"
          : key === "licence"
            ? "Licence"
            : waitingForVehicleAfterOfficePay && key === "deposit"
              ? "Pay at office"
              : waitingForVehicleAfterOfficePay && key === "vehicle_assignment"
                ? "Vehicle assignment"
                : PUBLIC_STEP_LABELS[key],
      state,
      description:
        key === "licence" && licenceMissing
          ? "Upload the front and back of your driving licence, then confirm the scanned details."
          : key === "licence"
            ? "Your licence photos and scanned details are saved."
            : waitingForVehicleAfterOfficePay && key === "vehicle_assignment"
              ? "We'll assign your van before collection."
              : undefined,
      date:
        state === "completed" || state === "current" || state === "blocked"
          ? stepDate(reservation, key)
          : undefined,
    };
  });
};

const buildNextAction = (
  reservation: Reservation,
  status: ReservationStatus,
): ReservationNextAction => {
  const officeDepositSelected = reservation.deposit?.option === "office";
  if (
    LICENCE_REQUIRED_STATUSES.includes(status) &&
    !isProblemStatus(status) &&
    !isReservationLicenceReady(reservation)
  ) {
    return {
      type: "upload_documents",
      title: "Upload your driving licence",
      description:
        "Upload the front and back, then confirm the scanned details so we can prepare your agreement.",
      buttonLabel: "Upload licence",
      href: "#documents",
    };
  }

  switch (status) {
    case "pending":
      return {
        type: "none",
        title: "Booking under review",
        description:
          "We're checking vehicle availability and your booking details. We'll text you as soon as it's confirmed.",
        buttonLabel: "View details",
        href: "#summary",
      };
    case "confirmed":
    case "deposit_pending":
      if (reservation.deposit?.status === "failed") {
        return {
          type: "pay_deposit",
          title: "Payment receipt rejected",
          description:
            reservation.deposit.failureReason ||
            "The uploaded receipt could not be verified. Upload a new receipt for review.",
          buttonLabel: "Upload new receipt",
          href: "#deposit",
        };
      }
      if (officeDepositSelected) {
        return {
          type: "none",
          title: "Vehicle assignment pending",
          description:
            "Your pay-at-office choice is saved. We'll assign your van before collection.",
          buttonLabel: "Collection details",
          href: "#collection",
        };
      }
      return {
        type: "pay_deposit",
        title: "Pay your deposit",
        description: "Pay your deposit to secure your booking.",
        buttonLabel: "Pay deposit",
        href: "#deposit",
      };
    case "deposit_paid":
      return {
        type: "none",
        title: "Vehicle assignment pending",
        description:
          "Your deposit is received. We'll assign your van next, then your contract will be ready.",
      };
    case "contract_pending":
      return {
        type: "sign_contract",
        title: "Sign your rental agreement",
        description:
          "Please review and sign your rental agreement before collection.",
        buttonLabel: "Sign contract",
        href: "#contract",
      };
    case "contract_signed":
      return {
        type: "none",
        title: "Agreement signed",
        description: "All set on your side. We're getting your van ready.",
      };
    case "ready_for_collection":
      return {
        type: "view_collection",
        title: "Ready for collection",
        description: "Bring your documents and collection code.",
        buttonLabel: "Collection details",
        href: "#collection",
      };
    case "handover_in_progress":
      return {
        type: "view_collection",
        title: "Vehicle handover",
        description: "We're completing the handover checks with you.",
        buttonLabel: "Handover details",
        href: "#handover",
      };
    case "delivered":
      return {
        type: "view_return",
        title: "Rental in progress",
        description: "Please return the van on time.",
        buttonLabel: "Return instructions",
        href: "#return",
      };
    case "vehicle_returned":
    case "return_inspection":
      return {
        type: "view_return",
        title: "Return inspection",
        description: "We've received the van and are completing inspection.",
        buttonLabel: "Inspection status",
        href: "#inspection",
      };
    case "deposit_review":
    case "refund_processing":
      return {
        type: "view_refund",
        title: "Refund processing",
        description: "Your deposit refund is being processed.",
        buttonLabel: "Refund details",
        href: "#refund",
      };
    case "refund_completed":
      return {
        type: "view_refund",
        title: "Refund completed",
        description: "Your deposit refund has been sent.",
        buttonLabel: "Refund details",
        href: "#refund",
      };
    case "completed":
      return {
        type: "book_again",
        title: "Booking complete",
        description: "Your booking has been completed successfully.",
        buttonLabel: "Book again",
        href: "/vans",
      };
    case "canceled":
    case "expired":
      return {
        type: "contact_support",
        title: status === "canceled" ? "Booking canceled" : "Booking expired",
        description:
          reservation.cancelReason ||
          "This booking is no longer active. Contact us if you have questions.",
        buttonLabel: "Contact support",
        href: "tel:+442030111198",
      };
  }
};

export function isReservationLicenceReady(reservation: Reservation) {
  const user = reservation.user;
  return Boolean(
    user?.licenceAttached?.front &&
      user?.licenceAttached?.back &&
      user?.licenceDetails?.isFrontSide,
  );
}

export function buildReservationJourney(
  reservation: Reservation,
  contract?: SafeContractSummary | null,
): ReservationJourneyViewModel {
  const status = normalizeReservationStatus(reservation.status) ?? "pending";
  const vehicleName =
    reservation.vehicle?.title ||
    reservation.category?.name ||
    "Success Van booking";
  const deposit = reservation.deposit;
  const refund = reservation.refund;
  const office = reservation.office;

  return {
    reservationId: reservation._id || "",
    bookingReference: reservation.reservationCode || reservation._id || "-",
    vehicleName,
    vehicleImage: reservation.category?.image || reservation.vehicle?.images?.[0],
    pickupDateTime: reservationDateTime(reservation, "start"),
    returnDateTime: reservationDateTime(reservation, "end"),
    durationLabel: durationLabel(reservation),
    publicStatusLabel: RESERVATION_STATUS_LABELS[status],
    mainStatus: status,
    steps: buildSteps(reservation, status),
    nextAction: buildNextAction(reservation, status),
    deposit:
      deposit || reservation.totalPrice !== undefined
        ? {
            amount: deposit?.amount ?? reservation.totalPrice ?? 0,
            option: deposit?.option,
            status: deposit?.status ?? "not_paid",
            paidAt: deposit?.paidAt ? formatDateTime(deposit.paidAt) : undefined,
            dueAt: deposit?.dueAt ? formatDateTime(deposit.dueAt) : undefined,
            receiptUrl: deposit?.receiptUrl,
            failureReason: deposit?.failureReason,
          }
        : undefined,
    contract: {
      status: contractPanelStatus(contract),
      contractId: contract?._id,
      contractNumber: contract?.contractNumber,
      signedAt: contract?.docusign?.completedAt
        ? formatDateTime(contract.docusign.completedAt)
        : undefined,
    },
    collection: {
      location: [office?.name, office?.address].filter(Boolean).join(", ") || "-",
      collectionCode: reservation.collectionCode,
      readyAt: reservation.startDateDisplay
        ? `${reservation.startDateDisplay} ${reservation.pickupTime || ""}`.trim()
        : undefined,
    },
    refund:
      refund && (refund.status || refund.refundAmount !== undefined)
        ? {
            depositPaid: refund.depositPaid ?? deposit?.amount ?? 0,
            deductionsTotal: refund.deductionsTotal ?? 0,
            refundAmount: refund.refundAmount ?? 0,
            status: refund.status ?? "not_started",
            reference: refund.reference,
            expectedBy: refund.expectedBy,
          }
        : undefined,
  };
}

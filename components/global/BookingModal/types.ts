import { Van } from "../vanlist";
import type { PendingBookingDraft } from "@/utils/pendingBooking";

export type BookingModalProps = {
  visible: boolean;
  van: Van | null;
  onClose: () => void;
  prefilledData?: {
    office: string;
    category: string;
    pickupDate: string;
    returnDate: string;
    pickupTime?: string;
    returnTime?: string;
    driverAge?: string | number;
    calculatedPrice?: number;
    pickupExtensionFee?: number;
    returnExtensionFee?: number;
    startDateDisplay?: string;
    endDateDisplay?: string;
  };
  onReservationComplete?: () => void;
  onAuthRedirect?: () => void;
  resumeDraft?: PendingBookingDraft | null;
};

export type PickerField = "pickupDate" | "pickupTime" | "returnDate" | "returnTime" | null;

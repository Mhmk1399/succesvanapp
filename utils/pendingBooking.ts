import type { BookingModalProps } from "@/components/global/BookingModal/types";
import type { Van } from "@/components/global/vanlist";

export const PENDING_BOOKING_KEY = "pendingBookingDraft";

export type PendingBookingDraft = {
  version: 1;
  van: Van;
  prefilledData?: BookingModalProps["prefilledData"];
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  selectedOffice: string;
  driverAge: string;
  selectedGear: "manual" | "automatic";
  addonSelections: Record<string, { quantity: number; tierId?: string; selectedTierIndex?: number }>;
  message: string;
  name: string;
  email: string;
  phone: string;
  lastName: string;
  termsAccepted: boolean;
  discountCode: string;
};

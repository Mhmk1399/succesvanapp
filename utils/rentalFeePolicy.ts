import type { Reservation } from "@/types/type";
import { createLondonDateTime } from "@/utils/londonTime";

export const DEPOSIT_POLICY_PDF_URL =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/Deposit_Return_Success_Van_Hire-1+(1).pdf";

const CANCELLATION_PROTECTION_ADDON_ID = "6a9d4f1d93982013c5cc34fc";

export function hasCancellationProtection(reservation: Reservation): boolean {
  return Boolean(reservation.addOns?.some(({ addOn }) => {
    const id = typeof addOn === "string" ? addOn : addOn?._id;
    return id === CANCELLATION_PROTECTION_ADDON_ID;
  }));
}

export function getRentalFeeQuote(reservation: Reservation, now: number) {
  const match = reservation.startDateDisplay?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const pickupAt = match && reservation.pickupTime
    ? new Date(createLondonDateTime(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])), reservation.pickupTime))
    : new Date(reservation.startDate);
  const within48Hours = Number.isFinite(pickupAt.getTime()) && pickupAt.getTime() - now < 48 * 60 * 60 * 1000;
  const originalAmount = Number(reservation.deposit?.option === "full" && reservation.deposit.originalAmount !== undefined
    ? reservation.deposit.originalAmount : reservation.totalPrice) || 0;
  const configuredDiscount = Math.min(100, Math.max(0, Number(reservation.category?.deposit?.fullPayDiscountPercent) || 0));
  const discountPercent = within48Hours ? 0 : configuredDiscount;
  const discountAmount = Math.round(Math.max(0, originalAmount - Number(reservation.serviceCharge || 0)) * discountPercent) / 100;
  return {
    originalAmount,
    discountPercent,
    discountAmount,
    fullAmount: Math.round((originalAmount - discountAmount) * 100) / 100,
    secureAmount: Number(reservation.category?.deposit?.securePayPrice || 0),
    within48Hours,
    configuredDiscount,
  };
}

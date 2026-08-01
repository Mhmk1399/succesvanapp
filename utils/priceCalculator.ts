import { calculateBookingPrice } from "@/utils/bookingPrice";

interface PricingTier {
  minDays: number;
  maxDays: number;
  pricePerDay: number;
}

export function calculatePrice(
  startDate: Date,
  endDate: Date,
  pricingTiers: PricingTier[],
  extraHoursRate: number,
  sellOffer?: number
): number {
  return (
    calculateBookingPrice({
      startDate,
      endDate,
      pricingTiers,
      extraHoursRate,
      sellOffer,
    })?.totalPrice || 0
  );
}

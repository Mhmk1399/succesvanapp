import { AddOn } from "@/types/type";
import {
  calculateBillableDuration,
  getAddonPriceForDays,
  getMatchingAddonTierIndex,
} from "@/utils/bookingPrice";

export const calculateAddonPrice = (
  addon: AddOn,
  pickupDate: Date,
  returnDate: Date,
  pickupTime: string,
  returnTime: string,
  quantity: number = 1
): number => {
  if (!addon || !pickupDate || !returnDate || !pickupTime || !returnTime) return 0;

  const start = new Date(pickupDate);
  const end = new Date(returnDate);
  const [pH, pM] = pickupTime.split(":").map(Number);
  const [rH, rM] = returnTime.split(":").map(Number);
  start.setHours(pH, pM, 0, 0);
  end.setHours(rH, rM, 0, 0);

  const { totalDays } = calculateBillableDuration(start, end);
  const selectedTierIndex = getMatchingAddonTierIndex(addon, totalDays);
  const price = getAddonPriceForDays(addon, totalDays, quantity, selectedTierIndex);
  if (price > 0) return price;

  console.warn(`[addonCalculator] Addon "${addon.name}" has invalid pricing:`, {
    pricingType: addon.pricingType,
    flatPrice: addon.flatPrice,
    tieredPrice: addon.tieredPrice,
  });
  return 0;
};

export const getAddonDisplayPrice = (
  addon: AddOn,
  pickupDate?: Date,
  returnDate?: Date,
  pickupTime?: string,
  returnTime?: string
): string => {
  if (!addon) return "N/A";

  if (addon.pricingType === "flat") {
    if (!addon.flatPrice || addon.flatPrice.amount === undefined || addon.flatPrice.amount === null) {
      return "N/A";
    }
    const amount = addon.flatPrice.amount;
    if (addon.flatPrice.isPerDay) {
      if (pickupDate && returnDate && pickupTime && returnTime) {
        const start = new Date(pickupDate);
        const end = new Date(returnDate);
        const [pH, pM] = pickupTime.split(":").map(Number);
        const [rH, rM] = returnTime.split(":").map(Number);
        start.setHours(pH, pM, 0, 0);
        end.setHours(rH, rM, 0, 0);
        const { totalDays } = calculateBillableDuration(start, end);
        return `£${amount}/day × ${totalDays}d`;
      }
      return `£${amount}/day`;
    } else {
      return `£${amount}`;
    }
  } else if (addon.pricingType === "tiered" && addon.tieredPrice?.tiers) {
    if (!pickupDate || !returnDate || !pickupTime || !returnTime) {
      const minPrice = Math.min(...addon.tieredPrice.tiers.map((t) => t.price));
      return `From £${minPrice}`;
    }

    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const [pH, pM] = pickupTime.split(":").map(Number);
    const [rH, rM] = returnTime.split(":").map(Number);
    start.setHours(pH, pM, 0, 0);
    end.setHours(rH, rM, 0, 0);

    const { totalDays } = calculateBillableDuration(start, end);

    const tier = addon.tieredPrice.tiers.find(
      (t) => totalDays >= t.minDays && totalDays <= t.maxDays
    );

    if (tier) {
      if (addon.tieredPrice.isPerDay) {
        return `£${tier.price}/day × ${totalDays}d`;
      } else {
        return `£${tier.price} (${tier.minDays}-${tier.maxDays}d)`;
      }
    }

    return "N/A";
  }

  return "N/A";
};

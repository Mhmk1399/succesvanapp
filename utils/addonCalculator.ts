import { AddOn } from "@/types/type";

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

  const diffMs = end.getTime() - start.getTime();
  const totalHours = diffMs / (1000 * 60 * 60);
  const totalDays = Math.max(1, Math.ceil(totalHours / 24));

  if (addon.pricingType === "flat" && addon.flatPrice?.amount !== undefined) {
    const amount = addon.flatPrice.amount;
    const price = addon.flatPrice.isPerDay ? amount * totalDays * quantity : amount * quantity;
    return price;
  } else if (addon.pricingType === "tiered" && addon.tieredPrice?.tiers) {
    const tier = addon.tieredPrice.tiers.find(
      (t) => totalDays >= t.minDays && totalDays <= t.maxDays
    );
    
    if (!tier) return 0;

    const price = addon.tieredPrice.isPerDay ? tier.price * totalDays * quantity : tier.price * quantity;
    return price;
  }

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
        const diffMs = end.getTime() - start.getTime();
        const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
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

    const diffMs = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

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

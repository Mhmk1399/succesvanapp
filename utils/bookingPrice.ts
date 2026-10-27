import type { AddOn, PricingTier } from "@/types/type";

export const DEFAULT_SERVICE_CHARGE = 0.99;

export type AddOnSelection = {
  quantity: number;
  selectedTierIndex?: number;
  tierId?: string;
};

export type AddOnLineItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  selectedTierIndex?: number;
};

export type BookingPriceResult = {
  totalHours: number;
  actualDays: number;
  actualExtraHours: number;
  totalDays: number;
  extraHours: number;
  pricePerDay: number;
  originalPricePerDay: number;
  daysPrice: number;
  extraHoursRate: number;
  extraHoursPrice: number;
  pickupExtensionPrice: number;
  returnExtensionPrice: number;
  gearExtraCostPerDay: number;
  gearExtraPrice: number;
  addOnsPrice: number;
  serviceCharge: number;
  discountAmount: number;
  subtotal: number;
  totalPrice: number;
  totalSavings: number;
};

export const calculateBillableDuration = (startDate: Date, endDate: Date) => {
  const diffTime = endDate.getTime() - startDate.getTime();
  const totalMinutes = diffTime / (1000 * 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const billableHours = remainingMinutes > 15 ? totalHours + 1 : totalHours;

  if (billableHours <= 0) {
    return {
      totalHours: 0,
      actualDays: 0,
      actualExtraHours: 0,
      totalDays: 0,
      extraHours: 0,
    };
  }

  const actualDays = Math.floor(billableHours / 24);
  const actualExtraHours = billableHours % 24;
  let totalDays = actualDays;
  let extraHours = actualExtraHours;

  if (billableHours < 24) {
    totalDays = 1;
    extraHours = 0;
  } else if (extraHours > 6) {
    totalDays += 1;
    extraHours = 0;
  }

  return {
    totalHours: billableHours,
    actualDays,
    actualExtraHours,
    totalDays,
    extraHours,
  };
};

const findPricingTier = (pricingTiers: PricingTier[], totalDays: number) =>
  pricingTiers.find(
    (tier) => totalDays >= tier.minDays && totalDays <= tier.maxDays,
  ) || pricingTiers[pricingTiers.length - 1];

export const getAddonPriceForDays = (
  addon: AddOn,
  rentalDays: number,
  quantity = 1,
  selectedTierIndex?: number,
) => {
  if (!addon || rentalDays <= 0 || quantity <= 0) return 0;

  if (addon.pricingType === "flat") {
    const amount = addon.flatPrice?.amount || 0;
    return (addon.flatPrice?.isPerDay ? amount * rentalDays : amount) * quantity;
  }

  const tier =
    selectedTierIndex !== undefined
      ? addon.tieredPrice?.tiers?.[selectedTierIndex]
      : addon.tieredPrice?.tiers?.find(
          (item) => rentalDays >= item.minDays && rentalDays <= item.maxDays,
        );

  if (!tier) return 0;
  return (
    (addon.tieredPrice?.isPerDay ? tier.price * rentalDays : tier.price) *
    quantity
  );
};

export const getMatchingAddonTierIndex = (addon: AddOn, rentalDays: number) => {
  if (addon.pricingType !== "tiered") return undefined;
  const index = addon.tieredPrice?.tiers?.findIndex(
    (tier) => rentalDays >= tier.minDays && rentalDays <= tier.maxDays,
  );
  return index !== undefined && index >= 0 ? index : undefined;
};

export const getAddonLineItems = (
  addOns: AddOn[],
  selections: Record<string, AddOnSelection>,
  rentalDays: number,
) =>
  Object.entries(selections)
    .map<AddOnLineItem | null>(([id, selection]) => {
      if (!selection.quantity) return null;
      const addon = addOns.find((item) => item._id === id);
      if (!addon) return null;
      const selectedTierIndex =
        selection.selectedTierIndex ?? getMatchingAddonTierIndex(addon, rentalDays);
      const quantity = selection.quantity > 0 ? 1 : 0;
      return {
        id,
        name: addon.name,
        quantity,
        ...(selectedTierIndex !== undefined ? { selectedTierIndex } : {}),
        price: getAddonPriceForDays(
          addon,
          rentalDays,
          quantity,
          selectedTierIndex,
        ),
      };
    })
    .filter((item): item is AddOnLineItem => Boolean(item));

export const calculateBookingPrice = ({
  startDate,
  endDate,
  pricingTiers,
  extraHoursRate = 0,
  pickupExtensionPrice = 0,
  returnExtensionPrice = 0,
  gearExtraCostPerDay = 0,
  addOnsPrice = 0,
  serviceCharge = DEFAULT_SERVICE_CHARGE,
  sellOffer = 0,
  discountPercentage = 0,
}: {
  startDate: Date | null;
  endDate: Date | null;
  pricingTiers: PricingTier[];
  extraHoursRate?: number;
  pickupExtensionPrice?: number;
  returnExtensionPrice?: number;
  gearExtraCostPerDay?: number;
  addOnsPrice?: number;
  serviceCharge?: number;
  sellOffer?: number;
  discountPercentage?: number;
}): BookingPriceResult | null => {
  if (!startDate || !endDate || !pricingTiers?.length) return null;
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  const duration = calculateBillableDuration(startDate, endDate);
  if (duration.totalHours <= 0) return null;

  const tier = findPricingTier(pricingTiers, duration.totalDays);
  const originalPricePerDay = tier?.pricePerDay || 0;
  const pricePerDay =
    sellOffer > 0
      ? originalPricePerDay * (1 - sellOffer / 100)
      : originalPricePerDay;
  const totalSavings =
    sellOffer > 0 ? (originalPricePerDay - pricePerDay) * duration.totalDays : 0;
  const daysPrice = duration.totalDays * pricePerDay;
  const extraHoursPrice = duration.extraHours * extraHoursRate;
  const gearExtraPrice = duration.totalDays * gearExtraCostPerDay;

  const subtotalRaw =
    daysPrice +
    extraHoursPrice +
    pickupExtensionPrice +
    returnExtensionPrice +
    gearExtraPrice +
    addOnsPrice +
    serviceCharge;
  const subtotal = Math.round((subtotalRaw + Number.EPSILON) * 100) / 100;
  const discountAmount = discountPercentage
    ? (subtotal * discountPercentage) / 100
    : 0;

  return {
    ...duration,
    pricePerDay,
    originalPricePerDay,
    daysPrice,
    extraHoursRate,
    extraHoursPrice,
    pickupExtensionPrice,
    returnExtensionPrice,
    gearExtraCostPerDay,
    gearExtraPrice,
    addOnsPrice,
    serviceCharge,
    subtotal,
    discountAmount,
    totalPrice: parseFloat((subtotal - discountAmount).toFixed(2)),
    totalSavings,
  };
};

export const isAddonAvailableForCategory = (
  addon: AddOn,
  categoryId?: string | null,
) => {
  const rawCategory = addon.categoryId;
  const addonCategoryId =
    rawCategory && typeof rawCategory === "object"
      ? rawCategory._id
      : rawCategory;

  if (!addonCategoryId) return true;
  return String(addonCategoryId) === String(categoryId || "");
};

export const isAddonAvailableForDays = (addon: AddOn, rentalDays: number) => {
  if (addon.pricingType === "flat") {
    return (
      addon.flatPrice?.amount !== undefined && addon.flatPrice?.amount !== null
    );
  }

  return Boolean(
    addon.tieredPrice?.tiers?.some(
      (tier) => rentalDays >= tier.minDays && rentalDays <= tier.maxDays,
    ),
  );
};

export const getMinDriverAge = (typeName?: string) =>
  typeName?.toLowerCase().includes("minibus") ? 25 : 23;

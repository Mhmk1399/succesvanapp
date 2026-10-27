import type { Reservation } from "@/types/type";
import {
  calculateBillableDuration,
  DEFAULT_SERVICE_CHARGE,
  getAddonPriceForDays,
  getMatchingAddonTierIndex,
} from "./bookingPrice";

type PriceLine = { label: string; amount: number };

const amount = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function getReservationServiceCharge(reservation: Pick<Reservation, "serviceCharge">) {
  const value = reservation.serviceCharge;
  return value === undefined || value === null || !Number.isFinite(Number(value)) || Number(value) < 0
    ? DEFAULT_SERVICE_CHARGE
    : Number(value);
}

export function getReservationPriceBreakdown(reservation: Reservation) {
  const total = roundMoney(amount(reservation.totalPrice));
  const serviceCharge = getReservationServiceCharge(reservation);
  const start = new Date(reservation.startDate);
  const end = new Date(reservation.endDate);
  const validDates = Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end > start;
  const duration = validDates ? calculateBillableDuration(start, end) : null;
  const days = duration?.totalDays || 0;
  let addOnsAvailable = validDates;
  const addOns: PriceLine[] = [];

  for (const selection of reservation.addOns || []) {
    const addon = selection.addOn;
    if (!addon || typeof addon !== "object") {
      addOnsAvailable = false;
      continue;
    }
    const selectedTierIndex = selection.selectedTierIndex ?? getMatchingAddonTierIndex(addon, days);
    const hasPrice = addon.pricingType === "flat"
      ? addon.flatPrice?.amount !== undefined && addon.flatPrice?.amount !== null
      : selectedTierIndex !== undefined && Boolean(addon.tieredPrice?.tiers?.[selectedTierIndex]);
    if (!hasPrice) {
      addOnsAvailable = false;
      continue;
    }
    const quantity = Math.max(1, Number(selection.quantity) || 1);
    addOns.push({
      label: `${addon.name || "Add-on"}${quantity > 1 ? ` x${quantity}` : ""}`,
      amount: roundMoney(amount(getAddonPriceForDays(addon, days, quantity, selectedTierIndex))),
    });
  }

  const pickupExtension = amount(reservation.pickupExtensionPrice);
  const returnExtension = amount(reservation.returnExtensionPrice);
  const adminDiscount = amount(reservation.adminDiscountAmount);
  const fullPaymentDiscount = reservation.deposit?.option === "full"
    ? amount(reservation.deposit.discountAmount)
    : 0;
  const addOnsTotal = addOns.reduce((sum, item) => sum + item.amount, 0);
  const rental = roundMoney(total + adminDiscount + fullPaymentDiscount - addOnsTotal - pickupExtension - returnExtension - serviceCharge);
  const detailed = addOnsAvailable && !reservation.isManualPrice && !reservation.perInvoice && rental >= 0;
  const fallbackRental = roundMoney(total - serviceCharge);

  return {
    total,
    duration,
    serviceCharge,
    perInvoice: Boolean(reservation.perInvoice),
    manualPrice: Boolean(reservation.isManualPrice),
    rental: detailed ? rental : fallbackRental >= 0 ? fallbackRental : null,
    rentalLabel: detailed && !reservation.discountCode && !reservation.rentalExtensions?.length
      ? "Rental"
      : "Rental & other charges",
    addOns: detailed ? addOns : [],
    pickupExtension: detailed ? pickupExtension : 0,
    returnExtension: detailed ? returnExtension : 0,
    adminDiscount: detailed ? adminDiscount : 0,
    fullPaymentDiscount: detailed ? fullPaymentDiscount : 0,
    addOnPricesEstimated: detailed && addOns.length > 0,
  };
}

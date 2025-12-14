interface PricingTier {
  minDays: number;
  maxDays: number;
  pricePerDay: number;
}

export function calculatePrice(
  startDate: Date,
  endDate: Date,
  pricingTiers: PricingTier[],
  extraHoursRate: number = 0
): number {
  if (!pricingTiers || pricingTiers.length === 0) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  const diffTime = end.getTime() - start.getTime();
  const totalMinutes = diffTime / (1000 * 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const billableHours = remainingMinutes > 15 ? totalHours + 1 : totalHours;

  if (billableHours <= 0) return 0;

  let totalDays = Math.floor(billableHours / 24);
  const extraHours = billableHours % 24;

  if (billableHours < 24) {
    totalDays = 1;
  } else if (extraHours > 6) {
    totalDays += 1;
  }

  const tier =
    pricingTiers.find(
      (t) => totalDays >= t.minDays && totalDays <= t.maxDays
    ) || pricingTiers[pricingTiers.length - 1];

  const pricePerDay = tier.pricePerDay;
  const daysPrice = totalDays * pricePerDay;
  const extraHoursPrice =
    billableHours < 24 || extraHours > 6 ? 0 : extraHours * extraHoursRate;

  return daysPrice + extraHoursPrice;
}

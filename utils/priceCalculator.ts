interface PricingTier {
  minHours: number;
  maxHours: number;
  pricePerHour: number;
}

export function calculatePrice(
  startDate: Date,
  endDate: Date,
  pricingTiers: PricingTier[]
): number {
  if (!pricingTiers || pricingTiers.length === 0) return 0;

  const diffTime = endDate.getTime() - startDate.getTime();
  const totalHours = Math.ceil(diffTime / (1000 * 60 * 60));

  if (totalHours <= 0) return 0;

  const tier =
    pricingTiers.find(
      (t) => totalHours >= t.minHours && totalHours <= t.maxHours
    ) || pricingTiers[0];

  const pricePerHour = tier.pricePerHour;

  let billableDays = 0;
  let billableHours = 0;

  if (totalHours < 24) {
    billableDays = 1;
  } else {
    const fullDays = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    if (remainingHours >= 6) {
      billableDays = fullDays + 1;
    } else if (remainingHours > 0) {
      billableDays = fullDays;
      billableHours = remainingHours;
    } else {
      billableDays = fullDays;
    }
  }

  return (billableDays * 24 + billableHours) * pricePerHour;
}

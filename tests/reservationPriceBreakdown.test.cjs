const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(result.outputText, filename);
};

const { getReservationPriceBreakdown } = require("../utils/reservationPriceBreakdown.ts");
const { calculateBookingPrice } = require("../utils/bookingPrice.ts");

const reservation = {
  startDate: "2026-10-28T11:45:00.000Z",
  endDate: "2026-10-30T11:45:00.000Z",
  totalPrice: 156.99,
  status: "confirmed",
};

test("preserves the total and separates the default service charge", () => {
  const price = getReservationPriceBreakdown(reservation);
  assert.equal(price.rental, 156);
  assert.equal(price.serviceCharge, 0.99);
  assert.equal(price.total, 156.99);
});

test("uses the stored charge, including an explicit zero", () => {
  const zero = getReservationPriceBreakdown({ ...reservation, serviceCharge: 0 });
  assert.equal(zero.serviceCharge, 0);
  assert.equal(zero.rental, 156.99);
  const other = getReservationPriceBreakdown({ ...reservation, totalPrice: 158.25, serviceCharge: 2.25 });
  assert.equal(other.rental, 156);
  assert.equal(other.serviceCharge, 2.25);
});

test("calculates per-day add-ons and shows known discounts without double counting", () => {
  const price = getReservationPriceBreakdown({
    ...reservation,
    totalPrice: 155.49,
    addOns: [{ quantity: 1, addOn: { _id: "a", name: "Cover", pricingType: "flat", flatPrice: { amount: 4.25, isPerDay: true } } }],
    adminDiscountAmount: 10,
  });
  assert.equal(price.rental, 156);
  assert.equal(price.addOns[0].amount, 8.5);
  assert.equal(price.adminDiscount, 10);
  assert.equal(price.rental + price.addOns[0].amount + price.serviceCharge - price.adminDiscount, price.total);
});

test("does not fabricate individual prices when add-on data is missing", () => {
  const price = getReservationPriceBreakdown({ ...reservation, addOns: [{ quantity: 1, addOn: "id-only" }] });
  assert.equal(price.rentalLabel, "Rental & other charges");
  assert.deepEqual(price.addOns, []);
  assert.equal(price.rental, 156);
});

test("separates tiered add-ons and extensions from the stored total", () => {
  const price = getReservationPriceBreakdown({
    ...reservation,
    totalPrice: 180.49,
    pickupExtensionPrice: 10,
    addOns: [{
      quantity: 1,
      selectedTierIndex: 1,
      addOn: {
        _id: "a", name: "Cover", pricingType: "tiered",
        tieredPrice: { isPerDay: false, tiers: [{ minDays: 1, maxDays: 1, price: 4 }, { minDays: 2, maxDays: 5, price: 13.5 }] },
      },
    }],
  });
  assert.equal(price.rental, 156);
  assert.equal(price.addOns[0].amount, 13.5);
  assert.equal(price.pickupExtension, 10);
  assert.equal(price.total, 180.49);
});

test("does not invent a negative rental when the saved total is smaller than the fee", () => {
  const price = getReservationPriceBreakdown({ ...reservation, totalPrice: 0.5 });
  assert.equal(price.rental, null);
  assert.equal(price.total, 0.5);
});

test("marks manual and per-invoice prices for the display to handle", () => {
  assert.equal(getReservationPriceBreakdown({ ...reservation, isManualPrice: true }).manualPrice, true);
  assert.equal(getReservationPriceBreakdown({ ...reservation, perInvoice: true }).perInvoice, true);
});

test("booking calculation includes one service charge", () => {
  const price = calculateBookingPrice({
    startDate: new Date(reservation.startDate),
    endDate: new Date(reservation.endDate),
    pricingTiers: [{ minDays: 1, maxDays: 10, pricePerDay: 78 }],
  });
  assert.equal(price.serviceCharge, 0.99);
  assert.equal(price.totalPrice, 156.99);
});

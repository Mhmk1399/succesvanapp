const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");

require.extensions[".ts"] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(result.outputText, filename);
};
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === "@/utils/londonTime") return { createLondonDateTime: (date, time) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${time}:00Z` };
  return originalLoad.call(this, request, ...args);
};
const { getRentalFeeQuote, hasCancellationProtection } = require("../utils/rentalFeePolicy.ts");
Module._load = originalLoad;

const now = Date.parse("2026-10-01T10:00:00Z");
const reservation = {
  startDate: "2026-10-04T10:00:00Z", totalPrice: 156.99, serviceCharge: 0.99,
  category: { deposit: { fullPayDiscountPercent: 10, securePayPrice: 50 } },
};

test("full payment discount excludes the service charge", () => {
  const quote = getRentalFeeQuote(reservation, now);
  assert.equal(quote.discountAmount, 15.6);
  assert.equal(quote.fullAmount, 141.39);
  assert.equal(quote.secureAmount, 50);
});

test("discount is available at exactly 48 hours but not inside 48 hours", () => {
  assert.equal(getRentalFeeQuote({ ...reservation, startDate: "2026-10-03T10:00:00Z" }, now).discountPercent, 10);
  assert.equal(getRentalFeeQuote({ ...reservation, startDate: "2026-10-03T09:59:59Z" }, now).discountPercent, 0);
});

test("uses the original amount after a failed full-payment attempt", () => {
  const quote = getRentalFeeQuote({ ...reservation, totalPrice: 141.39, deposit: { option: "full", originalAmount: 156.99, discountAmount: 15.6 } }, now);
  assert.equal(quote.originalAmount, 156.99);
  assert.equal(quote.fullAmount, 141.39);
});

test("uses the displayed pickup day and time when available", () => {
  const quote = getRentalFeeQuote({ ...reservation, startDateDisplay: "2026-10-02", pickupTime: "10:00" }, now);
  assert.equal(quote.within48Hours, true);
});

test("recognises populated and unpopulated cancellation protection add-ons", () => {
  const id = "6a9d4f1d93982013c5cc34fc";
  assert.equal(hasCancellationProtection({ ...reservation, addOns: [{ addOn: { _id: id } }] }), true);
  assert.equal(hasCancellationProtection({ ...reservation, addOns: [{ addOn: id }] }), true);
  assert.equal(hasCancellationProtection(reservation), false);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(result.outputText, filename);
};
const { isActiveReservationStatus } = require("../constants/reservationStatus.ts");

test("active bookings include in-progress states and their aliases", () => {
  for (const status of ["pending", "contract_pending", "delivered", "refund_processing", "pending_review", "rental_active"]) {
    assert.equal(isActiveReservationStatus(status), true, status);
  }
});

test("completed, cancelled, expired and unknown bookings are not active", () => {
  for (const status of ["completed", "canceled", "cancelled", "expired", "unknown", null]) {
    assert.equal(isActiveReservationStatus(status), false, String(status));
  }
});

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(result.outputText, filename);
};
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === "@/constants/reservationStatus") return require("../constants/reservationStatus.ts");
  if (request === "@/utils/londonTime") return { formatDateTimeInLondon: (value) => String(value || "-") };
  return originalLoad.call(this, request, ...args);
};
const { buildReservationJourney } = require("../utils/reservationJourney.ts");
Module._load = originalLoad;

const reservation = {
  _id: "booking", status: "contract_pending", startDate: "2026-11-01T10:00:00Z",
  endDate: "2026-11-02T10:00:00Z", totalPrice: 100,
  user: { licenceAttached: { front: "front", back: "back" }, licenceDetails: { isFrontSide: true } },
  deposit: { status: "paid", option: "full", amount: 100 },
};

test("a sent agreement exposes the signing action during contract_pending", () => {
  for (const status of ["sent", "delivered", "viewed", "signing"]) {
    const journey = buildReservationJourney(reservation, { _id: "contract", contractNumber: "C-1", status });
    assert.equal(journey.contract.status, "awaiting_customer_signature");
    assert.equal(journey.nextAction.type, "sign_contract");
    assert.equal(journey.nextAction.href, "#contract");
  }
});

test("payment-stage guard stays in DepositSection and cannot hide ContractSection", () => {
  const text = fs.readFileSync(require.resolve("../components/dashboard/ReservationJourneyModal.tsx"), "utf8");
  const source = ts.createSourceFile("ReservationJourneyModal.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const findBody = (name) => source.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name)?.body?.getText(source) || "";
  const deposit = findBody("DepositSection");
  const contract = findBody("ContractSection");
  assert.match(deposit, /\["confirmed",\s*"deposit_pending"\]\.includes\(reservation\.status\)/);
  assert.doesNotMatch(contract, /\["confirmed",\s*"deposit_pending"\]\.includes\(reservation\.status\)/);
  assert.match(contract, /awaiting_customer_signature/);
  assert.match(contract, /onPress=\{onSignContract\}/);
});

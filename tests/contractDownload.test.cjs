const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");

require.extensions[".ts"] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

let token = "test-token";
let downloadFails = false;
let shared = null;
let sharingAvailable = true;
let opened = null;
let written = null;
let requestHeaders = null;
let responseFactory = () => new Response(new Uint8Array([37, 80, 68, 70]), { headers: { "content-type": "application/pdf" } });
class MockFile {
  constructor(_dir, name) { this.uri = `file:///${name}`; this.contentUri = `content://${name}`; }
  static async downloadFileAsync(_url, destination, options) {
    requestHeaders = options.headers;
    if (downloadFails) throw new Error("native download failed");
    return destination;
  }
  write(bytes) { written = bytes; }
}
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === "@react-native-async-storage/async-storage") return { __esModule: true, default: { getItem: async () => token } };
  if (request === "expo-file-system") return { File: MockFile, Paths: { document: "file:///documents" } };
  if (request === "expo-sharing") return { isAvailableAsync: async () => sharingAvailable, shareAsync: async (uri) => { shared = uri; } };
  if (request === "expo-linking") return { openURL: async (uri) => { opened = uri; } };
  if (request === "expo-image-picker") return {};
  if (request === "react-native") return { Platform: { OS: "android" } };
  if (request === "./apiClient") return { safeFetch: async (_url, options) => { requestHeaders = options.headers; return responseFactory(); }, normalizeUrl: (url) => url, buildUrl: (url) => url };
  if (request === "@/utils/s3Upload") return { uploadToS3: async () => "" };
  return originalLoad.call(this, request, ...args);
};
process.env.EXPO_PUBLIC_API_BASE_URL = "https://example.test/api";
const { customerJourneyService } = require("../services/customerJourneyService.ts");
Module._load = originalLoad;
const contract = { _id: "123", contractNumber: "C-123" };

test("downloads and shares a customer agreement on native", async () => {
  token = "test-token"; downloadFails = false; sharingAvailable = true; shared = null;
  await customerJourneyService.downloadContractDocument(contract, "signed");
  assert.match(shared, /C-123-signed-agreement\.pdf$/);
  assert.equal(requestHeaders.Authorization, "Bearer test-token");
});

test("opens the Android content URI when sharing is unavailable", async () => {
  token = "test-token"; downloadFails = false; sharingAvailable = false; opened = null;
  await customerJourneyService.downloadContractDocument(contract, "signed");
  assert.match(opened, /^content:\/\//);
  sharingAvailable = true;
});

test("falls back to authenticated fetch when native download fails", async () => {
  token = "test-token"; downloadFails = true; written = null; shared = null;
  responseFactory = () => new Response(new Uint8Array([37, 80, 68, 70]), { headers: { "content-type": "application/pdf" } });
  await customerJourneyService.downloadContractDocument(contract, "source");
  assert.deepEqual(Array.from(written), [37, 80, 68, 70]);
  assert.equal(requestHeaders.Authorization, "Bearer test-token");
  assert.match(shared, /unsigned-agreement\.pdf$/);
});

test("shows the server error instead of a generic native download failure", async () => {
  token = "test-token"; downloadFails = true;
  responseFactory = () => new Response(JSON.stringify({ error: "Document is not available yet" }), { status: 404 });
  await assert.rejects(customerJourneyService.downloadContractDocument(contract, "signed"), /Document is not available yet/);
});

test("requires authentication and rejects non-PDF responses", async () => {
  token = null;
  await assert.rejects(customerJourneyService.downloadContractDocument(contract, "signed"), /sign in again/);
  token = "test-token"; downloadFails = true;
  responseFactory = () => new Response("not a pdf", { headers: { "content-type": "text/html" } });
  await assert.rejects(customerJourneyService.downloadContractDocument(contract, "signed"), /did not return a PDF/);
});

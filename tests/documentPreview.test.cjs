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
const { isPdfDocument } = require("../utils/documentPreview.ts");

test("recognizes PDFs using their filename or MIME type", () => {
  assert.equal(isPdfDocument("https://example.com/receipt.PDF?token=value"), true);
  assert.equal(isPdfDocument("file:///temporary/receipt", "application/pdf; charset=binary"), true);
});

test("routes image and extensionless image URLs to the image viewer", () => {
  assert.equal(isPdfDocument("https://example.com/image.webp?name=file.pdf"), false);
  assert.equal(isPdfDocument("file:///temporary/image", "image/jpeg"), false);
  assert.equal(isPdfDocument("https://example.com/private/image?id=42"), false);
});

export function isPdfDocument(uri: string, mimeType?: string): boolean {
  return mimeType?.split(";")[0].trim().toLowerCase() === "application/pdf" ||
    /^data:application\/pdf(?:;|,)/i.test(uri) ||
    /\.pdf$/i.test(uri.split(/[?#]/, 1)[0]);
}

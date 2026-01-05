import { Platform } from "react-native";

export function normalizeUrl(url: string) {
  if (Platform.OS === "android") {
    return url.replace("localhost", "10.0.2.2");
  }
  return url;
}

export function buildUrl(base: string, params?: string | Record<string, any>) {
  if (!params) return base;
  if (typeof params === "string") {
    // allow passing `?active=true` or `active=true`
    if (params.startsWith("?")) return `${base}${params}`;
    return `${base}?${params}`;
  }
  const search = Object.keys(params)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");
  return search ? `${base}?${search}` : base;
}

export async function safeFetch(url: string, opts?: RequestInit) {
  const finalUrl = normalizeUrl(url);
  try {
    const res = await fetch(finalUrl, opts);
    return res;
  } catch (err: any) {
    console.error(`Fetch error for ${finalUrl} (Platform=${Platform.OS}):`, err.message || err);
    throw err;
  }
}

import { buildUrl, safeFetch } from "./apiClient";

const API_URL = (process.env.EXPO_PUBLIC_TYPES_API || "").trim();

function ensureApiUrl() {
  if (!API_URL) throw new Error("EXPO_PUBLIC_TYPES_API is not configured.");
}

export const typeService = {
  async getAll(params?: string | Record<string, any>) {
    ensureApiUrl();
    const url = buildUrl(API_URL, params as any);
    console.log(`[typeService] fetching types from URL: ${url}`);
    const response = await safeFetch(url);
    let data;
    try {
      data = await response.json();
    } catch (err) {
      console.log(`[typeService] failed to parse JSON from ${url}:`, err);
      throw err;
    }
    console.log(`[typeService] response success=${data?.success} items=${Array.isArray(data?.data)? data.data.length : 'unknown'}`);
    return data.data;
  },
};

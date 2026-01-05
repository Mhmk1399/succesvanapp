import { buildUrl, safeFetch } from "./apiClient";

const API_URL = (process.env.EXPO_PUBLIC_OFFICES_API || "").trim();

function ensureApiUrl() {
  if (!API_URL) throw new Error("EXPO_PUBLIC_OFFICES_API is not configured.");
}

export const officeService = {
  async getAll(params?: string | Record<string, any>) {
    ensureApiUrl();
    const url = buildUrl(API_URL, params as any);
    const response = await safeFetch(url);
    return response.json();
  },

  async getById(id: string) {
    ensureApiUrl();
    const response = await safeFetch(`${API_URL}/${id}`);
    return response.json();
  },
};

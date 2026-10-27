import { Platform } from "react-native";
import { toast } from "@/components/global/AppToast";

type ApiToastOptions = {
  successMessage?: string;
  errorMessage?: string;
  successTitle?: string;
  errorTitle?: string;
  silent?: boolean;
};

type ApiRequestInit = RequestInit & {
  toast?: ApiToastOptions;
};

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
  return search ? `${base}${base.includes("?") ? "&" : "?"}${search}` : base;
}

export async function safeFetch(url: string, opts?: ApiRequestInit) {
  const finalUrl = normalizeUrl(url);
  const { toast: toastOptions, ...fetchOptions } = opts || {};
  const method = String(fetchOptions.method || "GET").toUpperCase();
  const shouldToast =
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    !toastOptions?.silent;

  try {
    const res = await fetch(finalUrl, fetchOptions);

    if (shouldToast) {
      showApiToast(res, method, toastOptions);
    }

    return res;
  } catch (err: any) {
    console.log(`Fetch error for ${finalUrl} (Platform=${Platform.OS}):`, err.message || err);

    if (shouldToast) {
      toast.error(
        toastOptions?.errorMessage || err?.message || "Please check your connection and try again.",
        toastOptions?.errorTitle || "Network error",
      );
    }

    throw err;
  }
}

async function showApiToast(
  response: Response,
  method: string,
  toastOptions?: ApiToastOptions,
) {
  try {
    const clone = response.clone();
    const text = await clone.text();
    const data = text ? JSON.parse(text) : null;
    const apiMessage =
      data?.message ||
      data?.error ||
      data?.data?.message ||
      data?.data?.error;

    if (!response.ok || data?.success === false) {
      toast.error(
        toastOptions?.errorMessage ||
        apiMessage ||
        `The ${method.toLowerCase()} request could not be completed.`,
        toastOptions?.errorTitle || "Request failed",
      );
      return;
    }

    toast.success(
      toastOptions?.successMessage || apiMessage || getDefaultSuccessMessage(method),
      toastOptions?.successTitle || "Updated",
    );
  } catch {
    if (!response.ok) {
      toast.error(
        toastOptions?.errorMessage || `Server returned ${response.status}.`,
        toastOptions?.errorTitle || "Request failed",
      );
      return;
    }

    toast.success(
      toastOptions?.successMessage || getDefaultSuccessMessage(method),
      toastOptions?.successTitle || "Updated",
    );
  }
}

function getDefaultSuccessMessage(method: string) {
  switch (method) {
    case "POST":
      return "Saved successfully.";
    case "PUT":
    case "PATCH":
      return "Changes saved.";
    case "DELETE":
      return "Deleted successfully.";
    default:
      return "Done.";
  }
}

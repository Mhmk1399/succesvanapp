import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { buildUrl, normalizeUrl, safeFetch } from "./apiClient";
import { uploadToS3 } from "@/utils/s3Upload";
import type { ContractDocumentKind, SafeContractSummary } from "@/types/contract";
import type { Reservation } from "@/types/type";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "").trim();
const RESERVATIONS_API = (process.env.EXPO_PUBLIC_RESERVATIONS_API || "").trim();
const USERS_API = (process.env.EXPO_PUBLIC_USERS_API || "").trim();

export type LicenceDetailsReview = {
  isFrontSide?: boolean;
  sourceSide?: "front" | "back" | "unknown";
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  postcode?: string | null;
  licenseNumber?: string | null;
  licenceNumber?: string | null;
  issueDate?: string | null;
  expirationDate?: string | null;
  expiryDate?: string | null;
  issuingCountry?: string | null;
  issuingAuthority?: string | null;
  licenceCategories?: string[];
};

type LicenceAttached = {
  front?: string;
  back?: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function apiBase(path: string) {
  if (!API_BASE_URL) throw new Error("API base URL is not configured");
  return `${API_BASE_URL}${path}`;
}

function usersUrl(userId: string) {
  if (USERS_API) return `${USERS_API}/${userId}`;
  return apiBase(`/users/${userId}`);
}

async function readJson(response: Response) {
  const data = await response.json();
  if (!data?.success) throw new Error(data?.error || "Request failed");
  return data;
}

async function readDocumentError(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return `Download failed with status ${response.status}`;
  try {
    const data = JSON.parse(text);
    return data?.error || data?.message || `Download failed with status ${response.status}`;
  } catch {
    return text;
  }
}

function sanitizeFileName(value: string) {
  return value.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
}

function contractDocumentFileName(
  contract: Pick<SafeContractSummary, "_id" | "contractNumber">,
  kind: ContractDocumentKind,
) {
  const suffix =
    kind === "source"
      ? "unsigned-agreement"
      : kind === "certificate"
        ? "certificate"
        : "signed-agreement";
  return `${sanitizeFileName(contract.contractNumber || contract._id)}-${suffix}.pdf`;
}

function profileFieldsFromLicence(details: LicenceDetailsReview) {
  return {
    ...(details.address?.trim() ? { address: details.address.trim() } : {}),
    ...(details.postcode?.trim()
      ? { postalCode: details.postcode.trim() }
      : {}),
  };
}

async function imageAssetToBase64(asset: ImagePicker.ImagePickerAsset) {
  if (asset.base64) return asset.base64;
  if (!asset.uri) throw new Error("Licence image is missing");

  if (Platform.OS === "web") {
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read licence image"));
      reader.onload = () => {
        const value = String(reader.result || "");
        resolve(value.includes(",") ? value.split(",")[1] : value);
      };
      reader.readAsDataURL(blob);
    });
  }

  return new FileSystem.File(asset.uri).base64();
}

export const customerJourneyService = {
  async getCancellationPreview(reservationId: string) {
    const response = await safeFetch(apiBase(`/customer/reservations/${reservationId}/cancellation-request`), { headers: await authHeaders() });
    return (await readJson(response)).data as {
      eligible: boolean;
      calculation: null | import("@/types/type").CancellationCalculation;
    };
  },

  async requestCancellation(reservationId: string, payload: { reason: string; cancellationPolicyAccepted: boolean; attachmentUrl?: string; attachmentName?: string; attachmentContentType?: string }) {
    const response = await safeFetch(apiBase(`/customer/reservations/${reservationId}/cancellation-request`), {
      method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify(payload), toast: { silent: true },
    });
    return readJson(response);
  },

  async submitVehicleIssue(reservationId: string, note: string, imageUrl: string) {
    const response = await safeFetch(apiBase(`/reservations/${reservationId}/vehicle-issues`), {
      method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ note, imageUrl }), toast: { silent: true },
    });
    return readJson(response);
  },
  async extractLicenceDetails(asset: ImagePicker.ImagePickerAsset, backAsset?: ImagePicker.ImagePickerAsset) {
    const image = await imageAssetToBase64(asset);
    const backImage = backAsset ? await imageAssetToBase64(backAsset) : undefined;
    const response = await safeFetch(apiBase("/extract-license"), {
      method: "POST",
      toast: { silent: true },
      headers: {
        "Content-Type": "application/json",
        ...(await authHeaders()),
      },
      body: JSON.stringify({
        image,
        ...(backImage ? { backImage } : {}),
        mimeType: asset.mimeType || "image/jpeg",
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(
        payload?.error || "Could not scan the front licence image",
      );
    }

    return (await response.json()) as LicenceDetailsReview;
  },

  async extractStoredLicence(frontImage: string, backImage: string) {
    const response = await safeFetch(apiBase("/extract-license"), {
      method: "POST", toast: { silent: true },
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ frontImage, backImage }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "Could not scan the licence.");
    return data as LicenceDetailsReview;
  },

  async updateUserLicence(
    userId: string,
    licenceAttached: LicenceAttached,
    licenceDetails?: LicenceDetailsReview,
  ) {
    const response = await safeFetch(usersUrl(userId), {
      method: "PUT",
      toast: {
        successTitle: "Licence uploaded",
        successMessage: "Your licence is ready for review.",
        errorTitle: "Upload failed",
      },
      headers: {
        "Content-Type": "application/json",
        ...(await authHeaders()),
      },
      body: JSON.stringify({
        ...(licenceDetails ? profileFieldsFromLicence(licenceDetails) : {}),
        licenceAttached,
        ...(licenceDetails
          ? {
              licenceDetails: {
                ...licenceDetails,
                isFrontSide: true,
                sourceSide: "front",
              },
            }
          : {}),
      }),
    });

    return readJson(response);
  },

  async getReservationJourney(reservationId: string) {
    const response = await safeFetch(
      apiBase(`/customer/reservations/${reservationId}/journey`),
      { headers: await authHeaders() },
    );
    return readJson(response) as Promise<{
      success: boolean;
      data: {
        reservation: Reservation;
        contract: SafeContractSummary | null;
        contracts?: SafeContractSummary[];
        paymentDetails?: { bankName: string; accountName: string; sortCode: string; accountNumber: string };
      };
    }>;
  },

  async getContracts(bookingId?: string) {
    const response = await safeFetch(
      buildUrl(apiBase("/contracts"), bookingId ? { bookingId } : undefined),
      { headers: await authHeaders() },
    );
    const data = await readJson(response);
    return (data.data || []) as SafeContractSummary[];
  },

  async startSigning(contractId: string, returnUrl?: string) {
    const response = await safeFetch(apiBase(`/contracts/${contractId}/signing-url`), {
      method: "POST",
      toast: {
        successTitle: "DocuSign ready",
        successMessage: "Opening your agreement.",
        errorTitle: "DocuSign unavailable",
      },
      headers: {
        "Content-Type": "application/json",
        ...(await authHeaders()),
      },
      body: JSON.stringify(Platform.OS === "web" ? {} : { returnSource: "app" }),
    });
    const data = await readJson(response);
    return data.data?.url as string;
  },

  async refreshContract(contractId: string) {
    const response = await safeFetch(
      apiBase(`/contracts/${contractId}/status?refresh=true`),
      { headers: await authHeaders() },
    );
    const data = await readJson(response);
    return data.data as SafeContractSummary;
  },

  getContractDocumentUrl(contractId: string, kind: ContractDocumentKind) {
    return apiBase(`/contracts/${contractId}/document?type=${kind}`);
  },

  async downloadContractDocument(
    contract: Pick<SafeContractSummary, "_id" | "contractNumber">,
    kind: ContractDocumentKind,
  ) {
    const url = this.getContractDocumentUrl(contract._id, kind);
    const headers = await authHeaders();
    if (!headers.Authorization) throw new Error("Please sign in again to download your agreement.");
    const fileName = contractDocumentFileName(contract, kind);

    if (Platform.OS === "web") {
      const response = await safeFetch(url, { headers });
      if (!response.ok) throw new Error(await readDocumentError(response));
      const contentType = response.headers.get("content-type") || "";
      if (!/application\/(pdf|octet-stream)/i.test(contentType)) {
        throw new Error("The server did not return a PDF agreement. Please try again.");
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("The agreement file is empty. Please try again.");
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return fileName;
    }

    const destination = new FileSystem.File(
      FileSystem.Paths.document,
      fileName,
    );
    let downloadedFile: Awaited<ReturnType<typeof FileSystem.File.downloadFileAsync>>;
    try {
      downloadedFile = await FileSystem.File.downloadFileAsync(
        normalizeUrl(url), destination, { headers, idempotent: true },
      );
    } catch {
      let response: Response;
      try {
        response = await safeFetch(url, { headers });
      } catch {
        throw new Error("Could not connect to download the agreement. Check your connection and try again.");
      }
      if (!response.ok) throw new Error(await readDocumentError(response));
      const contentType = response.headers.get("content-type") || "";
      if (!/application\/(pdf|octet-stream)/i.test(contentType)) {
        throw new Error("The server did not return a PDF agreement. Please try again.");
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length) throw new Error("The agreement file is empty. Please try again.");
      destination.write(bytes);
      downloadedFile = destination;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(downloadedFile.uri, {
        mimeType: "application/pdf",
        dialogTitle: fileName,
        UTI: "com.adobe.pdf",
      });
    } else {
      await Linking.openURL(Platform.OS === "android" ? downloadedFile.contentUri : downloadedFile.uri);
    }

    return downloadedFile.uri;
  },

  async submitDeposit(
    reservationId: string,
    option: "full" | "secure",
    receipt?: ImagePicker.ImagePickerAsset | null,
    cancellationPolicyAccepted = false,
  ) {
    if (!cancellationPolicyAccepted) throw new Error("Please accept the cancellation policy");
    if (!receipt) throw new Error("Please upload your payment receipt");
    const receiptUrl = await uploadToS3(receipt, "deposit-receipt");

    const base = API_BASE_URL
      ? apiBase(`/reservations/${reservationId}/deposit`)
      : `${RESERVATIONS_API}/${reservationId}/deposit`;
    const response = await safeFetch(base, {
      method: "POST",
      toast: {
        successTitle: "Receipt sent",
        successMessage: "We'll verify your payment shortly.",
        errorTitle: "Deposit update failed",
      },
      headers: {
        "Content-Type": "application/json",
        ...(await authHeaders()),
      },
      body: JSON.stringify({ option, receiptUrl, cancellationPolicyAccepted }),
    });
    return readJson(response);
  },
};

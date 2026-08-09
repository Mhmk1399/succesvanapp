import { buildUrl, safeFetch } from "./apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = (process.env.EXPO_PUBLIC_RESERVATIONS_API || "").trim();
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "").trim();

type ReservationCreate = {
  category?: string;
  office: string;
  startDate: string;
  endDate: string;
  startDateDisplay?: string;
  endDateDisplay?: string;
  pickupTime?: string;
  returnTime?: string;
  driverAge?: string | number;
  dirverAge: string | number;
  totalPrice: number;
  messege?: string;
  message?: string;
  addOns?: Array<{
    addOn: string;
    quantity: number;
    tierId?: string;
    selectedTierIndex?: number;
  }>;
  discountCode?: string | null;
  selectedGear?: "manual" | "automatic";
  pickupExtensionPrice?: number;
  returnExtensionPrice?: number;
  reservationType?: "Office" | "Website" | "App";
};

export const reservationService = {
  async create(
    userData: { userId: string },
    reservationData: ReservationCreate
  ) {
    console.log("Posting to:", API_URL);
    console.log("Body:", JSON.stringify({ userData, reservationData }));
    const response = await safeFetch(API_URL, {
      method: "POST",
      toast: {
        successTitle: "Booking confirmed",
        successMessage: "Your van reservation has been created.",
        errorTitle: "Booking failed",
      },
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userData, reservationData }),
    });
    console.log("Response status:", response.status);
    const text = await response.text();
    console.log("Response text:", text);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(text || "Invalid response");
    }
  },

  async getAll(userId?: string) {
    const token = await AsyncStorage.getItem("authToken");
    if (token && API_BASE_URL) {
      try {
        const response = await safeFetch(`${API_BASE_URL}/customer/reservations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data?.success) return data;
      } catch (error) {
        console.log("[reservationService] Customer reservations fallback:", error);
      }
    }

    const url = buildUrl(API_URL, userId ? { userId } : undefined);
    const response = await safeFetch(url);
    const data = await response.json();
    return data;
  },

  async update(reservationId: string, updateData: Partial<ReservationCreate>) {
    const token = await AsyncStorage.getItem("authToken");
    const response = await safeFetch(`${API_URL}/${reservationId}`, {
      method: "PATCH",
      toast: {
        successTitle: "Reservation updated",
        successMessage: "Your booking changes have been saved.",
        errorTitle: "Update failed",
      },
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updateData),
    });
    const data = await response.json();
    return data;
  },
};

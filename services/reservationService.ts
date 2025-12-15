const API_URL = process.env.EXPO_PUBLIC_RESERVATIONS_API || " ";

type ReservationCreate = {
  category?: string;
  office: string;
  startDate: string;
  endDate: string;
  dirverAge: string | number;
  totalPrice: number;
  addOns?: Array<{
    addOn: string;
    quantity: number;
    tierId?: string;
  }>;
};

export const reservationService = {
  async create(
    userData: { userId: string },
    reservationData: ReservationCreate
  ) {
    console.log("Posting to:", API_URL);
    console.log("Body:", JSON.stringify({ userData, reservationData }));
    const response = await fetch(API_URL, {
      method: "POST",
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
    console.log("[Reservation Service] getAll called with userId:", userId);
    console.log("[Reservation Service] userId type:", typeof userId);
    console.log("[Reservation Service] API_URL:", API_URL);
    const url = userId ? `${API_URL}?userId=${userId}` : API_URL;
    console.log("[Reservation Service] Final URL:", url);
    const response = await fetch(url);
    console.log("[Reservation Service] Response status:", response.status);
    const data = await response.json();
    console.log("[Reservation Service] Data:", data);
    return data;
  },
};

const API_URL = process.env.EXPO_PUBLIC_RESERVATIONS_API || "https://succesvan.vercel.app/api/reservations";

export const reservationService = {
  async create(userData: any, reservationData: any) {
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
    const url = userId ? `${API_URL}?userId=${userId}` : API_URL;
    const response = await fetch(url);
    return response.json();
  },
};

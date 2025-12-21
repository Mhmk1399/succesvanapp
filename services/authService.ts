import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_AUTH_API || " ";

export const authService = {
  async sendCode(phoneNumber: string) {
    console.log("API_URL:", API_URL);
    console.log("Sending to:", phoneNumber);
    
    if (!API_URL || API_URL.trim() === "") {
      throw new Error("API URL not configured");
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send-code", phoneNumber }),
    });
    
    console.log("Response status:", response.status);
    const text = await response.text();
    console.log("Response text:", text);
    
    try {
      const data = JSON.parse(text);
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(text || "Invalid response from server");
      }
      throw error;
    }
  },

  async verifyCode(phoneNumber: string, code: string) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", phoneNumber, code }),
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(text || "Invalid response from server");
    }
    if (data.success && data.data.token) {
      await AsyncStorage.setItem("authToken", data.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.data.user));
    }
    return data;
  },

  async register(
    phoneNumber: string,
    name: string,
    lastName: string,
    emailAddress: string
  ) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register",
        phoneNumber,
        name,
        lastName,
        emailAddress,
      }),
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(text || "Invalid response from server");
    }
    if (data.success && data.data.token) {
      await AsyncStorage.setItem("authToken", data.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.data.user));
    }
    return data;
  },

  async getUser() {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) throw new Error("No token");

    const response = await fetch(API_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async logout() {
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("user");
  },
};

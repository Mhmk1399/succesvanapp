const API_URL = process.env.EXPO_PUBLIC_TYPES_API || "";

export const typeService = {
  async getAll() {
    const response = await fetch(API_URL);
    const data = await response.json();
    return data.data;
  },
};

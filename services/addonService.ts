const API_URL = process.env.EXPO_PUBLIC_ADDONS_API || " ";

export const addonService = {
  async getAll() {
    const response = await fetch(API_URL);
    const data = await response.json();
    return data;
  },

  async getById(id: string) {
    const response = await fetch(`${API_URL}/${id}`);
    return response.json();
  },
};

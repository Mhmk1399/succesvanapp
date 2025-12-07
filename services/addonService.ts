const API_URL = process.env.EXPO_PUBLIC_ADDONS_API || " ";

export const addonService = {
  async getAll() {
    const response = await fetch(API_URL);
    return response.json();
  },

  async getById(id: string) {
    const response = await fetch(`${API_URL}/${id}`);
    return response.json();
  },
};

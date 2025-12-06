const API_URL = process.env.REACT_APP_CATEGORIES_API || "https://succesvan.vercel.app/api/categories";

export const categoryService = {
  async getAll() {
    const response = await fetch(API_URL);
    return response.json();
  },

  async getById(id: string) {
    const response = await fetch(`${API_URL}/${id}`);
    return response.json();
  },
};

const API_URL = process.env.REACT_APP_CATEGORIES_API || " ";

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

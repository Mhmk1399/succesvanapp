import { safeFetch } from "./apiClient";
import { getTrustedNow, syncServerClock } from "@/utils/londonTime";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildUrl } from "./apiClient";

const API_URL = process.env.EXPO_PUBLIC_DISCOUNTS_API;

export const discountService = {
  async validateCode(code: string, userId: string, categoryId: string) {
    try {
      console.log('Validating discount:', { code, userId, categoryId });
      const token = await AsyncStorage.getItem("authToken");
      const response = await safeFetch(buildUrl(API_URL || "", { validate: true, code }), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await response.json();
      console.log('API Response:', result);

      if (!result.success || !Array.isArray(result.data) || result.data.length === 0) {
        console.log('No discount found');
        return { success: false, message: "Invalid discount code" };
      }

      const discount = result.data[0];
      console.log('Discount found:', discount);
      
      if (!discount) {
        return { success: false, message: "Invalid discount code" };
      }

      await syncServerClock().catch(() => {});
      const now = getTrustedNow();
      const validFrom = new Date(discount.validFrom);
      const validTo = new Date(discount.validTo);
      console.log('Date check:', { now, validFrom, validTo });

      if (now < validFrom || now > validTo) {
        console.log('Date validation failed');
        return { success: false, message: "Discount code has expired" };
      }

      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        console.log('Usage limit reached');
        return { success: false, message: "Discount code usage limit reached" };
      }

      if (discount.usedBy && discount.usedBy.includes(userId)) {
        console.log('User already used this code');
        return {
          success: false,
          message: "You have already used this discount code",
        };
      }

      if (
        discount.categories &&
        discount.categories.length > 0 &&
        !discount.categories.some((cat: any) => cat._id === categoryId)
      ) {
        console.log('Category validation failed', { discountCategories: discount.categories, categoryId });
        return {
          success: false,
          message: "This discount code is not valid for this van",
        };
      }

      console.log('Validation successful!');
      return {
        success: true,
        data: discount,
        message: `${discount.percentage}% discount applied!`,
      };
    } catch (error) {
      console.log("Validate discount error:", error);
      return { success: false, message: "Failed to validate discount code" };
    }
  },

  async applyDiscount(discountId: string, userId: string) {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await safeFetch(`${API_URL}?id=${discountId}`, {
        method: "PATCH",
        toast: { silent: true },
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ addUserToUsedBy: userId }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.log("Apply discount error:", error);
      return { success: false, message: "Failed to apply discount" };
    }
  },
};

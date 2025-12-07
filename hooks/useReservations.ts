import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@/services/reservationService";

export const useReservations = () => {
  return useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const result = await reservationService.getAll();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

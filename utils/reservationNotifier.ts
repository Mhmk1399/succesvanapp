import { Reservation } from "@/types/type";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const STORAGE_KEY = "reservation_statuses";

export const checkStatusChanges = async (
  currentReservations: Reservation[],
): Promise<Reservation[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const previousStatuses: Record<string, string> = stored
      ? JSON.parse(stored)
      : {};

    const changedReservations: Reservation[] = [];
    const newStatuses: Record<string, string> = {};

    currentReservations.forEach((reservation) => {
      const id = reservation._id;
      if (!id) return;
      const currentStatus = reservation.status;
      newStatuses[id] = currentStatus;

      if (previousStatuses[id] && previousStatuses[id] !== currentStatus) {
        changedReservations.push(reservation);
      }
    });

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStatuses));
    return changedReservations;
  } catch (error) {
    console.log("Error checking status changes:", error);
    return [];
  }
};

export const showStatusNotification = async (reservation: Reservation) => {
  if (Platform.OS === "web") {
    console.log("[reservationNotifier] Status updated:", {
      reservationId: reservation._id,
      status: reservation.status,
    });
    return;
  }

  const statusLabels: Record<string, string> = {
    pending: "Pending Review",
    confirmed: "Booking Confirmed",
    deposit_pending: "Deposit Payment",
    deposit_paid: "Deposit Paid",
    contract_pending: "Contract Signing",
    contract_signed: "Contract Signed",
    ready_for_collection: "Ready for Collection",
    handover_in_progress: "Vehicle Handover",
    delivered: "Rental Active",
    vehicle_returned: "Vehicle Returned",
    return_inspection: "Return Inspection",
    deposit_review: "Deposit Review",
    refund_processing: "Refund Processing",
    refund_completed: "Refund Completed",
    completed: "Completed",
    canceled: "Cancelled",
    expired: "Expired",
  };

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Reservation Status Updated",
        body: `${reservation.category?.name || "Your reservation"} is now ${
          statusLabels[reservation.status] || reservation.status
        }`,
        data: { reservationId: reservation._id },
      },
      trigger: null,
    });
  } catch (error) {
    console.log("[reservationNotifier] Notification skipped:", error);
  }
};

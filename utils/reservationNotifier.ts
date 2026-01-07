import { Reservation } from "@/types/type";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

const STORAGE_KEY = "reservation_statuses";

export const checkStatusChanges = async (
  currentReservations: Reservation[]
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
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed ✓",
    completed: "Completed",
    canceled: "Cancelled",
  };

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
};

import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { reservationService } from "@/services/reservationService";
import {
  checkStatusChanges,
  showStatusNotification,
} from "./reservationNotifier";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TASK_NAME = "RESERVATION_STATUS_CHECK";

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) return BackgroundFetch.BackgroundFetchResult.NoData;

    const result = await reservationService.getAll(userId);
    const reservations = result.data || [];
    const changed = await checkStatusChanges(reservations);

    for (const res of changed) {
      await showStatusNotification(res);
    }

    return changed.length > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {}
};

export const unregisterBackgroundTask = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
  } catch {}
};

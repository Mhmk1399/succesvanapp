import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import { Van } from "../vanlist";
import { Office } from "@/types/type";
import {
  getAvailableTimeSlots as getSharedAvailableTimeSlots,
  isDateDisabled as isSharedDateDisabled,
} from "@/utils/bookingSchedule";

export const formatDate = (date: Date | null) => {
  if (!date) return "DD/MM/YYYY";
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear().toString();
  return `${d}/${m}/${y}`;
};

export const formatTime = (time: string | Date | null) => {
  if (!time) return "HH:MM";
  if (typeof time === "string") return time;
  const h = time.getHours().toString().padStart(2, "0");
  const min = time.getMinutes().toString().padStart(2, "0");
  return `${h}:${min}`;
};

export const getSelectedOffice = (offices: Office[], selectedOffice: string) =>
  offices.find((o) => o._id === selectedOffice);

export const isDateDisabled = (date: Date, office: Office | undefined) => {
  return isSharedDateDisabled(date, office);
};

export const getAvailableTimeSlots = (
  date: Date | null,
  office: Office | undefined,
  isPickup: boolean = true
) => {
  return getSharedAvailableTimeSlots(
    date,
    office,
    isPickup ? "pickup" : "return",
  );
};

export const playSuccessSound = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      require("@/assets/sounds/Iphone.mp3"),
      { shouldPlay: true, volume: 0.7 },
      (status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      }
    );
    await sound.playAsync();
  } catch (error) {
    console.log("Sound error:", error);
  }
};

export const scheduleNotification = async (van: Van | null) => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Booking Confirmed!",
      body: `Your ${van?.name} is reserved. We'll contact you soon.`,
      sound: true,
      data: { vanId: van?.id, vanName: van?.name },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
};

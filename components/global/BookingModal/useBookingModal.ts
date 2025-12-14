import { useRef, useEffect, useState } from "react";
import { Animated, PanResponder, Alert, Keyboard } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { addonService } from "@/services/addonService";
import { officeService } from "@/services/officeService";
import { reservationService } from "@/services/reservationService";
import { calculatePrice } from "@/utils/priceCalculator";
import { AddOn, Office } from "@/types/type";
import { Van } from "../vanlist";
import { PickerField } from "./types";
import { height } from "./constants";
import {
  formatTime,
  playSuccessSound,
  scheduleNotification,
  getSelectedOffice,
  isDateDisabled as checkDateDisabled,
} from "./utils";

export const useBookingModal = (
  visible: boolean,
  van: Van | null,
  onClose: () => void,
  prefilledData?: {
    office: string;
    category: string;
    pickupDate: string;
    returnDate: string;
    pickupTime?: string;
    returnTime?: string;
    driverAge?: string | number;
  },
  onReservationComplete?: () => void
) => {
  const hasPrefilledData = !!prefilledData;
  const { user } = useAuth();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hasCheckedAuth = useRef(false);

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState<Date | null>(
    prefilledData?.pickupDate ? new Date(prefilledData.pickupDate) : new Date()
  );
  const [pickupTime, setPickupTime] = useState<string>(
    prefilledData?.pickupTime || "07:00"
  );
  const [returnDate, setReturnDate] = useState<Date | null>(
    prefilledData?.returnDate
      ? new Date(prefilledData.returnDate)
      : new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [returnTime, setReturnTime] = useState<string>(
    prefilledData?.returnTime || "10:00"
  );
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [dateRangeModalVisible, setDateRangeModalVisible] = useState(false);
  const [selectingDate, setSelectingDate] = useState<"pickup" | "return">(
    "pickup"
  );
  const [tempPickupDate, setTempPickupDate] = useState<Date | null>(null);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeModalField, setTimeModalField] = useState<
    "pickupTime" | "returnTime" | null
  >(null);
  const [reservedSlots, setReservedSlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [addonSelections, setAddonSelections] = useState<
    Record<string, { quantity: number; tierId?: string }>
  >({});
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<string>(
    prefilledData?.office || ""
  );
  const [officeModalVisible, setOfficeModalVisible] = useState(false);
  const [driverAge, setDriverAge] = useState(
    prefilledData?.driverAge?.toString() || ""
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (visible && !user && van && !hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      AsyncStorage.setItem("pendingBookingVan", JSON.stringify(van));
      setTimeout(() => {
        handleClose();
        Alert.alert(
          "Login Required",
          "Please login or register to book a van.",
          [
            { text: "Register", onPress: () => router.push("/register") },
            { text: "Cancel", style: "cancel" },
          ]
        );
      }, 100);
    }
    if (!visible) {
      hasCheckedAuth.current = false;
    }
  }, [visible, user, van]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 50,
            friction: 9,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setLastName(user.lastName || "");
      setEmail(user.emaildata?.emailAddress || "");
      setPhone(user.phoneData?.phoneNumber || "");
    }
  }, [user]);

  useEffect(() => {
    if (prefilledData?.driverAge) {
      setDriverAge(prefilledData.driverAge.toString());
    }
    if (prefilledData?.office) {
      setSelectedOffice(prefilledData.office);
    }
    if (prefilledData?.pickupTime) {
      setPickupTime(prefilledData.pickupTime);
    }
    if (prefilledData?.returnTime) {
      setReturnTime(prefilledData.returnTime);
    }
  }, [prefilledData]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [addonsResult, officesResult] = await Promise.all([
          addonService.getAll(),
          officeService.getAll(),
        ]);
        setAddons(addonsResult.data || []);
        setOffices(officesResult.data || []);
      } catch (error) {
        console.log("Failed to fetch data", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    if (visible) fetchData();
  }, [visible]);

  useEffect(() => {
    const fetchReservedSlots = async () => {
      if (!timeModalVisible || !selectedOffice || !timeModalField) return;
      const dateToFetch =
        timeModalField === "pickupTime" ? pickupDate : returnDate;
      if (!dateToFetch) return;

      try {
        const dateStr = dateToFetch.toISOString().split("T")[0];
        const EXPO_PUBLIC_RESERVATIONS_BY_OFFICE_API =
          process.env.EXPO_PUBLIC_RESERVATIONS_BY_OFFICE_API;
        const response = await fetch(
          `${EXPO_PUBLIC_RESERVATIONS_BY_OFFICE_API}?office=${selectedOffice}&startDate=${dateStr}&endDate=${dateStr}`
        );
        const data = await response.json();
        if (data.success && data.reservedSlots) {
          setReservedSlots(data.reservedSlots);
        }
      } catch (error) {
        console.log("Failed to fetch reserved slots", error);
      }
    };
    fetchReservedSlots();
  }, [
    timeModalVisible,
    selectedOffice,
    timeModalField,
    pickupDate,
    returnDate,
  ]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(height);
      opacity.setValue(0);
    }
  }, [visible]);

  const openDatePicker = () => {
    if (!selectedOffice) {
      Alert.alert("Select Office", "Please select an office first.");
      return;
    }
    Haptics.selectionAsync();
    setSelectingDate("pickup");
    setTempPickupDate(null);
    setDateRangeModalVisible(true);
  };

  const openTimePicker = (field: "pickupTime" | "returnTime") => {
    if (!selectedOffice) {
      Alert.alert("Select Office", "Please select an office first.");
      return;
    }
    Haptics.selectionAsync();
    setTimeModalField(field);
    setTimeModalVisible(true);
  };

  const handleDateSelect = (dateString: string) => {
    const date = new Date(dateString);
    const office = getSelectedOffice(offices, selectedOffice);
    if (checkDateDisabled(date, office)) {
      Alert.alert(
        "Office Closed",
        "The selected date is not available for this office."
      );
      return;
    }

    if (selectingDate === "pickup") {
      setPickupDate(date);
      setTempPickupDate(date);
      setSelectingDate("return");
    } else {
      setReturnDate(date);
      setDateRangeModalVisible(false);
      setSelectingDate("pickup");
    }
  };

  const selectTime = (time: string) => {
    Haptics.selectionAsync();
    if (timeModalField === "pickupTime") {
      setPickupTime(time);
    } else if (timeModalField === "returnTime") {
      setReturnTime(time);
    }
    setTimeModalVisible(false);
    setTimeModalField(null);
  };

  const handleSubmit = async () => {
    console.log("[BookingModal] handleSubmit called");
    if (!user) {
      console.log("[BookingModal] No user, showing login alert");
      Alert.alert("Login Required", "Please login to book a van.");
      return;
    }
    console.log("[BookingModal] User exists, continuing...");

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Please enter your name";
    if (!email.trim()) newErrors.email = "Please enter your email";
    else if (!email.includes("@"))
      newErrors.email = "Please enter a valid email";

    if (!hasPrefilledData) {
      if (!selectedOffice) newErrors.office = "Please select an office";
      if (!pickupDate || !pickupTime)
        newErrors.pickup = "Please select pickup date and time";
      if (!returnDate || !returnTime)
        newErrors.return = "Please select return date and time";
    }

    const age = Number(driverAge);
    if (!driverAge || age < 25 || age > 70)
      newErrors.driverAge = "Driver age must be between 25 and 70";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.log("[BookingModal] Validation failed, stopping");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const userData = { userId: user._id };

      const [pickupHour, pickupMinute] = pickupTime.split(":");
      const [returnHour, returnMinute] = returnTime.split(":");

      const startDateTime = new Date(pickupDate!);
      startDateTime.setHours(
        parseInt(pickupHour),
        parseInt(pickupMinute),
        0,
        0
      );

      const endDateTime = new Date(returnDate!);
      endDateTime.setHours(parseInt(returnHour), parseInt(returnMinute), 0, 0);

      const vanPrice = calculatePrice(
        startDateTime,
        endDateTime,
        van?.pricingTiers || [],
        van?.extraHoursRate || 0
      );

      const addonsPrice = Object.entries(addonSelections).reduce(
        (sum, [addonId, selection]) => {
          const addon = addons.find((a) => a._id === addonId);
          if (!addon) return sum;

          let addonPrice = 0;
          if (addon.pricingType === "flat") {
            addonPrice = (addon.flatPrice || 0) * selection.quantity;
          } else if (addon.pricingType === "tiered" && selection.tierId) {
            const tier = addon.tiers?.find((t) => t._id === selection.tierId);
            addonPrice = (tier?.price || 0) * selection.quantity;
          }
          return sum + addonPrice;
        },
        0
      );

      const totalPrice = vanPrice + addonsPrice;

      const categoryId = van?.id;

      const reservationData = {
        category: categoryId,
        office: hasPrefilledData ? prefilledData.office : selectedOffice,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        dirverAge: driverAge,
        totalPrice,
      };

      console.log("[BookingModal] Submit data:", {
        hasPrefilledData,
        prefilledData,
        van,
        reservationData,
        pickupTime,
        returnTime,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
      });

      console.log("[BookingModal] Calling API with:", {
        userData,
        reservationData,
      });
      const result = await reservationService.create(userData, reservationData);

      if (result.success) {
        await playSuccessSound();
        await scheduleNotification(van);
        handleClose();
        onReservationComplete?.();
        router.push("/dashboard?tab=reservations");
      } else {
        Alert.alert("Error", result.error || "Booking failed");
      }
    } catch (error) {
      Alert.alert(
        "Network error",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    translateY,
    opacity,
    panResponder,
    name,
    setName,
    lastName,
    setLastName,
    email,
    setEmail,
    phone,
    setPhone,
    pickupDate,
    setPickupDate,
    pickupTime,
    setPickupTime,
    returnDate,
    setReturnDate,
    returnTime,
    setReturnTime,
    focusedInput,
    setFocusedInput,
    isSubmitting,
    errors,
    setErrors,
    addons,
    addonSelections,
    setAddonSelections,
    offices,
    selectedOffice,
    setSelectedOffice,
    officeModalVisible,
    setOfficeModalVisible,
    driverAge,
    setDriverAge,
    message,
    setMessage,
    hasPrefilledData,
    handleClose,
    openDatePicker,
    openTimePicker,
    handleDateSelect,
    selectTime,
    handleSubmit,
    isLoadingData,
    dateRangeModalVisible,
    setDateRangeModalVisible,
    selectingDate,
    setSelectingDate,
    tempPickupDate,
    timeModalVisible,
    setTimeModalVisible,
    timeModalField,
    setTimeModalField,
    reservedSlots,
  };
};

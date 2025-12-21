import { useAuth } from "@/contexts/AuthContext";
import { addonService } from "@/services/addonService";
import { officeService } from "@/services/officeService";
import { reservationService } from "@/services/reservationService";
import { AddOn, Office } from "@/types/type";
import { calculateAddonPrice } from "@/utils/addonCalculator";
import { calculatePrice } from "@/utils/priceCalculator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Keyboard, PanResponder } from "react-native";
import { Van } from "../vanlist";
import { height } from "./constants";
import {
  isDateDisabled as checkDateDisabled,
  getAvailableTimeSlots,
  getSelectedOffice,
  playSuccessSound,
  scheduleNotification,
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
    calculatedPrice?: number;
  },
  onReservationComplete?: () => void
) => {
  const hasPrefilledData = !!prefilledData;
  const { user } = useAuth();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState<Date | null>(() => {
    if (!prefilledData?.pickupDate) return new Date();
    const d = new Date(prefilledData.pickupDate);
    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return localDate;
  });
  const [pickupTime, setPickupTime] = useState<string>(
    prefilledData?.pickupTime || ""
  );
  const [returnDate, setReturnDate] = useState<Date | null>(() => {
    if (!prefilledData?.returnDate)
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    const d = new Date(prefilledData.returnDate);
    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return localDate;
  });
  const [returnTime, setReturnTime] = useState<string>(
    prefilledData?.returnTime || ""
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
  const [filteredOffices, setFilteredOffices] = useState<Office[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<string>(
    prefilledData?.office || ""
  );
  const [officeModalVisible, setOfficeModalVisible] = useState(false);
  const [driverAge, setDriverAge] = useState(
    prefilledData?.driverAge?.toString() || ""
  );
  const [message, setMessage] = useState("");
  const [dynamicVanPrice, setDynamicVanPrice] = useState<number>(0);
  const [selectedGear, setSelectedGear] = useState<"manual" | "automatic">(
    "manual"
  );

  useEffect(() => {
    if (!pickupDate || !returnDate || !pickupTime || !returnTime || !van)
      return;

    if (prefilledData?.calculatedPrice) {
      setDynamicVanPrice(prefilledData.calculatedPrice);
      return;
    }

    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const [pH, pM] = pickupTime.split(":").map(Number);
    const [rH, rM] = returnTime.split(":").map(Number);
    start.setHours(pH, pM, 0, 0);
    end.setHours(rH, rM, 0, 0);

    let basePrice = calculatePrice(
      start,
      end,
      van.pricingTiers || [],
      van.extraHoursRate || 0
    );

    // Add automatic gear cost
    if (
      selectedGear === "automatic" &&
      typeof van.gear === "object" &&
      van.gear.automaticExtraCost
    ) {
      const diffMs = end.getTime() - start.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      basePrice += van.gear.automaticExtraCost * days;
    }

    // Calculate extension fees
    let pickupExtensionFee = 0;
    let returnExtensionFee = 0;
    const office = getSelectedOffice(offices, selectedOffice);

    if (office && pickupDate && pickupTime) {
      const dayName = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][pickupDate.getDay()];
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName
      );
      if (workingDay?.pickupExtension) {
        const slots = getAvailableTimeSlots(pickupDate, office, true);
        if (slots.normalStart && slots.normalEnd) {
          const isExtension =
            pickupTime < slots.normalStart || pickupTime > slots.normalEnd;
          if (isExtension) {
            pickupExtensionFee = workingDay.pickupExtension.flatPrice;
          }
        }
      }
    }

    if (office && returnDate && returnTime) {
      const dayName = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][returnDate.getDay()];
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName
      );
      if (workingDay?.returnExtension) {
        const slots = getAvailableTimeSlots(returnDate, office, false);
        if (slots.normalStart && slots.normalEnd) {
          const isExtension =
            returnTime < slots.normalStart || returnTime > slots.normalEnd;
          if (isExtension) {
            returnExtensionFee = workingDay.returnExtension.flatPrice;
          }
        }
      }
    }

    setDynamicVanPrice(basePrice + pickupExtensionFee + returnExtensionFee);
  }, [
    pickupDate,
    returnDate,
    pickupTime,
    returnTime,
    van,
    prefilledData?.calculatedPrice,
    offices,
    selectedOffice,
    selectedGear,
  ]);

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
    console.log("[useBookingModal] Syncing prefilledData:", {
      pickupDate: prefilledData?.pickupDate,
      returnDate: prefilledData?.returnDate,
      pickupTime: prefilledData?.pickupTime,
      returnTime: prefilledData?.returnTime,
    });

    if (prefilledData?.pickupDate) {
      const d = new Date(prefilledData.pickupDate);
      const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      console.log(
        "[useBookingModal] Setting pickupDate to:",
        localDate.toISOString().split("T")[0]
      );
      setPickupDate(localDate);
    }
    if (prefilledData?.returnDate) {
      const d = new Date(prefilledData.returnDate);
      const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      console.log(
        "[useBookingModal] Setting returnDate to:",
        localDate.toISOString().split("T")[0]
      );
      setReturnDate(localDate);
    }
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
        const allOffices = officesResult.data || [];
        setOffices(allOffices);
        
        // Filter offices based on van category
        if (!hasPrefilledData && van?.id) {
          const filtered = allOffices.filter((office: Office) => 
            office.categories?.includes(van.id)
          );
          setFilteredOffices(filtered);
        } else {
          setFilteredOffices(allOffices);
        }
      } catch (error) {
        console.log("Failed to fetch data", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    if (visible) fetchData();
  }, [visible, van?.id, hasPrefilledData]);

  useEffect(() => {
    const fetchReservedSlots = async () => {
      if (!timeModalVisible || !selectedOffice || !timeModalField) return;
      const dateToFetch =
        timeModalField === "pickupTime" ? pickupDate : returnDate;
      if (!dateToFetch) return;

      try {
        const dateStr = dateToFetch.toISOString().split("T")[0];
        const type = timeModalField === "pickupTime" ? "start" : "end";
        const EXPO_PUBLIC_RESERVATIONS_BY_OFFICE_API =
          process.env.EXPO_PUBLIC_RESERVATIONS_BY_OFFICE_API;

        console.log("[BookingModal.fetchReservedSlots] Fetching:", {
          dateStr,
          type,
          timeModalField,
        });

        const response = await fetch(
          `${EXPO_PUBLIC_RESERVATIONS_BY_OFFICE_API}?office=${selectedOffice}&${
            type === "start" ? "startDate" : "endDate"
          }=${dateStr}&type=${type}`
        );
        const data = await response.json();
        console.log("[BookingModal.fetchReservedSlots] Response:", data);

        if (data.success && data.data?.reservedSlots) {
          // Filter slots to only those that match the exact date
          const filteredSlots = data.data.reservedSlots.filter((slot: any) => {
            if (type === "start") {
              return slot.startDate === dateStr;
            } else {
              return slot.endDate === dateStr;
            }
          });
          console.log(
            "[BookingModal.fetchReservedSlots] Filtered slots:",
            filteredSlots
          );
          setReservedSlots(filteredSlots);
        }
      } catch (error) {
        console.log("Failed to fetch reserved slots", error);
        setReservedSlots([]);
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

      // Check if total rental is less than 6 hours
      if (pickupDate && returnDate && pickupTime) {
        const start = new Date(pickupDate);
        const end = new Date(returnDate);
        const [pH, pM] = pickupTime.split(":").map(Number);
        const [rH, rM] = time.split(":").map(Number);
        start.setHours(pH, pM, 0, 0);
        end.setHours(rH, rM, 0, 0);

        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 6) {
          Alert.alert(
            "Minimum Rental Period",
            "Minimum rental period is 6 hours. Please select a later return time."
          );
          return;
        }
      }
    }
    setTimeModalVisible(false);
    setTimeModalField(null);
  };

  const handleSubmit = async () => {
    if (!user) {
      await AsyncStorage.setItem("pendingBookingVan", JSON.stringify(van));
      handleClose();
      Alert.alert(
        "Login Required",
        "Please login or register to book this van.",
        [
          {
            text: "Login",
            onPress: () => router.push("/register"),
          },
          {
            text: "Register",
            onPress: () => router.push("/register"),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

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

    // Check minimum 6 hours rental
    if (pickupDate && returnDate && pickupTime && returnTime) {
      const start = new Date(pickupDate);
      const end = new Date(returnDate);
      const [pH, pM] = pickupTime.split(":").map(Number);
      const [rH, rM] = returnTime.split(":").map(Number);
      start.setHours(pH, pM, 0, 0);
      end.setHours(rH, rM, 0, 0);
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (diffHours < 6) {
        Alert.alert(
          "Minimum Rental Period",
          "Minimum rental period is 6 hours. Please adjust your dates and times."
        );
        return;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setErrors({});

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

      console.log("[BookingModal.handleSubmit] Dates before reservation:", {
        pickupDate: pickupDate?.toISOString().split("T")[0],
        returnDate: returnDate?.toISOString().split("T")[0],
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
      });

      const vanPrice = dynamicVanPrice;

      const addonsForPayload = Object.entries(addonSelections)
        .filter(([_, selection]) => selection.quantity > 0)
        .map(([addonId, selection]) => ({
          addOn: addonId,
          quantity: selection.quantity,
        }));

      const addonsPrice = Object.entries(addonSelections).reduce(
        (sum, [addonId, selection]) => {
          const addon = addons.find((a) => a._id === addonId);
          if (!addon) return sum;

          const addonPrice = calculateAddonPrice(
            addon,
            pickupDate!,
            returnDate!,
            pickupTime,
            returnTime,
            selection.quantity
          );
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
        addOns: addonsForPayload,
        messege: message,
      };
      console.log(reservationData, "reservationData");

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
    offices: hasPrefilledData ? offices : filteredOffices,
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
    dynamicVanPrice,
    selectedGear,
    setSelectedGear,
  };
};

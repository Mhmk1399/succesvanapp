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
    driverAge?: string | number;
  }
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
  const [pickupTime, setPickupTime] = useState<Date | null>(
    prefilledData?.pickupDate ? new Date(prefilledData.pickupDate) : new Date()
  );
  const [returnDate, setReturnDate] = useState<Date | null>(
    prefilledData?.returnDate ? new Date(prefilledData.returnDate) : new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [returnTime, setReturnTime] = useState<Date | null>(
    prefilledData?.returnDate ? new Date(prefilledData.returnDate) : new Date()
  );
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [pickerField, setPickerField] = useState<PickerField>(null);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [addonSelections, setAddonSelections] = useState<Record<string, { quantity: number; tierId?: string }>>({});
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<string>(
    prefilledData?.office || ""
  );
  const [officeModalVisible, setOfficeModalVisible] = useState(false);
  const [driverAge, setDriverAge] = useState(prefilledData?.driverAge?.toString() || "");

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

  const openPicker = (field: PickerField, mode: "date" | "time") => {
    if (!selectedOffice) {
      Alert.alert("Select Office", "Please select an office first.");
      return;
    }
    Haptics.selectionAsync();
    setPickerField(field);
    setPickerMode(mode);
  };

  const handleConfirm = (date: Date) => {
    const office = getSelectedOffice(offices, selectedOffice);
    if (pickerMode === "date" && checkDateDisabled(date, office)) {
      Alert.alert(
        "Office Closed",
        "The selected date is not available for this office."
      );
      setPickerField(null);
      return;
    }

    switch (pickerField) {
      case "pickupDate":
        setPickupDate(date);
        break;
      case "pickupTime":
        setPickupTime(date);
        break;
      case "returnDate":
        setReturnDate(date);
        break;
      case "returnTime":
        setReturnTime(date);
        break;
    }
    setPickerField(null);
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to book a van.");
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

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const userData = { userId: user._id };
      const startDateTime = new Date(pickupDate!);
      const [pickupHour, pickupMin] = formatTime(pickupTime).split(":");
      startDateTime.setHours(parseInt(pickupHour), parseInt(pickupMin));

      const endDateTime = new Date(returnDate!);
      const [returnHour, returnMin] = formatTime(returnTime).split(":");
      endDateTime.setHours(parseInt(returnHour), parseInt(returnMin));

      const vanPrice = calculatePrice(
        startDateTime,
        endDateTime,
        van?.pricingTiers || []
      );
      
      const addonsPrice = Object.entries(addonSelections).reduce((sum, [addonId, selection]) => {
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
      }, 0);
      
      const totalPrice = vanPrice + addonsPrice;

      const reservationData = {
        category: van?.id,
        office: hasPrefilledData ? prefilledData.office : selectedOffice,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        dirverAge: driverAge,
        totalPrice,
      };

      const result = await reservationService.create(userData, reservationData);
      console.log(result);

      if (result.success) {
        await playSuccessSound();
        await scheduleNotification(van);
        Alert.alert(
          "✅ Booking Confirmed",
          `Your ${van?.name} has been booked successfully!`,
          [{ text: "OK", onPress: handleClose }]
        );
      } else {
        Alert.alert("Error", result.error || "Booking failed");
      }
    } catch (error) {
      console.log("[BookingModal] Submit error:", error);
      console.log(
        "[BookingModal] Error details:",
        JSON.stringify(error, null, 2)
      );
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
    pickerField,
    setPickerField,
    pickerMode,
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
    hasPrefilledData,
    handleClose,
    openPicker,
    handleConfirm,
    handleSubmit,
    isLoadingData,
  };
};

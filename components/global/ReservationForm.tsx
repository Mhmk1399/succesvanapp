// components/ReservationForm.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Calendar } from "react-native-calendars";
import { ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { typeService } from "@/services/typeService";
import { officeService } from "@/services/officeService";
import { Category, Type } from "@/types/type";
import VansModal from "./VansModal";
import { sheetStyles, styles } from "./styleForm";

const ACCENT = "#fe9a00";
const DARK = "#0f172a";
const { height } = Dimensions.get("window");

type PickerField =
  | "pickupDate"
  | "pickupTime"
  | "returnDate"
  | "returnTime"
  | null;

type ReservationFormProps = {
  onCompleted?: () => void;
};

/* ========= Types to mirror your Next.js logic ========= */

type SpecialDay = {
  month: number;
  day: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  reason?: string;
};

type WorkingTime = {
  day: string; // "monday" | "tuesday" | ...
  isOpen: boolean;
  startTime: string;
  endTime: string;
  pickupExtension?: {
    hoursBefore: number;
    hoursAfter: number;
    flatPrice: number;
  };
  returnExtension?: {
    hoursBefore: number;
    hoursAfter: number;
    flatPrice: number;
  };
};

type Office = {
  _id: string;
  name: string;
  specialDays?: SpecialDay[];
  workingTime?: WorkingTime[];
};

/* ===================================================== */

export default function ReservationForm({ onCompleted }: ReservationFormProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  // Auto-open modal if returning from login/register
  useEffect(() => {
    const checkPendingForm = async () => {
      const pending = await AsyncStorage.getItem("pendingReservationForm");
      if (pending) {
        setTimeout(() => openSheet(), 500);
      }
    };
    checkPendingForm();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 70) {
          closeSheet();
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
    Animated.loop(
      Animated.timing(shineAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 800],
  });

  const openSheet = async () => {
    await Haptics.selectionAsync();
    setSheetVisible(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: height,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSheetVisible(false);
    });
  };

  return (
    <>
      {/* MAIN CTA BUTTON */}
      <Pressable
        onPress={openSheet}
        style={({ pressed }) => [
          styles.mainButton,
          pressed && styles.mainButtonPressed,
        ]}
      >
        <LinearGradient
          colors={[ACCENT, "#ff8c00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.mainButtonGradient}
        >
          <Animated.View
            style={[
              styles.shineEffect,
              { transform: [{ translateX: shineTranslate }] },
            ]}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <View style={[styles.mainButtonLeft, { zIndex: 2 }]}>
            <Ionicons name="flash-outline" size={22} color={DARK} />
            <Text style={styles.mainButtonText}>Quick Reservation</Text>
          </View>
          <View style={[styles.mainButtonRight, { zIndex: 2 }]}>
            <Ionicons name="calendar-outline" size={16} color={DARK} />
            <Text style={styles.mainButtonSubText}>Under 1 minute</Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* BOTTOM SHEET MODAL */}
      <Modal visible={sheetVisible} transparent animationType="none">
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "rgba(0,0,0,0.3)",
                opacity: backdropOpacity,
              },
            ]}
          />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
            <View {...panResponder.panHandlers} style={styles.handleArea}>
              <View style={styles.sheetHandle} />
            </View>

            <ReservationSheetContent
              onClose={closeSheet}
              onCompleted={onCompleted}
            />
          </BlurView>
        </Animated.View>
      </Modal>
    </>
  );
}

/* ===================== SHEET CONTENT ===================== */

type SheetContentProps = {
  onClose: () => void;
  onCompleted?: () => void;
};

function ReservationSheetContent({ onClose, onCompleted }: SheetContentProps) {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const router = useRouter();

  // ---- WEB LOGIC PORTED HERE ----
  const [offices, setOffices] = useState<Office[]>([]);
  const [type, setTypes] = useState<Type[]>([]);

  const [selectedOffice, setSelectedOffice] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  const [pickupDate, setPickupDate] = useState<Date | null>(new Date());
  const [pickupTime, setPickupTime] = useState<string>("");
  const [returnDate, setReturnDate] = useState<Date | null>(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [returnTime, setReturnTime] = useState<string>("");

  const [driverAge, setDriverAge] = useState("");

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [pickerField, setPickerField] = useState<PickerField>(null);
  const [pickerMode] = useState<"date" | "time">("date");
  const isPickerVisible = pickerField !== null;

  const [officeModalVisible, setOfficeModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeModalField, setTimeModalField] = useState<
    "pickupTime" | "returnTime" | null
  >(null);
  const [dateRangeModalVisible, setDateRangeModalVisible] = useState(false);
  const [selectingDate, setSelectingDate] = useState<"pickup" | "return">(
    "pickup"
  );
  const [tempPickupDate, setTempPickupDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reservedSlots, setReservedSlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vansModalVisible, setVansModalVisible] = useState(false);
  const [availableVans, setAvailableVans] = useState<any[]>([]);
  const [loadingVans, setLoadingVans] = useState(false);

  // Fetch offices & types + restore saved form
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [offData, typeData] = await Promise.all([
          officeService.getAll(),
          typeService.getAll(),
        ]);
        setOffices(offData.data || []);
        setTypes(typeData || []);

        // Restore saved form data if exists
        const savedForm = await AsyncStorage.getItem("pendingReservationForm");
        if (savedForm) {
          const data = JSON.parse(savedForm);
          setSelectedOffice(data.office || "");
          setSelectedType(data.type || "");
          setPickupDate(
            data.pickupDate ? new Date(data.pickupDate) : new Date()
          );
          setPickupTime(data.pickupTime || "");
          setReturnDate(
            data.returnDate
              ? new Date(data.returnDate)
              : new Date(Date.now() + 24 * 60 * 60 * 1000)
          );
          setReturnTime(data.returnTime || "");
          setDriverAge(data.driverAge || "");
          await AsyncStorage.removeItem("pendingReservationForm");
        }
      } catch (error) {
        console.log("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch reserved slots when office and dates change
  useEffect(() => {
    const fetchReservedSlots = async () => {
      if (!selectedOffice || !timeModalVisible) return;

      const targetDate =
        timeModalField === "returnTime" ? returnDate : pickupDate;
      if (!targetDate) return;

      try {
        const startDateStr = targetDate.toISOString().split("T")[0];
        const endDateStr = targetDate.toISOString().split("T")[0];
        const baseUrl =
          process.env.EXPO_PUBLIC_RESERVATIONS_BY_OFFICE_API || "";
        const url = `${baseUrl}?office=${selectedOffice}&startDate=${startDateStr}&endDate=${endDateStr}`;

        console.log("[Fetching Reserved Slots] URL:", url);

        const response = await fetch(url);
        const data = await response.json();

        console.log("[Reserved Slots API Response]", data);

        if (data.success && data.data?.reservedSlots) {
          console.log("[Reserved Slots]", data.data.reservedSlots);
          setReservedSlots(data.data.reservedSlots);
        } else if (data.success && data.reservedSlots) {
          console.log("[Reserved Slots]", data.reservedSlots);
          setReservedSlots(data.reservedSlots);
        } else {
          console.log("[Reserved Slots] No slots found");
          setReservedSlots([]);
        }
      } catch (error) {
        console.log("Failed to fetch reserved slots:", error);
        setReservedSlots([]);
      }
    };

    fetchReservedSlots();
  }, [
    selectedOffice,
    pickupDate,
    returnDate,
    timeModalField,
    timeModalVisible,
  ]);

  const getSelectedOffice = (): Office | undefined =>
    offices.find((o) => o._id === selectedOffice);

  // ---- DATE/TIME HELPERS (ported from web) ----

  const isDateDisabled = (date: Date) => {
    const office = getSelectedOffice();
    if (!office) return false;

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];

    const specialDay = office.specialDays?.find(
      (sd) => sd.month === month && sd.day === day
    );
    if (specialDay && !specialDay.isOpen) return true;

    const workingDay = office.workingTime?.find((w) => w.day === dayName);
    if (workingDay && !workingDay.isOpen) return true;

    return false;
  };

  const getAvailableTimeSlots = (
    date: Date | null,
    isPickup: boolean = true
  ) => {
    const office = getSelectedOffice();
    if (!office || !date)
      return {
        start: "00:00",
        end: "23:59",
        normalStart: "00:00",
        normalEnd: "23:59",
      };

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];

    const specialDay = office.specialDays?.find(
      (sd) => sd.month === month && sd.day === day
    );
    if (specialDay && specialDay.isOpen) {
      return {
        start: specialDay.startTime || "00:00",
        end: specialDay.endTime || "23:59",
        normalStart: specialDay.startTime || "00:00",
        normalEnd: specialDay.endTime || "23:59",
      };
    }

    const workingDay = office.workingTime?.find((w) => w.day === dayName);
    if (workingDay && workingDay.isOpen) {
      let start = workingDay.startTime || "00:00";
      let end = workingDay.endTime || "23:59";
      const normalStart = start;
      const normalEnd = end;

      const extension = isPickup
        ? workingDay.pickupExtension
        : workingDay.returnExtension;
      if (extension) {
        const [startH, startM] = start.split(":").map(Number);
        const [endH, endM] = end.split(":").map(Number);
        const extendedStartMin = Math.max(
          0,
          startH * 60 + startM - extension.hoursBefore * 60
        );
        const extendedEndMin = Math.min(
          1439,
          endH * 60 + endM + extension.hoursAfter * 60
        );
        start = `${Math.floor(extendedStartMin / 60)
          .toString()
          .padStart(2, "0")}:${(extendedStartMin % 60)
          .toString()
          .padStart(2, "0")}`;
        end = `${Math.floor(extendedEndMin / 60)
          .toString()
          .padStart(2, "0")}:${(extendedEndMin % 60)
          .toString()
          .padStart(2, "0")}`;
      }

      return { start, end, normalStart, normalEnd };
    }

    return {
      start: "00:00",
      end: "23:59",
      normalStart: "00:00",
      normalEnd: "23:59",
    };
  };

  // ---- FORMATTERS ----

  const formatDate = (date: Date | null) => {
    if (!date) return "DD/MM/YYYY";
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear().toString();
    return `${d}/${m}/${y}`;
  };

  const formatTime = (time: string | null) => time || "HH:MM";

  const generateTimeSlots = (startTime: string, endTime: string) => {
    const slots: string[] = [];
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      slots.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      );
      currentMinutes += 15;
    }

    return slots;
  };

  const openDateRangePicker = () => {
    if (!selectedOffice) {
      Alert.alert("Select Office", "Please select an office first.");
      return;
    }
    setSelectingDate("pickup");
    setTempPickupDate(null);
    setDateRangeModalVisible(true);
  };

  const selectDate = (date: Date) => {
    if (isDateDisabled(date)) {
      Alert.alert("Office Closed", "This date is not available.");
      return;
    }

    Haptics.selectionAsync();
    if (selectingDate === "pickup") {
      setTempPickupDate(date);
      setPickupDate(date);
      setReturnDate(null);
      setSelectingDate("return");
    } else {
      const baseDate = tempPickupDate || pickupDate;
      if (baseDate && date < baseDate) {
        Alert.alert("Invalid Date", "Return date must be after pickup date.");
        return;
      }
      setReturnDate(date);
      setDateRangeModalVisible(false);
      setSelectingDate("pickup");
      setTempPickupDate(null);
    }
  };

  const openTimeModal = (field: "pickupTime" | "returnTime") => {
    if (!selectedOffice) {
      Alert.alert("Select Office", "Please select an office first.");
      return;
    }
    Haptics.selectionAsync();
    setTimeModalField(field);
    setTimeModalVisible(true);
  };

  const selectTime = (time: string) => {
    console.log("[selectTime] Called with:", {
      time,
      timeModalField,
      timeType: typeof time,
    });

    if (timeModalField === "pickupTime") {
      console.log("[selectTime] Setting pickupTime to:", time);
      setPickupTime(time);
    } else if (timeModalField === "returnTime") {
      console.log("[selectTime] Setting returnTime to:", time);

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
            "Minimum rental period is 6 hours. Please select a later return time or date."
          );
          return;
        }
      }

      setReturnTime(time);
    }

    setTimeModalVisible(false);
    setTimeModalField(null);
  };

  const hidePicker = () => setPickerField(null);

  const handleConfirm = (date: Date) => {
    if (pickerMode === "date" && isDateDisabled(date)) {
      Alert.alert(
        "Office Closed",
        "The selected date is not available for this office."
      );
      hidePicker();
      return;
    }

    switch (pickerField) {
      case "pickupDate":
        setPickupDate(date);
        break;
      case "returnDate":
        setReturnDate(date);
        break;
    }
    hidePicker();
  };

  // ---- FORM ----

  const handleFocus = (inputName: string) => {
    Haptics.selectionAsync();
    setFocusedInput(inputName);
  };

  const handleBlur = () => setFocusedInput(null);

  const handleSubmit = async () => {
    if (!selectedOffice || !selectedType) {
      Alert.alert("Missing details", "Please select office and category.");
      return;
    }
    if (!pickupDate || !returnDate) {
      Alert.alert("Missing dates", "Please choose pickup and return dates.");
      return;
    }
    const age = Number(driverAge);
    if (!driverAge || age < 25 || age > 70) {
      Alert.alert("Driver age", "Driver age must be between 25 and 70.");
      return;
    }

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

    // Check if user is logged in
    if (!user) {
      await AsyncStorage.setItem(
        "pendingReservationForm",
        JSON.stringify({
          office: selectedOffice,
          type: selectedType,
          pickupDate: pickupDate.toISOString(),
          returnDate: returnDate.toISOString(),
          pickupTime,
          returnTime,
          driverAge,
        })
      );

      Alert.alert(
        "Login Required",
        "Please login or register to continue with your reservation.",
        [
          {
            text: "Login",
            onPress: () => {
              onClose();
              router.push("/register");
            },
          },
          {
            text: "Register",
            onPress: () => {
              onClose();
              router.push("/register");
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    setIsSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const officeObj = getSelectedOffice();

    const [pickupHour, pickupMinute] = pickupTime.split(":").map(Number);
    const [returnHour, returnMinute] = returnTime.split(":").map(Number);

    const startDateTime = new Date(pickupDate);
    startDateTime.setHours(pickupHour, pickupMinute, 0, 0);

    const endDateTime = new Date(returnDate);
    endDateTime.setHours(returnHour, returnMinute, 0, 0);

    // Calculate extension fees
    let pickupExtensionFee = 0;
    let returnExtensionFee = 0;

    if (pickupDate && pickupTime) {
      const dayName = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][pickupDate.getDay()];
      const workingDay = officeObj?.workingTime?.find(
        (w: any) => w.day === dayName
      );
      if (workingDay?.pickupExtension) {
        const slots = getAvailableTimeSlots(pickupDate, true);
        const isExtension =
          pickupTime < slots.normalStart || pickupTime > slots.normalEnd;
        if (isExtension) {
          pickupExtensionFee = workingDay.pickupExtension.flatPrice;
        }
      }
    }

    if (returnDate && returnTime) {
      const dayName = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][returnDate.getDay()];
      const workingDay = officeObj?.workingTime?.find(
        (w: any) => w.day === dayName
      );
      if (workingDay?.returnExtension) {
        const slots = getAvailableTimeSlots(returnDate, false);
        const isExtension =
          returnTime < slots.normalStart || returnTime > slots.normalEnd;
        if (isExtension) {
          returnExtensionFee = workingDay.returnExtension.flatPrice;
        }
      }
    }

    const reservationPayload = {
      office: selectedOffice,
      officeName: officeObj?.name ?? "",
      type: selectedType,
      pickupDate: startDateTime.toISOString(),
      returnDate: endDateTime.toISOString(),
      pickupTime: pickupTime,
      returnTime: returnTime,
      driverAge,
      pickupExtensionFee,
      returnExtensionFee,
    };

    console.log("Reservation payload (mobile):", reservationPayload);

    // try {
    //   const { sound } = await Audio.Sound.createAsync(
    //     require("@/assets/sounds/Iphone.mp3")
    //   );
    //   await sound.playAsync();
    //   setTimeout(() => sound.unloadAsync(), 3000);
    // } catch (error) {
    //   console.log("Sound error:", error);
    // }

    setIsSubmitting(false);
    setLoadingVans(true);

    try {
      const [officeResponse, categoriesResponse] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_OFFICES_API}/${selectedOffice}`),
        fetch(process.env.EXPO_PUBLIC_CATEGORIES_API || ""),
      ]);

      const [officeData, categoriesData] = await Promise.all([
        officeResponse.json(),
        categoriesResponse.json(),
      ]);

      if (
        officeData.success &&
        officeData.data?.categories &&
        categoriesData.success &&
        categoriesData.data
      ) {
        const officeCategoryIds = officeData.data.categories;

        const filteredVans = categoriesData.data
          .filter((cat: Category) => {
            const matchesOffice = officeCategoryIds.includes(cat._id);
            const matchesType =
              cat.type._id === selectedType || cat.type?._id === selectedType;

            return matchesOffice && matchesType;
          })
          .map((cat: Category) => ({
            id: cat._id,
            name: cat.name,
            image: cat.image || require("@/assets/images/van.png"),
            seats: cat.seats || 2,
            fuel: cat.fuel || "Diesel",
            doors: cat.doors || 2,
            gear: cat.gear || "manual",
            showPrice: cat.showPrice || 0,
            pricingTiers: cat.pricingTiers || [],
            extraHoursRate: cat.extrahoursRate || 0,
            cargo: cat.expert || "",
          }));

        setAvailableVans(filteredVans);
      }
    } catch (error) {
      console.log("Failed to load vans:", error);
    } finally {
      setLoadingVans(false);
      setVansModalVisible(true);
    }
  };

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof Ionicons.glyphMap,
    inputName: string,
    keyboardType: "default" | "numeric" = "default"
  ) => {
    const isFocused = focusedInput === inputName;
    return (
      <View style={sheetStyles.inputGroup}>
        <View
          style={[
            sheetStyles.inputWrapper,
            isFocused && sheetStyles.inputWrapperFocused,
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={isFocused ? ACCENT : "rgba(255,255,255,0.4)"}
            style={sheetStyles.inputIcon}
          />
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={value}
            onChangeText={onChangeText}
            onFocus={() => handleFocus(inputName)}
            onBlur={handleBlur}
            style={sheetStyles.input}
            keyboardType={keyboardType}
          />
        </View>
      </View>
    );
  };

  const pickupSlots = getAvailableTimeSlots(pickupDate);
  const returnSlots = getAvailableTimeSlots(returnDate);

  const getMinMaxTime = () => {
    if (pickerMode !== "time") return {};
    const slots =
      pickerField === "pickupTime" || pickerField === "returnTime"
        ? pickerField === "pickupTime"
          ? pickupSlots
          : returnSlots
        : { start: "00:00", end: "23:59" };

    const [startH, startM] = slots.start.split(":").map(Number);
    const [endH, endM] = slots.end.split(":").map(Number);

    const minTime = new Date();
    minTime.setHours(startH, startM, 0, 0);

    const maxTime = new Date();
    maxTime.setHours(endH, endM, 0, 0);

    return { minimumDate: minTime, maximumDate: maxTime };
  };

  return (
    <>
      {/* DATE / TIME PICKER MODAL */}
      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode={pickerMode}
        onConfirm={handleConfirm}
        onCancel={hidePicker}
        is24Hour={true}
        display="spinner"
        themeVariant={colorScheme === "dark" ? "dark" : "light"}
        accentColor={ACCENT}
        textColor={colorScheme === "dark" ? "#fff" : DARK}
        minimumDate={
          pickerMode === "date" ? new Date() : getMinMaxTime().minimumDate
        }
        maximumDate={getMinMaxTime().maximumDate}
      />

      {/* Office selection modal */}
      <Modal
        visible={officeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOfficeModalVisible(false)}
      >
        <Pressable
          style={sheetStyles.selectOverlay}
          onPress={() => setOfficeModalVisible(false)}
        >
          <View style={sheetStyles.selectBox}>
            <Text style={sheetStyles.selectTitle}>Select Office</Text>
            <ScrollView>
              {isLoading ? (
                <View
                  style={{
                    padding: 40,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator size="large" color={ACCENT} />
                </View>
              ) : offices.length === 0 ? (
                <View
                  style={{
                    padding: 40,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="business-outline" size={48} color="#4b5563" />
                  <Text
                    style={{
                      color: "#9ca3af",
                      fontSize: 14,
                      marginTop: 12,
                      textAlign: "center",
                    }}
                  >
                    No offices available
                  </Text>
                </View>
              ) : (
                offices.map((o) => (
                  <Pressable
                    key={o._id}
                    onPress={() => {
                      setSelectedOffice(o._id);
                      setOfficeModalVisible(false);
                    }}
                    style={({ pressed }) => [
                      sheetStyles.selectItem,
                      selectedOffice === o._id && sheetStyles.selectItemActive,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={sheetStyles.selectItemText}>{o.name}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Category selection modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <Pressable
          style={sheetStyles.selectOverlay}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={sheetStyles.selectBox}>
            <Text style={sheetStyles.selectTitle}>Select Vehicle Category</Text>
            <ScrollView>
              {isLoading ? (
                <View
                  style={{
                    padding: 40,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator size="large" color={ACCENT} />
                </View>
              ) : type.length === 0 ? (
                <View
                  style={{
                    padding: 40,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="car-sport-outline"
                    size={48}
                    color="#4b5563"
                  />
                  <Text
                    style={{
                      color: "#9ca3af",
                      fontSize: 14,
                      marginTop: 12,
                      textAlign: "center",
                    }}
                  >
                    No vehicle types available
                  </Text>
                </View>
              ) : (
                type.map((c) => (
                  <Pressable
                    key={c._id}
                    onPress={() => {
                      setSelectedType(c._id ?? "");
                      setCategoryModalVisible(false);
                    }}
                    style={({ pressed }) => [
                      sheetStyles.selectItem,
                      selectedType === c._id && sheetStyles.selectItemActive,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={sheetStyles.selectItemText}>{c.name}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Date Range Picker Modal */}
      <Modal
        visible={dateRangeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setDateRangeModalVisible(false);
          setSelectingDate("pickup");
        }}
      >
        <Pressable
          style={sheetStyles.selectOverlay}
          onPress={() => {
            setDateRangeModalVisible(false);
            setSelectingDate("pickup");
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={sheetStyles.calendarModalBox}
          >
            <View style={sheetStyles.timeModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.selectTitle}>
                  {selectingDate === "pickup"
                    ? "📅 Pickup Date"
                    : "📅 Return Date"}
                </Text>
                <Text style={{ color: "#9ca3af", fontSize: 11, marginTop: 4 }}>
                  {selectingDate === "pickup"
                    ? pickupDate
                      ? `Selected: ${formatDate(pickupDate)}`
                      : "Choose your pickup date"
                    : returnDate
                    ? `Selected: ${formatDate(returnDate)}`
                    : "Choose your return date"}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setDateRangeModalVisible(false);
                  setSelectingDate("pickup");
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={20} color="#e5e7eb" />
              </Pressable>
            </View>
            <Calendar
              minDate={
                selectingDate === "pickup"
                  ? new Date().toISOString().split("T")[0]
                  : pickupDate?.toISOString().split("T")[0]
              }
              maxDate={
                selectingDate === "return" && pickupDate
                  ? (() => {
                      const maxDate = new Date(pickupDate);
                      maxDate.setDate(maxDate.getDate() + 30);
                      return maxDate.toISOString().split("T")[0];
                    })()
                  : undefined
              }
              onDayPress={(day) => selectDate(new Date(day.timestamp))}
              markedDates={(() => {
                const marked: any = {};
                const office = getSelectedOffice();
                const currentPickup = tempPickupDate || pickupDate;

                // Mark range between pickup and return
                if (currentPickup && returnDate && selectingDate === "pickup") {
                  const start = new Date(currentPickup);
                  const end = new Date(returnDate);
                  const current = new Date(start);

                  while (current <= end) {
                    const dateStr = current.toISOString().split("T")[0];
                    const isStart = current.getTime() === start.getTime();
                    const isEnd = current.getTime() === end.getTime();

                    marked[dateStr] = {
                      color: isStart || isEnd ? ACCENT : "rgba(254,154,0,0.3)",
                      textColor: isStart || isEnd ? "#fff" : "#f9fafb",
                      startingDay: isStart,
                      endingDay: isEnd,
                    };

                    current.setDate(current.getDate() + 1);
                  }
                } else if (currentPickup) {
                  const pickupStr = currentPickup.toISOString().split("T")[0];
                  marked[pickupStr] = {
                    selected: true,
                    selectedColor: ACCENT,
                    selectedTextColor: "#ffffff",
                  };
                }

                // Mark disabled dates
                if (office) {
                  const today = new Date();
                  for (let i = 0; i < 60; i++) {
                    const checkDate = new Date(today);
                    checkDate.setDate(today.getDate() + i);

                    if (isDateDisabled(checkDate)) {
                      const dateStr = checkDate.toISOString().split("T")[0];
                      marked[dateStr] = {
                        disabled: true,
                        disableTouchEvent: true,
                      };
                    }
                  }
                }

                return marked;
              })()}
              markingType="period"
              theme={{
                calendarBackground: "transparent",
                textSectionTitleColor: "#9ca3af",
                selectedDayBackgroundColor: ACCENT,
                selectedDayTextColor: ACCENT,

                todayTextColor: "#06cb48ff",
                dayTextColor: "#f9fafb",
                textDisabledColor: "#4b5563",
                monthTextColor: "#f9fafb",
                arrowColor: ACCENT,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Time selection modal */}
      <Modal
        visible={timeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <Pressable
          style={sheetStyles.selectOverlay}
          onPress={() => setTimeModalVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={sheetStyles.timeModalBox}
          >
            <View style={sheetStyles.timeModalHeader}>
              <View>
                <Text style={sheetStyles.selectTitle}>
                  {timeModalField === "pickupTime" ? "Pickup" : "Return"} Time
                </Text>
                <Text style={{ color: "#9ca3af", fontSize: 11, marginTop: 2 }}>
                  Select a time slot
                </Text>
              </View>
              <Pressable
                onPress={() => setTimeModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={20} color="#e5e7eb" />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 10 }}
              style={{ maxHeight: height * 0.6 }}
            >
              {(() => {
                if (isLoading) {
                  return (
                    <View
                      style={{
                        padding: 40,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ActivityIndicator size="large" color={ACCENT} />
                    </View>
                  );
                }

                const isPickup = timeModalField === "pickupTime";
                const dateToCheck = isPickup ? pickupDate : returnDate;
                const slots = getAvailableTimeSlots(dateToCheck, isPickup);
                const timeSlots = generateTimeSlots(slots.start, slots.end);
                const selectedTime = formatTime(
                  isPickup ? pickupTime : returnTime
                );

                const office = getSelectedOffice();
                const dayName = dateToCheck
                  ? [
                      "sunday",
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                    ][dateToCheck.getDay()]
                  : "";
                const workingDay = office?.workingTime?.find(
                  (w: any) => w.day === dayName
                );
                const extension = isPickup
                  ? workingDay?.pickupExtension
                  : workingDay?.returnExtension;
                const is24Hours = slots.normalStart === slots.normalEnd;

                return (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 2,
                      }}
                    >
                      {timeSlots.map((time) => {
                        const isSelected = time === selectedTime;
                        const isReserved = reservedSlots.some((slot) => {
                          return time >= slot.startTime && time < slot.endTime;
                        });
                        const isAvailable = !isReserved;
                        const isExtension =
                          is24Hours ||
                          time < slots.normalStart ||
                          time > slots.normalEnd;
                        const extensionPrice =
                          isExtension && extension ? extension.flatPrice : 0;

                        return (
                          <View
                            key={time}
                            style={{ width: "31%", marginBottom: 10 }}
                          >
                            <Pressable
                              disabled={!isAvailable}
                              onPress={() => {
                                if (isAvailable) {
                                  Haptics.selectionAsync();
                                  selectTime(time);
                                }
                              }}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                 paddingVertical: 12,
                            paddingHorizontal: 10,
                            borderRadius: 12,
                                backgroundColor: isSelected
                                  ? ACCENT
                                  : "rgba(255,255,255,0.05)",
                                borderWidth: 1.5,
                                borderColor: isSelected
                                  ? ACCENT
                                  : "rgba(255,255,255,0.1)",
                                opacity: isAvailable ? 1 : 0.4,
                              }}
                            >
                              <View
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: isAvailable
                                    ? isExtension
                                      ? "#fbbf24"
                                      : "#22c55e"
                                    : "#ef4444",
                                }}
                              />
                              <Text
                                style={{
                                  color: isSelected ? DARK : "#e5e7eb",
                                  fontSize: 12,
                                  fontWeight: "700",
                                }}
                              >
                                {time}
                              </Text>
                            </Pressable>
                            {isExtension && extensionPrice > 0 && (
                              <Text
                                style={{
                                  fontSize: 9,
                                  color: isSelected ? "#fff" : "#fbbf24",
                                  textAlign: "center",
                                  marginTop: 2,
                                }}
                              >
                                +£{extensionPrice}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </>
                );
              })()}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={sheetStyles.container}
        >
          {/* Header */}
          <View style={sheetStyles.headerRow}>
            <View>
              <Text style={sheetStyles.sheetTitle}>Quick Reservation</Text>
              <Text style={sheetStyles.sheetSubtitle}>
                Just a few details to get started
              </Text>
            </View>
            <Pressable onPress={onClose} style={sheetStyles.closeBtn}>
              <Ionicons name="close" size={22} color="#e5e7eb" />
            </Pressable>
          </View>

          {/* Voice + AI button (kept) */}
          <VoiceAIButton />

          {/* Office + Category */}
          <View style={[sheetStyles.section, { marginTop: 4 }]}>
            <View style={sheetStyles.row}>
              <View style={sheetStyles.half}>
                <Text style={sheetStyles.sectionLabel}>Office</Text>
                <Pressable
                  onPress={() => setOfficeModalVisible(true)}
                  style={({ pressed }) => [
                    sheetStyles.inputWrapper,
                    pressed && sheetStyles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={selectedOffice ? ACCENT : "rgba(255,255,255,0.4)"}
                    style={sheetStyles.inputIcon}
                  />
                  <Text
                    style={[
                      sheetStyles.input,
                      !selectedOffice && {
                        color: "rgba(255,255,255,0.35)",
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {selectedOffice
                      ? getSelectedOffice()?.name ?? "Selected office"
                      : "Select office"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="rgba(255,255,255,0.5)"
                  />
                </Pressable>
              </View>

              <View style={sheetStyles.half}>
                <Text style={sheetStyles.sectionLabel}>Type</Text>
                <Pressable
                  onPress={() => setCategoryModalVisible(true)}
                  style={({ pressed }) => [
                    sheetStyles.inputWrapper,
                    pressed && sheetStyles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="car-sharp"
                    size={18}
                    color={selectedType ? ACCENT : "rgba(255,255,255,0.4)"}
                    style={sheetStyles.inputIcon}
                  />
                  <Text
                    style={[
                      sheetStyles.input,
                      !selectedType && {
                        color: "rgba(255,255,255,0.35)",
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {selectedType
                      ? type.find((c) => c._id === selectedType)?.name ??
                        "Selected type"
                      : "Select type"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="rgba(255,255,255,0.5)"
                  />
                </Pressable>
              </View>
            </View>
          </View>

          {/* DATE RANGE */}
          <View style={sheetStyles.section}>
            <Text style={sheetStyles.sectionLabel}>Rental Period</Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                openDateRangePicker();
              }}
              style={({ pressed }) => [
                sheetStyles.dateRangeButton,
                pressed && sheetStyles.inputWrapperFocused,
              ]}
            >
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Ionicons name="calendar" size={16} color={ACCENT} />
                  <Text
                    style={{
                      color: "#9ca3af",
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    PICKUP
                  </Text>
                </View>
                <Text
                  style={{ color: "#f9fafb", fontSize: 15, fontWeight: "700" }}
                >
                  {formatDate(pickupDate)}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={ACCENT} />
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Ionicons name="calendar" size={16} color={ACCENT} />
                  <Text
                    style={{
                      color: "#9ca3af",
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    RETURN
                  </Text>
                </View>
                <Text
                  style={{ color: "#f9fafb", fontSize: 15, fontWeight: "700" }}
                >
                  {formatDate(returnDate)}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* TIME SELECTION */}
          <View style={sheetStyles.section}>
            <Text style={sheetStyles.sectionLabel}>Time</Text>
            <View style={sheetStyles.row}>
              <View style={sheetStyles.half}>
                <Text style={[sheetStyles.sectionLabel, { marginBottom: 8 }]}>
                  Pickup
                </Text>
                <Pressable
                  onPress={() => openTimeModal("pickupTime")}
                  style={({ pressed }) => [
                    sheetStyles.inputWrapper,
                    pressed && sheetStyles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={pickupTime ? ACCENT : "rgba(255,255,255,0.4)"}
                    style={sheetStyles.inputIcon}
                  />
                  <Text
                    style={[
                      sheetStyles.input,
                      !pickupTime && { color: "rgba(255,255,255,0.35)" },
                    ]}
                  >
                    {formatTime(pickupTime)}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="rgba(255,255,255,0.5)"
                  />
                </Pressable>
              </View>
              <View style={sheetStyles.half}>
                <Text style={[sheetStyles.sectionLabel, { marginBottom: 8 }]}>
                  Return
                </Text>
                <Pressable
                  onPress={() => openTimeModal("returnTime")}
                  style={({ pressed }) => [
                    sheetStyles.inputWrapper,
                    pressed && sheetStyles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={returnTime ? ACCENT : "rgba(255,255,255,0.4)"}
                    style={sheetStyles.inputIcon}
                  />
                  <Text
                    style={[
                      sheetStyles.input,
                      !returnTime && { color: "rgba(255,255,255,0.35)" },
                    ]}
                  >
                    {formatTime(returnTime)}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="rgba(255,255,255,0.5)"
                  />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Driver age & message */}
          <View style={sheetStyles.row}>
            <View style={sheetStyles.half}>
              {renderInput(
                "Driver age (25-70)",
                driverAge,
                setDriverAge,
                "person-outline",
                "driverAge",
                "numeric"
              )}
            </View>
          </View>

          {/* SUBMIT */}
          <View style={sheetStyles.buttonsRow}>
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting || loadingVans}
              style={({ pressed }) => [
                sheetStyles.submitButton,
                pressed && sheetStyles.submitButtonPressed,
                (isSubmitting || loadingVans) && { opacity: 0.7 },
              ]}
            >
              <LinearGradient
                colors={[ACCENT, "#ff8c00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={sheetStyles.submitGradient}
              >
                {loadingVans ? (
                  <>
                    <ActivityIndicator size="small" color={DARK} />
                    <Text style={sheetStyles.submitText}>Loading Vans...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={DARK} />
                    <Text style={sheetStyles.submitText}>
                      {isSubmitting ? "Validating..." : "Confirm Reservation"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Vans Modal */}
      <VansModal
        visible={vansModalVisible}
        vans={availableVans}
        loading={loadingVans}
        onClose={() => setVansModalVisible(false)}
        onEditForm={() => setVansModalVisible(false)}
        prefilledData={(() => {
          let pickupExtensionFee = 0;
          let returnExtensionFee = 0;
          const officeObj = getSelectedOffice();

          if (pickupDate && pickupTime && officeObj) {
            const dayName = [
              "sunday",
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ][pickupDate.getDay()];
            const workingDay = officeObj.workingTime?.find(
              (w: any) => w.day === dayName
            );
            if (workingDay?.pickupExtension) {
              const slots = getAvailableTimeSlots(pickupDate, true);
              const isExtension =
                pickupTime < slots.normalStart || pickupTime > slots.normalEnd;
              if (isExtension) {
                pickupExtensionFee = workingDay.pickupExtension.flatPrice;
              }
            }
          }

          if (returnDate && returnTime && officeObj) {
            const dayName = [
              "sunday",
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ][returnDate.getDay()];
            const workingDay = officeObj.workingTime?.find(
              (w: any) => w.day === dayName
            );
            if (workingDay?.returnExtension) {
              const slots = getAvailableTimeSlots(returnDate, false);
              const isExtension =
                returnTime < slots.normalStart || returnTime > slots.normalEnd;
              if (isExtension) {
                returnExtensionFee = workingDay.returnExtension.flatPrice;
              }
            }
          }

          return {
            office: selectedOffice,
            category: selectedType,
            pickupDate: pickupDate?.toISOString() || "",
            returnDate: returnDate?.toISOString() || "",
            pickupTime,
            returnTime,
            driverAge,
            pickupExtensionFee,
            returnExtensionFee,
          };
        })()}
        onReservationComplete={onClose}
      />
    </>
  );
}

/* ===================== VOICE + AI BUTTON (same idea) ===================== */

function VoiceAIButton() {
  const [recording, setRecording] = useState(false);
  const bars = [0, 1, 2, 3, 4, 5];
  const barAnims = useRef(bars.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (recording) {
      barAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 260 + index * 60,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 260 + index * 60,
              useNativeDriver: false,
            }),
          ])
        ).start();
      });
    } else {
      barAnims.forEach((anim) => {
        anim.stopAnimation(() => {
          anim.setValue(0);
        });
      });
    }
  }, [recording]);

  const toggleRecording = async () => {
    await Haptics.impactAsync(
      recording
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    );
    setRecording((prev) => !prev);
  };

  return (
    <Pressable
      onPress={toggleRecording}
      style={({ pressed }) => [
        sheetStyles.voiceButton,
        pressed && { transform: [{ scale: 0.97 }] },
        recording && sheetStyles.voiceButtonActive,
      ]}
    >
      <View style={sheetStyles.voiceLeft}>
        <View style={sheetStyles.voiceIconWrapper}>
          <Ionicons
            name={recording ? "stop-circle" : "mic-circle-outline"}
            size={26}
            color={DARK}
          />
        </View>
        <View>
          <Text style={sheetStyles.voiceTitle}>
            {recording ? "Listening..." : "Fill with Voice + AI"}
          </Text>
          <Text style={sheetStyles.voiceSubtitle}>
            Just tell us pickup, return & vehicle
          </Text>
        </View>
      </View>

      <View style={sheetStyles.waveWrapper}>
        {bars.map((_, index) => {
          const h = barAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [4, 18],
          });
          return (
            <Animated.View
              key={index}
              style={[
                sheetStyles.waveBar,
                {
                  height: h,
                  opacity: recording ? 1 : 0.4,
                },
              ]}
            />
          );
        })}
      </View>
    </Pressable>
  );
}

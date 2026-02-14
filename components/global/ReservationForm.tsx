// components/ReservationForm.tsx
import { useAlert } from "@/components/global/CustomAlert";
import { useAuth } from "@/contexts/AuthContext";
import { officeService } from "@/services/officeService";
import { typeService } from "@/services/typeService";
import { Category, Type, Office, WorkingTime } from "@/types/type";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { Calendar } from "react-native-calendars";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import VansModal from "./VansModal";
import { sheetStyles, styles } from "./styleForm";

const ACCENT = "#fe9a00";
const DARK = "#0f172a";
const { height } = Dimensions.get("window");

const getLondonTime = (): Date => {
  const now = new Date();
  const londonStr = now.toLocaleString("en-US", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const [datePart, timePart] = londonStr.split(", ");
  if (!datePart || !timePart) {
    console.log("Failed to split London time string");
    return new Date();
  }
  const [monthStr, dayStr, yearStr] = datePart.split("/");
  const [hourStr, minuteStr, secondStr] = timePart.split(":");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const second = parseInt(secondStr, 10);
  const londonDate = new Date(Date.UTC(year, month, day, hour, minute, second));
  return londonDate;
};

type PickerField =
  | "pickupDate"
  | "pickupTime"
  | "returnDate"
  | "returnTime"
  | null;

type ReservationFormProps = {
  onCompleted?: () => void;
};

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
    }),
  ).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shineAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }),
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
              isSheetOpen={sheetVisible}
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
  isSheetOpen?: boolean;
};

function ReservationSheetContent({
  onClose,
  onCompleted,
  isSheetOpen = false,
}: SheetContentProps) {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();

  // Inline alert shown inside the sheet to avoid being occluded by the sheet's Modal
  const [inlineAlertVisible, setInlineAlertVisible] = useState(false);
  const [inlinePayload, setInlinePayload] = useState<{
    title?: string;
    message?: string;
  }>({});

  const showEitherAlert = (title?: string, message?: string) => {
    if (isSheetOpen) {
      setInlinePayload({ title: title || "", message: message || "" });
      setInlineAlertVisible(true);
    } else {
      showAlert(title, message);
    }
  };

  const hideInlineAlert = () => setInlineAlertVisible(false);

  // ---- WEB LOGIC PORTED HERE ----
  const [offices, setOffices] = useState<Office[]>([]);
  const [type, setTypes] = useState<Type[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<Type[]>([]);

  const [selectedOffice, setSelectedOffice] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  const [pickupDate, setPickupDate] = useState<Date | null>(new Date());
  const [pickupTime, setPickupTime] = useState<string>("");
  const [returnDate, setReturnDate] = useState<Date | null>(
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  );
  const [returnTime, setReturnTime] = useState<string>("");

  const [driverAge, setDriverAge] = useState("");

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [pickerField, setPickerField] = useState<PickerField>(null);
  const [pickerMode] = useState<"date" | "time">("date");
  const isPickerVisible = pickerField !== null;
  const [dateRange, setDateRange] = useState<
    { startDate: Date; endDate: Date; key: string }[]
  >([]);

  const [officeModalVisible, setOfficeModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeModalField, setTimeModalField] = useState<
    "pickupTime" | "returnTime" | null
  >(null);
  const [dateRangeModalVisible, setDateRangeModalVisible] = useState(false);
  const [selectingDate, setSelectingDate] = useState<"pickup" | "return">(
    "pickup",
  );
  const [tempPickupDate, setTempPickupDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [startDateReservedSlots, setStartDateReservedSlots] = useState<
    {
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
      isSameDay: boolean;
    }[]
  >([]);
  const [endDateReservedSlots, setEndDateReservedSlots] = useState<
    {
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
      isSameDay: boolean;
    }[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vansModalVisible, setVansModalVisible] = useState(false);
  const [availableVans, setAvailableVans] = useState<
    {
      id: string;
      name: string;
      image: string;
      seats: number;
      fuel: string;
      expert: string;
      doors: number;
      gear?:
        | {
            availableTypes: ("manual" | "automatic")[];
            automaticExtraCost: number;
          }
        | string;
      showPrice?: number;
      pricingTiers?: {
        minDays: number;
        maxDays: number;
        pricePerDay: number;
      }[];
      extraHoursRate?: number;
      cargo?: string;
      selloffer?: number;
    }[]
  >([]);
  const [loadingVans, setLoadingVans] = useState(false);

  // Sync dateRange with pickupDate and returnDate
  useEffect(() => {
    if (pickupDate && returnDate) {
       setDateRange([
        {
          startDate: pickupDate,
          endDate: returnDate,
          key: "selection",
        },
      ]);
    } else if (pickupDate) {
       setDateRange([
        {
          startDate: pickupDate,
          endDate: pickupDate,
          key: "selection",
        },
      ]);
    }
  }, [pickupDate, returnDate]);

  // Fetch offices & types + restore saved form
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Examples: pass a query string or an object
        const [offData, typeData] = await Promise.all([
          officeService.getAll("?status=active"), // string query
          typeService.getAll("?status=active"), // object params
        ]);
        setOffices(offData.data || []);
        setTypes(typeData || []);
        setFilteredTypes(typeData || []);

        // Restore saved form data if exists
        const savedForm = await AsyncStorage.getItem("pendingReservationForm");
        if (savedForm) {
          const data = JSON.parse(savedForm);
          setSelectedOffice(data.office || "");
          setSelectedType(data.type || "");
          setPickupDate(
            data.pickupDate ? new Date(data.pickupDate) : new Date(),
          );
          setPickupTime(data.pickupTime || "");
          setReturnDate(
            data.returnDate
              ? new Date(data.returnDate)
              : new Date(Date.now() + 24 * 60 * 60 * 1000),
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

  // Filter types based on selected office
  useEffect(() => {
    if (selectedOffice) {
      const filtered = type.filter((t: Type) => {
        return (
          t.offices &&
          t.offices.some((office: Office) => {
            const officeId = typeof office === "string" ? office : office._id;
            return officeId === selectedOffice;
          })
        );
      });
      setFilteredTypes(filtered);
    } else {
      setFilteredTypes(type);
    }
  }, [selectedOffice, type]);

  // Fetch reserved slots when office and dates change
  useEffect(() => {
    if (selectedOffice && pickupDate) {
      const date = pickupDate;
      const startDateStr = date.toISOString().split("T")[0];
      setStartDateReservedSlots([]);

      const baseUrl =
        process.env.EXPO_PUBLIC_RESERVATIONS_BY_OFFICE_API ||
        "https://succesvan.vercel.app/api/reservations/by-office";

      fetch(
        `${baseUrl}?office=${selectedOffice}&startDate=${startDateStr}&type=start`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.reservedSlots) {
            // Only keep slots that START on this pickup date
            const filteredSlots = data.data.reservedSlots.filter(
              (slot: {
                startDate: string;
                endDate: string;
                startTime: string;
                endTime: string;
                isSameDay: boolean;
              }) => {
                return slot.startDate === startDateStr;
              },
            );
            console.log("[Start Date Filtered Slots]", filteredSlots);
            setStartDateReservedSlots(filteredSlots);
          }
        })
        .catch((err) => {
          console.log("Failed to fetch start date slots:", err);
          setStartDateReservedSlots([]);
        });
    }
  }, [selectedOffice, pickupDate]);

  useEffect(() => {
    if (selectedOffice && returnDate) {
      const date = returnDate;
      const endDateStr = date.toISOString().split("T")[0];
      setEndDateReservedSlots([]);

      const baseUrl =
        process.env.EXPO_PUBLIC_RESERVATIONS_BY_OFFICE_API ||
        "https://succesvan.vercel.app/api/reservations/by-office";

      fetch(
        `${baseUrl}?office=${selectedOffice}&endDate=${endDateStr}&type=end`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((res) => res.json())
        .then((data) => {
           if (data.data?.reservedSlots) {
            // Only keep slots that END on this return date
            const filteredSlots = data.data.reservedSlots.filter(
              (slot: {
                startDate: string;
                endDate: string;
                startTime: string;
                endTime: string;
                isSameDay: boolean;
              }) => {
                return slot.endDate === endDateStr;
              },
            );
             setEndDateReservedSlots(filteredSlots);
          }
        })
        .catch((err) => {
          console.log("Failed to fetch end date slots:", err);
          setEndDateReservedSlots([]);
        });
    }
  }, [selectedOffice, returnDate]);

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
      (sd) => sd.month === month && sd.day === day,
    );
    if (specialDay && !specialDay.isOpen) return true;

    const workingDay = office.workingTime?.find((w) => w.day === dayName);
    if (workingDay && !workingDay.isOpen) return true;

    return false;
  };

  const getAvailableTimeSlots = (
    date: Date | null,
    isPickup: boolean = true,
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
      (sd) => sd.month === month && sd.day === day,
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
          startH * 60 + startM - extension.hoursBefore * 60,
        );
        const extendedEndMin = Math.min(
          1439,
          endH * 60 + endM + extension.hoursAfter * 60,
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
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
      );
      currentMinutes += 15;
    }

    return slots;
  };

  const openDateRangePicker = () => {
    if (!selectedOffice) {
      showEitherAlert("Select Office", "Please select an office first.");
      return;
    }
    setSelectingDate("pickup");
    setTempPickupDate(null);
    setDateRangeModalVisible(true);
  };

  const selectDate = (date: Date) => {
   

    if (isDateDisabled(date)) {
      showEitherAlert("Office Closed", "This date is not available.");
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
        showEitherAlert(
          "Invalid Date",
          "Return date must be after pickup date.",
        );
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
      showEitherAlert("Select Office", "Please select an office first.");
      return;
    }
    Haptics.selectionAsync();
    setTimeModalField(field);
    setTimeModalVisible(true);
  };

  const selectTime = (time: string) => {
   

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
          showEitherAlert(
            "Minimum Rental Period",
            "Minimum rental period is 6 hours. Please select a later return time or date.",
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
      showEitherAlert(
        "Office Closed",
        "The selected date is not available for this office.",
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
      showEitherAlert("Missing details", "Please select office and category.");
      return;
    }
    if (!pickupDate || !returnDate) {
      showEitherAlert(
        "Missing dates",
        "Please choose pickup and return dates.",
      );
      return;
    }
    if (!pickupTime || !returnTime) {
      showEitherAlert(
        "Missing times",
        "Please choose pickup and return times.",
      );
      return;
    }
    const age = Number(driverAge);
    if (!driverAge || age < 23 || age > 80) {
      showEitherAlert("Driver age", "Driver age must be between 23 and 80.");
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
        showAlert(
          "Minimum Rental Period",
          "Minimum rental period is 6 hours. Please adjust your dates and times.",
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
          pickupDate: pickupDate?.toISOString(),
          returnDate: returnDate?.toISOString(),
          pickupTime,
          returnTime,
          driverAge,
        }),
      );
      setLoginModalVisible(true);
      return;
    }

    setIsSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const officeObj = getSelectedOffice();

    const [pickupHour, pickupMinute] = pickupTime.split(":").map(Number);
    const [returnHour, returnMinute] = returnTime.split(":").map(Number);

    const startDateTime = new Date(pickupDate || new Date());
    startDateTime.setHours(pickupHour, pickupMinute, 0, 0);

    const endDateTime = new Date(returnDate || new Date());
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
        (w: WorkingTime) => w.day === dayName,
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
        (w: WorkingTime) => w.day === dayName,
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
 
    setIsSubmitting(false);
    setLoadingVans(true);

    try {
      const [officeResponse, categoriesResponse] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_OFFICES_API}/${selectedOffice}`),
        fetch(`${process.env.EXPO_PUBLIC_CATEGORIES_API}?status=active` || ""),
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

        // Defensive: officeCategoryIds may contain id strings or objects like { _id }
        const officeIdsStr = (officeCategoryIds || []).map((id: any) =>
          String(id && (id._id ?? id)),
        );

        const filteredVans = (
          Array.isArray(categoriesData.data) ? categoriesData.data : []
        )
          .filter((cat: Category) => {
            const catId = String(cat._id ?? "");
            const matchesOffice = officeIdsStr.includes(catId);

            // cat.type may be either an object { _id } or a plain id string
            const catTypeId = cat.type ? (cat.type._id ?? cat.type) : undefined;
            const matchesType =
              String(catTypeId ?? "") === String(selectedType ?? "");

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
            expert: cat.expert || "",
            selloffer: cat.selloffer || 0,
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

  // Custom Login Modal handlers
  const handleLoginPress = () => {
    setLoginModalVisible(false);
    onClose();
    router.push("/register");
  };

  const handleCancelLogin = () => setLoginModalVisible(false);

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof Ionicons.glyphMap,
    inputName: string,
    keyboardType: "default" | "numeric" = "default",
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
      {/* Inline alert rendered inside the sheet when it's open */}
      {inlineAlertVisible && (
        <View
          style={{
            position: "absolute",
            top: 200,
            left: 0,
            right: 0,
            bottom: 300,
            zIndex: 999,
          }}
          pointerEvents="box-none"
        >
          <Pressable style={{ flex: 1 }} onPress={hideInlineAlert} />
          <View
            style={{
              backgroundColor: "#1e293b",
              padding: 16,
              borderRadius: 12,
              margin: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              {inlinePayload.title}
            </Text>
            <Text style={{ color: "#cbd5e1", marginBottom: 14 }}>
              {inlinePayload.message}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Pressable onPress={hideInlineAlert} style={{ padding: 10 }}>
                <Text style={{ color: "#cbd5e1", fontWeight: "600" }}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

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
                filteredTypes.map((c) => (
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
                  ? (() => {
                      const londonTime = getLondonTime();
                      const londonHour = londonTime.getUTCHours();
                      const minDate = new Date();

                      if (londonHour < 16) {
                        minDate.setDate(minDate.getDate() + 1);
                      } else {
                        minDate.setDate(minDate.getDate() + 2);
                      }
                      return minDate.toISOString().split("T")[0];
                    })()
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

                // Mark disabled dates (48-hour restriction + office closed days)
                const londonTime = getLondonTime();
                const londonHour = londonTime.getUTCHours();
                const today = new Date();
                const minAllowedDate = new Date(today);

                if (londonHour < 16) {
                  minAllowedDate.setDate(today.getDate() + 1);
                } else {
                  minAllowedDate.setDate(today.getDate() + 2);
                }

                for (let i = 0; i < 60; i++) {
                  const checkDate = new Date(today);
                  checkDate.setDate(today.getDate() + i);
                  const dateStr = checkDate.toISOString().split("T")[0];

                  if (checkDate < minAllowedDate) {
                    marked[dateStr] = {
                      disabled: true,
                      disableTouchEvent: true,
                    };
                  } else if (office && isDateDisabled(checkDate)) {
                    marked[dateStr] = {
                      disabled: true,
                      disableTouchEvent: true,
                    };
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
                let timeSlots = generateTimeSlots(slots.start, slots.end);
                const selectedTime = formatTime(
                  isPickup ? pickupTime : returnTime,
                );

                // Filter return times if same day rental
                if (!isPickup && pickupDate && returnDate && pickupTime) {
                  const isSameDay =
                    pickupDate.toDateString() === returnDate.toDateString();
                  if (isSameDay) {
                    const [pH, pM] = pickupTime.split(":").map(Number);
                    const minReturnMinutes = pH * 60 + pM + 360; // 360 = 6 hours
                    timeSlots = timeSlots.filter((time) => {
                      const [rH, rM] = time.split(":").map(Number);
                      const returnMinutes = rH * 60 + rM;
                      return returnMinutes >= minReturnMinutes;
                    });
                  }
                }

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
                  (w: WorkingTime) => w.day === dayName,
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

                        // Use appropriate reserved slots based on whether it's pickup or return time
                        const relevantSlots = isPickup
                          ? startDateReservedSlots
                          : endDateReservedSlots;

                        // Only disable the exact start/end time slot
                        const isReserved = relevantSlots.some((slot) => {
                          if (isPickup) {
                            // For pickup, disable the startTime
                            return time === slot.startTime;
                          } else {
                            // For return, disable the endTime
                            return time === slot.endTime;
                          }
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
                      ? (getSelectedOffice()?.name ?? "Selected office")
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
                  {/* <Ionicons
                    name="car-sharp"
                    size={18}
                    color={selectedType ? ACCENT : "rgba(255,255,255,0.4)"}
                    style={sheetStyles.inputIcon}
                  /> */}
                  <Svg
                    width={18}
                    height={18}
                    viewBox="0 0 512 512"
                    style={sheetStyles.inputIcon}
                  >
                    <Path
                      d="m465.532 242.313-28.08-13.505-37.568-67.507c-7.415-13.323-20.945-21.277-36.193-21.277h-215.023c-22.84 0-41.421 18.581-41.421 41.42v147.86c0 4.418 3.582 8 8 8h25.785c3.757 19.716 21.114 34.671 41.908 34.671 20.793 0 38.151-14.955 41.908-34.671h140.051c3.757 19.716 21.114 34.671 41.908 34.671s38.152-14.955 41.909-34.671h32.284c4.418 0 8-3.582 8-8v-49.663c0-16.305-8.773-30.26-23.468-37.328zm-47.443-15.395h-36.313l-13.51-9.322c-1.336-.922-2.921-1.416-4.544-1.416h-32.93v-26.638h66.497zm-235.149 129.058c-14.706 0-26.671-11.965-26.671-26.671s11.965-26.671 26.671-26.671 26.671 11.965 26.671 26.671-11.965 26.671-26.671 26.671zm223.867 0c-14.706 0-26.671-11.965-26.671-26.671s11.965-26.671 26.671-26.671c14.707 0 26.672 11.965 26.672 26.671s-11.965 26.671-26.672 26.671zm66.193-34.671h-24.285c-3.757-19.716-21.115-34.671-41.909-34.671s-38.151 14.955-41.908 34.671h-140.05c-3.757-19.716-21.114-34.671-41.908-34.671s-38.151 14.955-41.908 34.671h-17.785v-139.86c0-14.017 11.403-25.42 25.421-25.42h215.022c9.498 0 17.594 4.76 22.213 13.059l2.481 4.459h-65.593c-4.418 0-8 3.582-8 8v42.638c0 4.418 3.582 8 8 8h38.438l13.51 9.322c1.336.922 2.921 1.416 4.544 1.416h50.59l28.725 13.815c9.019 4.337 14.402 12.9 14.402 22.908zm-190.991-86.387c0 4.418-3.582 8-8 8h-132.75c-4.418 0-8-3.582-8-8s3.582-8 8-8h132.75c4.418 0 8 3.582 8 8zm-191.118-81.277c0 4.418-3.582 8-8 8h-51.891c-4.418 0-8-3.582-8-8s3.582-8 8-8h51.891c4.418 0 8 3.582 8 8zm0 69.869c0 4.418-3.582 8-8 8h-38.764c-4.418 0-8-3.582-8-8s3.582-8 8-8h38.764c4.418 0 8 3.582 8 8zm0 69.869c0 4.418-3.582 8-8 8h-26.78c-4.418 0-8-3.582-8-8s3.582-8 8-8h26.779c4.419 0 8.001 3.582 8.001 8z"
                      strokeWidth={selectedType ? 5 : 8}
                      fill={selectedType ? ACCENT : "rgba(255,255,255,0.4)"}
                    />
                  </Svg>
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
                      ? (type.find((c) => c._id === selectedType)?.name ??
                        "Selected type")
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
                "Driver age (23-80)",
                driverAge,
                setDriverAge,
                "person-outline",
                "driverAge",
                "numeric",
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
              (w: WorkingTime) => w.day === dayName,
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
              (w: WorkingTime) => w.day === dayName,
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

      {/* Custom Login Required Modal (replaces Alert.alert) */}
      <Modal
        visible={loginModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLoginModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => setLoginModalVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: "86%",
              backgroundColor: "#0b1220",
              padding: 18,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              Login Required
            </Text>
            <Text style={{ color: "#cbd5e1", marginBottom: 14 }}>
              Please login or register to continue with your reservation.
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <Pressable
                onPress={handleCancelLogin}
                style={({ pressed }) => [
                  {
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: pressed
                      ? "rgba(255,255,255,0.04)"
                      : "transparent",
                  },
                ]}
              >
                <Text style={{ color: "#cbd5e1", fontWeight: "600" }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleLoginPress}
                style={({ pressed }) => [
                  {
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: pressed ? "rgba(254,154,0,0.9)" : ACCENT,
                  },
                ]}
              >
                <Text style={{ color: "#0b1220", fontWeight: "800" }}>
                  Login / Register
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/* ===================== VOICE + AI BUTTON (AI Integration) ===================== */

import AIBookingFlow from "./AIBookingFlow";
import Svg, { Path } from "react-native-svg";

function VoiceAIButton() {
  const [recording, setRecording] = useState(false);
  const [showAIFlow, setShowAIFlow] = useState(false);
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
          ]),
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

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Open AI Booking Flow instead of just recording
    setShowAIFlow(true);
  };

  const { showAlert } = useAlert();

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          sheetStyles.voiceButton,
          pressed && { transform: [{ scale: 0.97 }] },
          recording && sheetStyles.voiceButtonActive,
        ]}
      >
        <View style={sheetStyles.voiceLeft}>
          <View style={sheetStyles.voiceIconWrapper}>
            <Ionicons name="sparkles" size={26} color={DARK} />
          </View>
          <View>
            <Text style={sheetStyles.voiceTitle}>Book with AI Assistant</Text>
            <Text style={sheetStyles.voiceSubtitle}>
              Voice or text - complete in ~1 minute
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

      {/* AI Booking Flow Modal */}
      <AIBookingFlow
        visible={showAIFlow}
        onClose={() => setShowAIFlow(false)}
        onComplete={() => {
          setShowAIFlow(false);
          showAlert("Success", "Booking completed successfully!");
        }}
      />
    </>
  );
}

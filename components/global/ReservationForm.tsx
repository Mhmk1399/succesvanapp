import { useAlert } from "@/components/global/CustomAlert";
import { useToast } from "@/components/global/AppToast";
import LoginRequiredModal from "@/components/global/LoginRequiredModal";
import BookingCalendarChrome, {
  BOOKING_CALENDAR_THEME,
} from "@/components/global/BookingCalendarChrome";
import { useAuth } from "@/contexts/AuthContext";
import { officeService } from "@/services/officeService";
import { typeService } from "@/services/typeService";
import { Category, Type, Office, WorkingTime } from "@/types/type";
import {
  calculateOfficeExtensionPrices,
  getAvailableTimeSlots as getSharedAvailableTimeSlots,
  isDateDisabled as isSharedDateDisabled,
} from "@/utils/bookingSchedule";
import { getMinDriverAge } from "@/utils/bookingPrice";
import {
  createLondonDateTime,
  formatDateForStorage,
  getLondonTime as getSharedLondonTime,
  syncServerClock,
} from "@/utils/londonTime";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlassView from "@/components/global/GlassView";
import { appTheme } from "@/constants/appTheme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  return getSharedLondonTime();
};

const parseStoredDate = (displayDate?: string, isoDate?: string) => {
  const source = displayDate || isoDate;
  if (!source) return null;
  const datePart = source.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatCalendarLabel = (date: Date | null) =>
  date
    ? date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "No date selected yet";

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
            <View style={styles.mainButtonIcon}>
              <Ionicons name="flash" size={19} color="#ffffff" />
            </View>
            <Text style={styles.mainButtonText}>Reserve a Van</Text>
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
            reservationUi.sheetContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <GlassView
            intensity={100}
            tint="dark"
            style={[styles.blurContainer, reservationUi.sheetSurface]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(29,34,40,0.98)",
                "rgba(13,19,27,0.99)",
                "rgba(7,13,21,1)",
              ]}
              locations={[0, 0.42, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={reservationUi.sheetTopGlow} />
            <View
              {...panResponder.panHandlers}
              style={reservationUi.handleArea}
            >
              <View style={reservationUi.sheetHandle} />
            </View>

            <ReservationSheetContent
              onClose={closeSheet}
              onCompleted={onCompleted}
              isSheetOpen={sheetVisible}
            />
          </GlassView>
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
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
  const selectedTypeName = useMemo(
    () => type.find((item) => item._id === selectedType)?.name,
    [selectedType, type],
  );
  const minDriverAge = useMemo(
    () => getMinDriverAge(selectedTypeName),
    [selectedTypeName],
  );

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
      rules?: { key?: string; value?: string; _id?: string }[];
      requiredLicense?: string;
    }[]
  >([]);
  const [loadingVans, setLoadingVans] = useState(false);

  useEffect(() => {
    if (isSheetOpen) {
      syncServerClock().catch((error) => {
        console.log("Failed to sync server clock:", error);
      });
    }
  }, [isSheetOpen]);

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
            parseStoredDate(data.startDateDisplay, data.pickupDate) ||
              new Date(),
          );
          setPickupTime(data.pickupTime || "");
          setReturnDate(
            parseStoredDate(data.endDateDisplay, data.returnDate) ||
              new Date(Date.now() + 24 * 60 * 60 * 1000),
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
    return isSharedDateDisabled(date, office);
  };

  const getAvailableTimeSlots = (
    date: Date | null,
    isPickup: boolean = true,
  ) => {
    const office = getSelectedOffice();
    return getSharedAvailableTimeSlots(
      date,
      office,
      isPickup ? "pickup" : "return",
    );
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
    if (!driverAge || age < minDriverAge || age > 80) {
      showEitherAlert(
        "Driver age",
        `Driver age must be between ${minDriverAge} and 80.`,
      );
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
        showEitherAlert(
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
          pickupDate: createLondonDateTime(pickupDate!, pickupTime),
          returnDate: createLondonDateTime(returnDate!, returnTime),
          startDateDisplay: formatDateForStorage(pickupDate!),
          endDateDisplay: formatDateForStorage(returnDate!),
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

    const { pickupExtension, returnExtension } = officeObj
      ? calculateOfficeExtensionPrices({
          office: officeObj,
          pickupDate,
          pickupTime,
          returnDate,
          returnTime,
        })
      : { pickupExtension: 0, returnExtension: 0 };

    const startDateIso = createLondonDateTime(pickupDate!, pickupTime);
    const endDateIso = createLondonDateTime(returnDate!, returnTime);

    const reservationPayload = {
      office: selectedOffice,
      officeName: officeObj?.name ?? "",
      type: selectedType,
      pickupDate: startDateIso,
      returnDate: endDateIso,
      startDateDisplay: formatDateForStorage(pickupDate!),
      endDateDisplay: formatDateForStorage(returnDate!),
      pickupTime: pickupTime,
      returnTime: returnTime,
      driverAge,
      pickupExtensionFee: pickupExtension,
      returnExtensionFee: returnExtension,
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
            rules: Array.isArray(cat.rules) ? cat.rules : [],
            requiredLicense: cat.requiredLicense,
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

  // Presentation-only presets. They continue to write into the original
  // driverAge state, so validation and reservation payload logic remain intact.
  const driverAgeOptions = [
    { label: "18–21", min: 18, max: 21 },
    { label: "22–24", min: 22, max: 24 },
    { label: "25–29", min: 25, max: 29 },
    { label: "30–69", min: 30, max: 69 },
    { label: "70+", min: 70, max: 80 },
  ];
  const numericDriverAge = Number(driverAge);

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
            <BookingCalendarChrome
              phase={selectingDate}
              selectedLabel={formatCalendarLabel(
                selectingDate === "pickup" ? pickupDate : returnDate,
              )}
              onClose={() => {
                setDateRangeModalVisible(false);
                setSelectingDate("pickup");
              }}
            >
              <Calendar
                hideExtraDays
                enableSwipeMonths
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
                  if (
                    currentPickup &&
                    returnDate &&
                    selectingDate === "pickup"
                  ) {
                    const start = new Date(currentPickup);
                    const end = new Date(returnDate);
                    const current = new Date(start);

                    while (current <= end) {
                      const dateStr = current.toISOString().split("T")[0];
                      const isStart = current.getTime() === start.getTime();
                      const isEnd = current.getTime() === end.getTime();

                      marked[dateStr] = {
                        color:
                          isStart || isEnd ? ACCENT : "rgba(254,154,0,0.3)",
                        textColor: isStart || isEnd ? "#fff" : "#f9fafb",
                        startingDay: isStart,
                        endingDay: isEnd,
                      };

                      current.setDate(current.getDate() + 1);
                    }
                  } else if (currentPickup) {
                    const pickupStr = currentPickup.toISOString().split("T")[0];
                    marked[pickupStr] = {
                      color: ACCENT,
                      textColor: "#ffffff",
                      startingDay: true,
                      endingDay: true,
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
                theme={BOOKING_CALENDAR_THEME}
              />
            </BookingCalendarChrome>
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
                let timeSlots = slots.slots;
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
                          Boolean(slots.specialDay?.extraPrice) ||
                          is24Hours ||
                          time < slots.normalStart ||
                          time > slots.normalEnd;
                        const extensionPrice =
                          slots.specialDay?.extraPrice ||
                          slots.extensionRanges.find(
                            (range) =>
                              time >= range.startTime && time <= range.endTime,
                          )?.flatPrice ||
                          (isExtension && extension ? extension.flatPrice : 0);

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
          contentContainerStyle={[sheetStyles.container, reservationUi.content]}
        >
          {/* Header */}
          <View style={reservationUi.headerRow}>
            <View style={reservationUi.headerCopy}>
              <Text style={reservationUi.sheetTitle}>Quick Reservation</Text>
              <Text style={reservationUi.sheetSubtitle}>
                Just a few details to get started
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [
                reservationUi.closeBtn,
                pressed && reservationUi.pressed,
              ]}
            >
              <Ionicons name="close" size={20} color="#cbd5e1" />
            </Pressable>
          </View>

          {/* Voice + AI button — same action, refreshed presentation */}
          <VoiceAIButton />

          {/* Office + Van type */}
          <View style={reservationUi.section}>
            <View style={reservationUi.twoColumnRow}>
              <View style={reservationUi.column}>
                <Text style={reservationUi.fieldLabel}>OFFICE</Text>
                <Pressable
                  onPress={() => setOfficeModalVisible(true)}
                  style={({ pressed }) => [
                    reservationUi.selectField,
                    selectedOffice && reservationUi.fieldSelected,
                    pressed && reservationUi.fieldPressed,
                  ]}
                >
                  <View style={reservationUi.fieldIconCircle}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={selectedOffice ? ACCENT : "#94a3b8"}
                    />
                  </View>
                  <Text
                    style={[
                      reservationUi.fieldValue,
                      !selectedOffice && reservationUi.placeholder,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedOffice
                      ? (getSelectedOffice()?.name ?? "Selected office")
                      : "Select office"}
                  </Text>
                  <Ionicons
                    name={selectedOffice ? "checkmark-circle" : "chevron-down"}
                    size={16}
                    color={selectedOffice ? ACCENT : "#94a3b8"}
                  />
                </Pressable>
              </View>

              <View style={reservationUi.column}>
                <Text style={reservationUi.fieldLabel}>VAN TYPE</Text>
                <Pressable
                  onPress={() => setCategoryModalVisible(true)}
                  style={({ pressed }) => [
                    reservationUi.selectField,
                    selectedType && reservationUi.fieldSelected,
                    pressed && reservationUi.fieldPressed,
                  ]}
                >
                  <View style={reservationUi.fieldIconCircle}>
                    <Ionicons
                      name="car-sport-outline"
                      size={16}
                      color={selectedType ? ACCENT : "#94a3b8"}
                    />
                  </View>
                  <Text
                    style={[
                      reservationUi.fieldValue,
                      !selectedType && reservationUi.placeholder,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedType
                      ? (type.find((item) => item._id === selectedType)?.name ??
                        "Selected van type")
                      : "Select van type"}
                  </Text>
                  <Ionicons
                    name={selectedType ? "checkmark-circle" : "chevron-down"}
                    size={16}
                    color={selectedType ? ACCENT : "#94a3b8"}
                  />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Rental period */}
          <View style={reservationUi.section}>
            <Text style={reservationUi.fieldLabel}>RENTAL PERIOD</Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                openDateRangePicker();
              }}
              style={({ pressed }) => [
                reservationUi.dateRangeCard,
                pickupDate && returnDate && reservationUi.dateRangeSelected,
                pressed && reservationUi.fieldPressed,
              ]}
            >
              <View style={reservationUi.dateColumn}>
                <View style={reservationUi.dateLabelRow}>
                  <Ionicons name="calendar-outline" size={15} color={ACCENT} />
                  <Text style={reservationUi.dateEyebrow}>PICKUP</Text>
                </View>
                <Text style={reservationUi.dateValue}>
                  {formatDate(pickupDate)}
                </Text>
                <Text style={reservationUi.dateMeta}>
                  {pickupDate
                    ? pickupDate.toLocaleDateString("en-GB", {
                        weekday: "long",
                      })
                    : "Select date"}
                </Text>
              </View>

              <View style={reservationUi.dateArrowCircle}>
                <Ionicons name="arrow-forward" size={18} color={ACCENT} />
              </View>

              <View style={reservationUi.dateColumn}>
                <View style={reservationUi.dateLabelRow}>
                  <Ionicons name="calendar-outline" size={15} color={ACCENT} />
                  <Text style={reservationUi.dateEyebrow}>RETURN</Text>
                </View>
                <Text style={reservationUi.dateValue}>
                  {formatDate(returnDate)}
                </Text>
                <Text style={reservationUi.dateMeta}>
                  {returnDate
                    ? returnDate.toLocaleDateString("en-GB", {
                        weekday: "long",
                      })
                    : "Select date"}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Times */}
          <View style={reservationUi.section}>
            <View style={reservationUi.twoColumnRow}>
              <View style={reservationUi.column}>
                <Text style={reservationUi.fieldLabel}>PICKUP TIME</Text>
                <Pressable
                  onPress={() => openTimeModal("pickupTime")}
                  style={({ pressed }) => [
                    reservationUi.selectField,
                    pickupTime && reservationUi.fieldSelected,
                    pressed && reservationUi.fieldPressed,
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color={pickupTime ? ACCENT : "#94a3b8"}
                  />
                  <Text
                    style={[
                      reservationUi.fieldValue,
                      !pickupTime && reservationUi.placeholder,
                    ]}
                  >
                    {pickupTime || "Select time"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                </Pressable>
              </View>

              <View style={reservationUi.column}>
                <Text style={reservationUi.fieldLabel}>RETURN TIME</Text>
                <Pressable
                  onPress={() => openTimeModal("returnTime")}
                  style={({ pressed }) => [
                    reservationUi.selectField,
                    returnTime && reservationUi.fieldSelected,
                    pressed && reservationUi.fieldPressed,
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color={returnTime ? ACCENT : "#94a3b8"}
                  />
                  <Text
                    style={[
                      reservationUi.fieldValue,
                      !returnTime && reservationUi.placeholder,
                    ]}
                  >
                    {returnTime || "Select time"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Driver age — presets write to the original driverAge state */}
          <View style={reservationUi.section}>
            <Text style={reservationUi.fieldLabel}>DRIVER AGE</Text>
            <View style={reservationUi.ageRow}>
              {driverAgeOptions.map((option) => {
                const disabled = option.max < minDriverAge;
                const active =
                  numericDriverAge >= option.min &&
                  numericDriverAge <= option.max;
                const ageToStore = Math.max(option.min, minDriverAge);

                return (
                  <Pressable
                    key={option.label}
                    disabled={disabled}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setDriverAge(String(ageToStore));
                    }}
                    style={({ pressed }) => [
                      reservationUi.ageOption,
                      active && reservationUi.ageOptionActive,
                      disabled && reservationUi.ageOptionDisabled,
                      pressed && !disabled && reservationUi.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        reservationUi.ageOptionText,
                        active && reservationUi.ageOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {active && (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="#fff4d6"
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={reservationUi.ageNotice}>
              <View style={reservationUi.ageNoticeIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color={ACCENT}
                />
              </View>
              <View style={reservationUi.ageNoticeCopy}>
                <Text style={reservationUi.ageNoticeTitle}>
                  Drivers must meet the minimum age requirement
                </Text>
                <Text style={reservationUi.ageNoticeText}>
                  Minimum age for this selection: {minDriverAge}. Additional
                  terms may apply.
                </Text>
              </View>
            </View>
          </View>

          {/* Submit — same handleSubmit and loading state */}
          <View style={reservationUi.submitWrap}>
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting || loadingVans}
              style={({ pressed }) => [
                reservationUi.submitButton,
                pressed && reservationUi.submitPressed,
                (isSubmitting || loadingVans) && reservationUi.submitDisabled,
              ]}
            >
              <LinearGradient
                colors={["#ffb11f", ACCENT, "#f48200"]}
                locations={[0, 0.48, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={reservationUi.submitGradient}
              >
                <View style={reservationUi.submitIcon}>
                  {loadingVans ? (
                    <ActivityIndicator size="small" color={ACCENT} />
                  ) : (
                    <Ionicons name="car-sport" size={19} color={ACCENT} />
                  )}
                </View>

                <View style={reservationUi.submitCopy}>
                  <Text style={reservationUi.submitTitle}>
                    {loadingVans
                      ? "Loading Vans..."
                      : isSubmitting
                        ? "Validating..."
                        : "Show Available Vans"}
                  </Text>
                  <Text style={reservationUi.submitSubtitle}>
                    Find the perfect van for your trip
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={DARK} />
              </LinearGradient>
            </Pressable>

            <View style={reservationUi.securityRow}>
              <Ionicons name="lock-closed-outline" size={12} color="#64748b" />
              <Text style={reservationUi.securityText}>
                Secure booking • No payment required
              </Text>
            </View>
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
          const officeObj = getSelectedOffice();
          const { pickupExtension, returnExtension } = officeObj
            ? calculateOfficeExtensionPrices({
                office: officeObj,
                pickupDate,
                pickupTime,
                returnDate,
                returnTime,
              })
            : { pickupExtension: 0, returnExtension: 0 };

          return {
            office: selectedOffice,
            category: selectedType,
            pickupDate:
              pickupDate && pickupTime
                ? createLondonDateTime(pickupDate, pickupTime)
                : "",
            returnDate:
              returnDate && returnTime
                ? createLondonDateTime(returnDate, returnTime)
                : "",
            startDateDisplay: pickupDate
              ? formatDateForStorage(pickupDate)
              : "",
            endDateDisplay: returnDate ? formatDateForStorage(returnDate) : "",
            pickupTime,
            returnTime,
            driverAge,
            pickupExtensionFee: pickupExtension,
            returnExtensionFee: returnExtension,
          };
        })()}
        onReservationComplete={onClose}
      />

      <LoginRequiredModal
        visible={loginModalVisible}
        message="Please login or register to continue with your reservation."
        onLogin={handleLoginPress}
        onCancel={handleCancelLogin}
      />
    </>
  );
}

/* ===================== VOICE + AI BUTTON (AI Integration) ===================== */

import AIBookingFlow from "./AIBookingFlow";

type BookingProgressStep = {
  label: string;
  done: boolean;
  icon: keyof typeof Ionicons.glyphMap;
};

function BookingProgress({
  steps,
  title,
}: {
  steps: BookingProgressStep[];
  title: string;
}) {
  const completed = steps.filter((step) => step.done).length;

  return (
    <View style={progressStyles.card}>
      <View style={progressStyles.header}>
        <View>
          <Text style={progressStyles.eyebrow}>Booking progress</Text>
          <Text style={progressStyles.title}>{title}</Text>
        </View>
        <View style={progressStyles.badge}>
          <Text style={progressStyles.badgeText}>{completed}</Text>
          <Text style={progressStyles.badgeMuted}>/{steps.length}</Text>
        </View>
      </View>

      <View style={progressStyles.track}>
        <View
          style={[
            progressStyles.trackFill,
            { width: `${(completed / steps.length) * 100}%` },
          ]}
        />
      </View>

      <View style={progressStyles.steps}>
        {steps.map((step) => (
          <View
            key={step.label}
            style={[progressStyles.step, step.done && progressStyles.stepDone]}
          >
            <Ionicons
              name={step.done ? "checkmark" : step.icon}
              size={14}
              color={step.done ? DARK : appTheme.color.textMuted}
            />
            <Text
              numberOfLines={1}
              style={[
                progressStyles.stepText,
                step.done && progressStyles.stepTextDone,
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

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

  const { showToast } = useToast();

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          reservationUi.aiCard,
          pressed && reservationUi.aiCardPressed,
          recording && reservationUi.aiCardActive,
        ]}
      >
        <View style={reservationUi.aiLeft}>
          <View style={reservationUi.aiIconOuter}>
            <View style={reservationUi.aiIconInner}>
              <Ionicons name="sparkles" size={22} color={ACCENT} />
            </View>
          </View>
          <View style={reservationUi.aiCopy}>
            <Text style={reservationUi.aiTitle}>Book with AI Assistant</Text>
            <Text style={reservationUi.aiSubtitle}>
              Voice or text - complete in ~1 minute
            </Text>
          </View>
        </View>

        <View style={reservationUi.waveWrapper}>
          {bars.map((_, index) => {
            const h = barAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [4, 18],
            });
            return (
              <Animated.View
                key={index}
                style={[
                  reservationUi.waveBar,
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
          showToast({
            type: "success",
            title: "Booking completed",
            message: "Your van reservation is ready.",
          });
        }}
      />
    </>
  );
}

const reservationUi = StyleSheet.create({
  sheetContainer: {
    left: 10,
    right: 10,
    bottom: 0,
    height: Math.min(height * 0.86, 760),
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.11)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.58,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: -12 },
      },
      android: { elevation: 24 },
    }),
  },
  sheetSurface: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0c121a",
  },
  sheetTopGlow: {
    position: "absolute",
    top: -70,
    left: -30,
    width: 260,
    height: 160,
    borderRadius: 130,
    backgroundColor: "rgba(254,154,0,0.055)",
  },
  handleArea: {
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(203,213,225,0.58)",
  },
  content: {
    paddingHorizontal: 15,
    paddingTop: 4,
    paddingBottom: 22,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  sheetTitle: {
    color: "#f8fafc",
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "900",
    letterSpacing: -0.55,
  },
  sheetSubtitle: {
    color: "rgba(203,213,225,0.56)",
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "600",
    marginTop: 3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.075)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pressed: { opacity: 0.76, transform: [{ scale: 0.975 }] },
  section: { marginTop: 13 },
  twoColumnRow: { flexDirection: "row", gap: 9 },
  column: { flex: 1, minWidth: 0 },
  fieldLabel: {
    color: "rgba(203,213,225,0.58)",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.45,
    marginBottom: 6,
  },
  selectField: {
    minHeight: 44,
    paddingHorizontal: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
  },
  fieldSelected: {
    backgroundColor: "rgba(254,154,0,0.055)",
    borderColor: "rgba(254,154,0,0.42)",
  },
  fieldPressed: { opacity: 0.82, transform: [{ scale: 0.992 }] },
  fieldIconCircle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  fieldValue: {
    flex: 1,
    minWidth: 0,
    color: "#f1f5f9",
    fontSize: 10.5,
    fontWeight: "700",
  },
  placeholder: { color: "rgba(203,213,225,0.48)", fontWeight: "600" },
  dateRangeCard: {
    minHeight: 76,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(28,24,17,0.72)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.48)",
    overflow: "hidden",
  },
  dateRangeSelected: {
    borderColor: "rgba(254,154,0,0.72)",
    backgroundColor: "rgba(254,154,0,0.075)",
  },
  dateColumn: { flex: 1, minWidth: 0 },
  dateLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },
  dateEyebrow: {
    color: "rgba(203,213,225,0.58)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  dateValue: {
    color: "#f8fafc",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
  },
  dateMeta: {
    color: "rgba(203,213,225,0.5)",
    fontSize: 8.5,
    fontWeight: "600",
    marginTop: 2,
  },
  dateArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.48)",
  },
  ageRow: {
    flexDirection: "row",
    gap: 5,
  },
  ageOption: {
    flex: 1,
    minWidth: 0,
    height: 35,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
  ageOptionActive: {
    backgroundColor: "rgba(254,154,0,0.18)",
    borderColor: ACCENT,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.22,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
  ageOptionDisabled: { opacity: 0.28 },
  ageOptionText: {
    color: "rgba(226,232,240,0.62)",
    fontSize: 9,
    fontWeight: "800",
  },
  ageOptionTextActive: { color: ACCENT, fontWeight: "900" },
  ageNotice: {
    minHeight: 45,
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },
  ageNoticeIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.09)",
  },
  ageNoticeCopy: { flex: 1, minWidth: 0 },
  ageNoticeTitle: {
    color: "rgba(241,245,249,0.8)",
    fontSize: 8.8,
    fontWeight: "800",
  },
  ageNoticeText: {
    color: "rgba(148,163,184,0.62)",
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  submitWrap: { marginTop: 12 },
  submitButton: {
    minHeight: 56,
    borderRadius: 11,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.34,
        shadowRadius: 13,
        shadowOffset: { width: 0, height: 7 },
      },
      android: { elevation: 8 },
    }),
  },
  submitPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  submitDisabled: { opacity: 0.64 },
  submitGradient: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  submitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7,17,31,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  submitCopy: { flex: 1, minWidth: 0 },
  submitTitle: {
    color: DARK,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
    letterSpacing: -0.15,
  },
  submitSubtitle: {
    color: "rgba(15,23,42,0.68)",
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "700",
    marginTop: 1,
  },
  securityRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  securityText: {
    color: "rgba(148,163,184,0.56)",
    fontSize: 8,
    fontWeight: "600",
  },
  aiCard: {
    minHeight: 61,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 9,
    backgroundColor: "rgba(28,24,17,0.64)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.48)",
    overflow: "hidden",
  },
  aiCardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  aiCardActive: { borderColor: ACCENT },
  aiLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  aiIconOuter: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.42)",
  },
  aiIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07111f",
  },
  aiCopy: { flex: 1, minWidth: 0 },
  aiTitle: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "900",
  },
  aiSubtitle: {
    color: "rgba(203,213,225,0.5)",
    fontSize: 8.2,
    fontWeight: "600",
    marginTop: 2,
  },
  waveWrapper: {
    width: 38,
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
  },
  waveBar: {
    width: 3,
    minHeight: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
});

const selectionStyles = StyleSheet.create({
  selectedField: {
    borderColor: "rgba(254,154,0,0.5)",
    backgroundColor: "rgba(254,154,0,0.075)",
  },
});

const progressStyles = StyleSheet.create({
  card: {
    marginBottom: 18,
    padding: 14,
    borderRadius: appTheme.radius.lg,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: appTheme.color.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    color: appTheme.color.textFaint,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: appTheme.color.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
  },
  badge: {
    minWidth: 48,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.color.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.25)",
  },
  badgeText: {
    color: appTheme.color.accentStrong,
    fontSize: 16,
    fontWeight: "900",
  },
  badgeMuted: {
    color: appTheme.color.textFaint,
    fontSize: 12,
    fontWeight: "800",
  },
  track: {
    height: 5,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 12,
  },
  trackFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  steps: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  step: {
    flexGrow: 1,
    minWidth: "46%",
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  stepDone: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  stepText: {
    color: appTheme.color.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  stepTextDone: {
    color: DARK,
  },
});

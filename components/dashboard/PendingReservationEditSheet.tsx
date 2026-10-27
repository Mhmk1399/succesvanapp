import { useToast } from "@/components/global/AppToast";
import BookingCalendarChrome, {
  BOOKING_CALENDAR_THEME,
} from "@/components/global/BookingCalendarChrome";
import { addonService } from "@/services/addonService";
import { reservationService } from "@/services/reservationService";
import { safeFetch } from "@/services/apiClient";
import type { AddOn, Office, Reservation } from "@/types/type";
import { getAddonImageUri } from "@/utils/addonImage";
import { getReservationServiceCharge } from "@/utils/reservationPriceBreakdown";
import {
  type AddOnSelection,
  calculateBookingPrice,
  getAddonLineItems,
  getAddonPriceForDays,
  getMatchingAddonTierIndex,
  getMinDriverAge,
  isAddonAvailableForCategory,
  isAddonAvailableForDays,
} from "@/utils/bookingPrice";
import {
  calculateOfficeExtensionPrices,
  getAvailableTimeSlots,
  isDateDisabled,
} from "@/utils/bookingSchedule";
import {
  addDaysToDateInput,
  createLondonDateTime,
  formatDateForStorage,
  formatDateInputInLondon,
  getMinimumPickupDateInput,
  syncServerClock,
} from "@/utils/londonTime";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");
const ACCENT = "#fe9a00";
const RETURN_ACCENT = "#38bdf8";
const DARK = "#0f172a";

type TimeField = "pickupTime" | "returnTime";
type DatePhase = "pickup" | "return";

type ReservedSlot = {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
};

type PendingReservationEditSheetProps = {
  visible: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onUpdated?: () => void;
};

const sanitizeDriverAge = (value?: string | number | null) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 2);

const parseDateInput = (displayDate?: string, isoDate?: string) => {
  const dateInput =
    displayDate?.split("T")[0] || (isoDate ? formatDateInputInLondon(isoDate) : "");
  const [year, month, day] = dateInput.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const getTimeFromReservation = (explicitTime?: string, isoDate?: string) => {
  if (explicitTime) return explicitTime;
  if (!isoDate) return "";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  return hour && minute ? `${hour}:${minute}` : "";
};

const formatCalendarLabel = (date: Date | null) =>
  date
    ? date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "No date selected";

const buildLocalDateTime = (date: Date | null, time: string) => {
  if (!date || !time) return null;
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return new Date(createLondonDateTime(date, time));
};

const extractAddonData = (result: any): AddOn[] => {
  if (Array.isArray(result?.data?.data)) return result.data.data;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;
  return [];
};

const mergeAddons = (left: AddOn[], right: AddOn[]) => {
  const map = new Map<string, AddOn>();
  [...left, ...right].forEach((addon) => {
    if (addon?._id && !map.has(addon._id)) map.set(addon._id, addon);
  });
  return Array.from(map.values());
};

export default function PendingReservationEditSheet({
  visible,
  reservation,
  onClose,
  onUpdated,
}: PendingReservationEditSheetProps) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timePhaseSlide = useRef(new Animated.Value(0)).current;

  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [driverAge, setDriverAge] = useState("");
  const [message, setMessage] = useState("");
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [addonSelections, setAddonSelections] = useState<
    Record<string, AddOnSelection>
  >({});
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [selectingDate, setSelectingDate] = useState<DatePhase>("pickup");
  const [tempPickupDate, setTempPickupDate] = useState<Date | null>(null);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeModalField, setTimeModalField] = useState<TimeField | null>(null);
  const [reservedSlots, setReservedSlots] = useState<ReservedSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingAddons, setIsLoadingAddons] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const office = reservation?.office as Office | undefined;
  const category = reservation?.category;
  const categoryId = category?._id;
  const selectedGear = reservation?.selectedGear || "manual";

  const reservationAddons = useMemo(
    () =>
      Array.isArray(reservation?.addOns)
        ? reservation.addOns
            .map((item) => item.addOn)
            .filter((addon): addon is AddOn => Boolean(addon?._id))
        : [],
    [reservation?.addOns],
  );

  const mergedAddons = useMemo(
    () => mergeAddons(reservationAddons, addons),
    [addons, reservationAddons],
  );

  const localStartDate = useMemo(
    () => buildLocalDateTime(pickupDate, pickupTime),
    [pickupDate, pickupTime],
  );

  const localEndDate = useMemo(
    () => buildLocalDateTime(returnDate, returnTime),
    [returnDate, returnTime],
  );

  const extensionPrices = useMemo(() => {
    if (!office) return { pickupExtension: 0, returnExtension: 0 };
    return calculateOfficeExtensionPrices({
      office,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
    });
  }, [office, pickupDate, pickupTime, returnDate, returnTime]);

  const baseBookingPrice = useMemo(
    () =>
      calculateBookingPrice({
        startDate: localStartDate,
        endDate: localEndDate,
        pricingTiers: category?.pricingTiers || [],
        extraHoursRate: category?.extrahoursRate || category?.extraHoursRate || 0,
        pickupExtensionPrice: extensionPrices.pickupExtension,
        returnExtensionPrice: extensionPrices.returnExtension,
        gearExtraCostPerDay:
          selectedGear === "automatic" &&
          category?.gear?.availableTypes?.includes("automatic")
            ? category.gear.automaticExtraCost || 0
            : 0,
        sellOffer: category?.selloffer || 0,
      }),
    [
      category?.extraHoursRate,
      category?.extrahoursRate,
      category?.gear?.automaticExtraCost,
      category?.gear?.availableTypes,
      category?.pricingTiers,
      category?.selloffer,
      extensionPrices.pickupExtension,
      extensionPrices.returnExtension,
      localEndDate,
      localStartDate,
      selectedGear,
    ],
  );

  const rentalDays = baseBookingPrice?.totalDays || 1;

  const visibleAddons = useMemo(() => {
    const selectedIds = new Set(
      Object.entries(addonSelections)
        .filter(([, selection]) => selection.quantity > 0)
        .map(([id]) => id),
    );

    return mergedAddons.filter((addon) => {
      if (selectedIds.has(addon._id)) return true;
      const isActive = !addon.status || addon.status === "active";
      return (
        isActive &&
        isAddonAvailableForCategory(addon, categoryId) &&
        isAddonAvailableForDays(addon, rentalDays)
      );
    });
  }, [addonSelections, categoryId, mergedAddons, rentalDays]);

  const hasSelectedAddonOfType = (addon: AddOn) =>
    Boolean(
      addon.type &&
        Object.entries(addonSelections).some(([selectedId, selection]) => {
          if (selectedId === addon._id || Number(selection.quantity || 0) <= 0) {
            return false;
          }
          const selectedAddon = visibleAddons.find(
            (item) => item._id === selectedId,
          );
          return selectedAddon?.type === addon.type;
        }),
    );

  const addonLineItems = useMemo(
    () => getAddonLineItems(mergedAddons, addonSelections, rentalDays),
    [addonSelections, mergedAddons, rentalDays],
  );

  const addOnsPrice = useMemo(
    () => addonLineItems.reduce((sum, item) => sum + item.price, 0),
    [addonLineItems],
  );

  const bookingPrice = useMemo(
    () =>
      calculateBookingPrice({
        startDate: localStartDate,
        endDate: localEndDate,
        pricingTiers: category?.pricingTiers || [],
        extraHoursRate: category?.extrahoursRate || category?.extraHoursRate || 0,
        pickupExtensionPrice: extensionPrices.pickupExtension,
        returnExtensionPrice: extensionPrices.returnExtension,
        gearExtraCostPerDay:
          selectedGear === "automatic" &&
          category?.gear?.availableTypes?.includes("automatic")
            ? category.gear.automaticExtraCost || 0
            : 0,
        addOnsPrice,
        serviceCharge: reservation ? getReservationServiceCharge(reservation) : undefined,
        sellOffer: category?.selloffer || 0,
      }),
    [
      addOnsPrice,
      category?.extraHoursRate,
      category?.extrahoursRate,
      category?.gear?.automaticExtraCost,
      category?.gear?.availableTypes,
      category?.pricingTiers,
      category?.selloffer,
      extensionPrices.pickupExtension,
      extensionPrices.returnExtension,
      localEndDate,
      localStartDate,
      reservation?.serviceCharge,
      selectedGear,
    ],
  );

  const minDriverAge = useMemo(
    () => getMinDriverAge(category?.type?.name || category?.name),
    [category?.name, category?.type?.name],
  );

  const rentalHours =
    localStartDate && localEndDate
      ? (localEndDate.getTime() - localStartDate.getTime()) / 3_600_000
      : 0;
  const isValidRental = rentalHours >= 6;
  const normalizedDriverAge = sanitizeDriverAge(driverAge);
  const ageNumber = Number(normalizedDriverAge);
  const isDriverAgeValid =
    Boolean(normalizedDriverAge) &&
    Number.isInteger(ageNumber) &&
    ageNumber >= minDriverAge &&
    ageNumber <= 80;
  const canSave =
    Boolean(
      reservation?._id &&
        reservation.status === "pending" &&
        office?._id &&
        pickupDate &&
        returnDate &&
        pickupTime &&
        returnTime &&
        bookingPrice,
    ) &&
    isValidRental &&
    isDriverAgeValid &&
    !isSaving;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          closeWithAnimation();
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
    if (!visible || !reservation) return;

    syncServerClock().catch(() => {});
    setPickupDate(parseDateInput(reservation.startDateDisplay, reservation.startDate));
    setReturnDate(parseDateInput(reservation.endDateDisplay, reservation.endDate));
    setPickupTime(getTimeFromReservation(reservation.pickupTime, reservation.startDate));
    setReturnTime(getTimeFromReservation(reservation.returnTime, reservation.endDate));
    setDriverAge(sanitizeDriverAge(reservation.driverAge ?? reservation.dirverAge));
    setMessage(reservation.messege || "");

    const selections: Record<string, AddOnSelection> = {};
    reservation.addOns?.forEach((item) => {
      const addonId = item.addOn?._id || (item as any).addOn;
      if (!addonId) return;
      selections[String(addonId)] = {
        quantity: item.quantity > 0 ? 1 : 0,
        ...(item.selectedTierIndex !== undefined
          ? { selectedTierIndex: item.selectedTierIndex }
          : {}),
      };
    });
    setAddonSelections(selections);
  }, [reservation, visible]);

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      translateY.setValue(height);
      opacity.setValue(0);
    };
  }, [opacity, translateY, visible]);

  useEffect(() => {
    if (!visible) return;

    const fetchAddons = async () => {
      setIsLoadingAddons(true);
      try {
        const result = await addonService.getAll("?status=active");
        setAddons(extractAddonData(result));
      } catch (error) {
        console.log("[PendingReservationEditSheet] add-ons:", error);
        setAddons([]);
      } finally {
        setIsLoadingAddons(false);
      }
    };

    fetchAddons();
  }, [visible]);

  useEffect(() => {
    if (!timeModalVisible || !timeModalField || !office?._id) return;
    const dateToFetch = timeModalField === "pickupTime" ? pickupDate : returnDate;
    if (!dateToFetch) return;

    const fetchReservedSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const dateStr = formatDateForStorage(dateToFetch);
        const type = timeModalField === "pickupTime" ? "start" : "end";
        const baseUrl = process.env.EXPO_PUBLIC_RESERVATIONS_BY_OFFICE_API;
        if (!baseUrl) {
          setReservedSlots([]);
          return;
        }

        const token = await AsyncStorage.getItem("authToken");
        const response = await safeFetch(
          `${baseUrl}?office=${office._id}&${
            type === "start" ? "startDate" : "endDate"
          }=${dateStr}&type=${type}${reservation?._id ? `&excludeReservation=${reservation._id}` : ""}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        const data = await response.json();
        const slots = Array.isArray(data?.data?.reservedSlots)
          ? data.data.reservedSlots
          : [];

        setReservedSlots(
          slots.filter((slot: ReservedSlot) =>
            type === "start" ? slot.startDate === dateStr : slot.endDate === dateStr,
          ),
        );
      } catch (error) {
        console.log("[PendingReservationEditSheet] reserved slots:", error);
        setReservedSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchReservedSlots();
  }, [office?._id, pickupDate, returnDate, reservation?._id, timeModalField, timeModalVisible]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(timePhaseSlide, {
        toValue: timeModalField === "returnTime" ? 26 : -26,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.spring(timePhaseSlide, {
        toValue: 0,
        tension: 62,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [timeModalField, timePhaseSlide]);

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDateModalVisible(false);
      setTimeModalVisible(false);
      setTimeModalField(null);
      onClose();
    });
  };

  const openDatePicker = (phase: DatePhase) => {
    if (!office?._id) {
      Alert.alert("Office missing", "This reservation does not have an office.");
      return;
    }

    Haptics.selectionAsync();
    const nextPhase = phase === "return" && !pickupDate ? "pickup" : phase;
    setSelectingDate(nextPhase);
    setTempPickupDate(nextPhase === "return" ? pickupDate : null);
    setDateModalVisible(true);
  };

  const openTimePicker = (field: TimeField) => {
    if (!office?._id) {
      Alert.alert("Office missing", "This reservation does not have an office.");
      return;
    }

    const dateToCheck = field === "pickupTime" ? pickupDate : returnDate;
    if (!dateToCheck) {
      Alert.alert("Select dates first", "Please choose pickup and return dates.");
      return;
    }

    Haptics.selectionAsync();
    setTimeModalField(field);
    setTimeModalVisible(true);
  };

  const handleDateSelect = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (office && isDateDisabled(date, office)) {
      Alert.alert("Office closed", "The selected date is not available.");
      return;
    }

    if (selectingDate === "pickup") {
      if (dateString < getMinimumPickupDateInput()) {
        Alert.alert(
          "Pickup date unavailable",
          "Please choose a pickup date that matches our UK booking cut-off.",
        );
        return;
      }

      setPickupDate(date);
      setTempPickupDate(date);
      if (returnDate && returnDate < date) {
        setReturnDate(null);
        setReturnTime("");
      }
      setPickupTime("");
      setReturnTime("");
      setSelectingDate("return");
      return;
    }

    const currentPickup = tempPickupDate || pickupDate;
    if (currentPickup && date < currentPickup) {
      Alert.alert("Invalid date", "Return date must be after pickup date.");
      return;
    }

    setReturnDate(date);
    setReturnTime("");
    setDateModalVisible(false);
    setSelectingDate("pickup");
    setTempPickupDate(null);
  };

  const selectTime = (time: string) => {
    Haptics.selectionAsync();
    if (timeModalField === "pickupTime") {
      setPickupTime(time);
      if (returnDate) {
        setTimeModalField("returnTime");
      } else {
        setTimeModalVisible(false);
        setTimeModalField(null);
      }
      return;
    }

    if (pickupDate && returnDate && pickupTime) {
      const start = buildLocalDateTime(pickupDate, pickupTime);
      const end = buildLocalDateTime(returnDate, time);
      const diffHours =
        start && end ? (end.getTime() - start.getTime()) / 3_600_000 : 0;

      if (diffHours < 6) {
        Alert.alert(
          "Minimum rental period",
          "Minimum rental period is 6 hours. Please select a later return time.",
        );
        return;
      }
    }

    setReturnTime(time);
    setTimeModalVisible(false);
    setTimeModalField(null);
  };

  const toggleAddon = (addon: AddOn) => {
    setAddonSelections((current) => {
      const next = { ...current };
      if (next[addon._id]?.quantity) {
        delete next[addon._id];
        return next;
      }

      if (
        addon.type &&
        Object.entries(next).some(([selectedId, selection]) => {
          if (selectedId === addon._id || Number(selection.quantity || 0) <= 0) {
            return false;
          }
          const selectedAddon = visibleAddons.find(
            (item) => item._id === selectedId,
          );
          return selectedAddon?.type === addon.type;
        })
      ) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showToast({
          type: "info",
          title: "Add-on already selected",
          message: "Only one option from this add-on type can be selected.",
        });
        return next;
      }

      const selectedTierIndex = getMatchingAddonTierIndex(addon, rentalDays);
      next[addon._id] = {
        quantity: 1,
        ...(selectedTierIndex !== undefined ? { selectedTierIndex } : {}),
      };
      return next;
    });
  };

  const saveChanges = async () => {
    if (!reservation?._id || !pickupDate || !returnDate || !bookingPrice) return;

    if (!canSave) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast({
        type: "error",
        title: "Check booking details",
        message: !isDriverAgeValid
          ? `Driver age must be between ${minDriverAge} and 80.`
          : "Please complete all required fields.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const addonsForPayload = Object.entries(addonSelections)
        .filter(([, selection]) => Number(selection.quantity || 0) > 0)
        .map(([addonId, selection]) => {
          const addon = mergedAddons.find((item) => item._id === addonId);
          const selectedTierIndex =
            selection.selectedTierIndex ??
            (addon ? getMatchingAddonTierIndex(addon, rentalDays) : undefined);

          return {
            addOn: addonId,
            quantity: 1,
            ...(selectedTierIndex !== undefined ? { selectedTierIndex } : {}),
          };
        });

      const result = await reservationService.update(reservation._id, {
        startDate: createLondonDateTime(pickupDate, pickupTime),
        endDate: createLondonDateTime(returnDate, returnTime),
        startDateDisplay: formatDateForStorage(pickupDate),
        endDateDisplay: formatDateForStorage(returnDate),
        pickupTime,
        returnTime,
        driverAge: ageNumber,
        dirverAge: ageNumber,
        totalPrice: bookingPrice.totalPrice,
        addOns: addonsForPayload,
        selectedGear,
        pickupExtensionPrice: extensionPrices.pickupExtension,
        returnExtensionPrice: extensionPrices.returnExtension,
        messege: message.trim(),
        message: message.trim(),
      });

      if (!result?.success) {
        throw new Error(result?.error || result?.message || "Update failed");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeWithAnimation();
      onUpdated?.();
    } catch (error) {
      showToast({
        type: "error",
        title: "Update failed",
        message:
          error instanceof Error
            ? error.message
            : "Could not update this reservation.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderDateValue = () => {
    if (pickupDate && returnDate) {
      return `${formatCalendarLabel(pickupDate)}  ->  ${formatCalendarLabel(returnDate)}`;
    }
    return "Choose pickup and return";
  };

  const renderMarkedDates = () => {
    const marked: Record<string, any> = {};
    const currentPickup = tempPickupDate || pickupDate;

    if (currentPickup && returnDate && selectingDate === "pickup") {
      const current = new Date(currentPickup);
      const end = new Date(returnDate);

      while (current <= end) {
        const dateStr = formatDateForStorage(current);
        const isStart = current.toDateString() === currentPickup.toDateString();
        const isEnd = current.toDateString() === end.toDateString();

        marked[dateStr] = {
          color: isStart || isEnd ? ACCENT : "rgba(254,154,0,0.28)",
          textColor: "#ffffff",
          startingDay: isStart,
          endingDay: isEnd,
        };
        current.setDate(current.getDate() + 1);
      }
    } else if (currentPickup) {
      marked[formatDateForStorage(currentPickup)] = {
        color: ACCENT,
        textColor: "#ffffff",
        startingDay: true,
        endingDay: !returnDate,
      };
    }

    if (returnDate) {
      marked[formatDateForStorage(returnDate)] = {
        color: selectingDate === "return" ? RETURN_ACCENT : ACCENT,
        textColor: "#ffffff",
        startingDay: !currentPickup,
        endingDay: true,
      };
    }

    const todayInput = formatDateInputInLondon();
    const minAllowedDateInput = getMinimumPickupDateInput();
    const pickupInput = pickupDate ? formatDateForStorage(pickupDate) : "";

    for (let index = 0; index < 90; index += 1) {
      const dateStr = addDaysToDateInput(todayInput, index);
      const checkDate = new Date(`${dateStr}T12:00:00Z`);
      const disabledByPickup =
        selectingDate === "pickup" && dateStr < minAllowedDateInput;
      const disabledByReturn =
        selectingDate === "return" && pickupInput && dateStr < pickupInput;
      const disabledByOffice = office ? isDateDisabled(checkDate, office) : false;

      if (disabledByPickup || disabledByReturn || disabledByOffice) {
        marked[dateStr] = {
          ...(marked[dateStr] || {}),
          disabled: true,
          disableTouchEvent: true,
        };
      }
    }

    return marked;
  };

  const renderTimeSlots = () => {
    const isPickup = timeModalField === "pickupTime";
    const dateToCheck = isPickup ? pickupDate : returnDate;
    const slots = getAvailableTimeSlots(
      dateToCheck,
      office,
      isPickup ? "pickup" : "return",
    );
    let times = slots.slots;
    const selectedTime = isPickup ? pickupTime : returnTime;
    const dateInput = dateToCheck ? formatDateForStorage(dateToCheck) : "";
    const originalDateInput = isPickup
      ? reservation?.startDateDisplay || formatDateInputInLondon(reservation?.startDate)
      : reservation?.endDateDisplay || formatDateInputInLondon(reservation?.endDate);
    const originalTime = isPickup
      ? getTimeFromReservation(reservation?.pickupTime, reservation?.startDate)
      : getTimeFromReservation(reservation?.returnTime, reservation?.endDate);

    if (!isPickup && pickupDate && returnDate && pickupTime) {
      const isSameDay = pickupDate.toDateString() === returnDate.toDateString();
      if (isSameDay) {
        const [pH, pM] = pickupTime.split(":").map(Number);
        const minReturnMinutes = pH * 60 + pM + 360;
        times = times.filter((time) => {
          const [rH, rM] = time.split(":").map(Number);
          return rH * 60 + rM >= minReturnMinutes;
        });
      }
    }

    if (isLoadingSlots) {
      return (
        <View style={styles.slotsLoading}>
          <ActivityIndicator size="small" color={isPickup ? ACCENT : RETURN_ACCENT} />
          <Text style={styles.slotsLoadingText}>Checking available slots...</Text>
        </View>
      );
    }

    if (!times.length) {
      return (
        <View style={styles.slotsLoading}>
          <Ionicons name="time-outline" size={20} color="#94a3b8" />
          <Text style={styles.slotsLoadingText}>No time slots available</Text>
        </View>
      );
    }

    return (
      <View style={styles.slotsGrid}>
        {times.map((time) => {
          const isOriginalSlot = dateInput === originalDateInput && time === originalTime;
          const isReserved = reservedSlots.some((slot) => {
            if (isOriginalSlot) return false;
            return isPickup ? slot.startTime === time : slot.endTime === time;
          });
          const isSelected = selectedTime === time;
          const isExtension =
            Boolean(slots.specialDay?.extraPrice) ||
            slots.normalStart === slots.normalEnd ||
            (slots.normalStart &&
              slots.normalEnd &&
              (time < slots.normalStart || time > slots.normalEnd));
          const extensionPrice =
            slots.specialDay?.extraPrice ||
            slots.extensionRanges.find(
              (range) => time >= range.startTime && time <= range.endTime,
            )?.flatPrice ||
            0;

          return (
            <Pressable
              key={time}
              disabled={isReserved}
              onPress={() => selectTime(time)}
              style={({ pressed }) => [
                styles.timeSlot,
                isSelected && [
                  styles.timeSlotSelected,
                  !isPickup && styles.timeSlotReturnSelected,
                ],
                isReserved && styles.timeSlotDisabled,
                pressed && !isReserved && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.slotDot,
                  {
                    backgroundColor: isReserved
                      ? "#ef4444"
                      : isExtension
                        ? "#fbbf24"
                        : "#22c55e",
                  },
                ]}
              />
              <Text
                style={[
                  styles.timeSlotText,
                  isSelected && styles.timeSlotSelectedText,
                ]}
              >
                {time}
              </Text>
              {isExtension && extensionPrice > 0 ? (
                <Text
                  style={[
                    styles.extensionText,
                    isSelected && styles.extensionTextSelected,
                  ]}
                >
                  +GBP {extensionPrice.toFixed(2)}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeWithAnimation}
      >
        <Pressable style={styles.overlay} onPress={closeWithAnimation}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} />
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          pointerEvents="box-none"
          style={StyleSheet.absoluteFill}
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, 14),
                transform: [{ translateY }],
              },
            ]}
          >
            <LinearGradient
              colors={["#132033", "#0b1424", "#08111d"]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.topGlow} />

            <View {...panResponder.panHandlers} style={styles.handleArea}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="create-outline" size={20} color={ACCENT} />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.kicker}>Pending reservation</Text>
                <Text style={styles.title}>Edit booking details</Text>
              </View>
              <Pressable onPress={closeWithAnimation} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#e2e8f0" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <View style={styles.notice}>
                <Ionicons name="information-circle" size={17} color={ACCENT} />
                <Text style={styles.noticeText}>
                  You can change these details while the booking is still pending.
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle} numberOfLines={1}>
                  {category?.name || "Selected van"}
                </Text>
                <Text style={styles.summaryMeta} numberOfLines={1}>
                  {office?.name || "Office pending"}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rental time</Text>
                <Pressable
                  onPress={() => openDatePicker("pickup")}
                  style={({ pressed }) => [styles.dateSelector, pressed && styles.pressed]}
                >
                  <View style={styles.selectorIcon}>
                    <Ionicons name="calendar-outline" size={18} color={ACCENT} />
                  </View>
                  <View style={styles.selectorCopy}>
                    <Text style={styles.selectorLabel}>Pickup and return dates</Text>
                    <Text style={styles.selectorValue} numberOfLines={2}>
                      {renderDateValue()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </Pressable>

                <View style={styles.timeRow}>
                  <Pressable
                    onPress={() => openTimePicker("pickupTime")}
                    style={({ pressed }) => [
                      styles.timeButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons name="arrow-up-circle" size={18} color="#22c55e" />
                    <Text style={styles.timeButtonLabel}>Pickup</Text>
                    <Text style={styles.timeButtonValue}>{pickupTime || "--:--"}</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => openTimePicker("returnTime")}
                    style={({ pressed }) => [
                      styles.timeButton,
                      styles.timeButtonReturn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons name="arrow-down-circle" size={18} color={RETURN_ACCENT} />
                    <Text style={styles.timeButtonLabel}>Return</Text>
                    <Text style={styles.timeButtonValue}>{returnTime || "--:--"}</Text>
                  </Pressable>
                </View>

                {!isValidRental && pickupDate && returnDate && pickupTime && returnTime ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="warning-outline" size={16} color="#fca5a5" />
                    <Text style={styles.errorText}>
                      Minimum rental period is 6 hours.
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Driver age</Text>
                <View
                  style={[
                    styles.inputWrap,
                    !isDriverAgeValid && normalizedDriverAge && styles.inputError,
                  ]}
                >
                  <Ionicons name="person-outline" size={18} color={ACCENT} />
                  <TextInput
                    value={driverAge}
                    onChangeText={(value) => setDriverAge(sanitizeDriverAge(value))}
                    keyboardType="number-pad"
                    placeholder={`${minDriverAge}-80`}
                    placeholderTextColor="rgba(148,163,184,0.72)"
                    style={styles.input}
                  />
                </View>
                <Text style={styles.helperText}>
                  Driver age must be between {minDriverAge} and 80.
                </Text>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Add-ons</Text>
                  {isLoadingAddons ? (
                    <ActivityIndicator size="small" color={ACCENT} />
                  ) : null}
                </View>

                <View style={styles.addonsGrid}>
                  {visibleAddons.map((addon) => {
                    const selected = Boolean(addonSelections[addon._id]?.quantity);
                    const isTypeDisabled = !selected && hasSelectedAddonOfType(addon);
                    const imageUri = getAddonImageUri(addon);
                    const selectedTierIndex =
                      addonSelections[addon._id]?.selectedTierIndex ??
                      getMatchingAddonTierIndex(addon, rentalDays);
                    const price = getAddonPriceForDays(
                      addon,
                      rentalDays,
                      1,
                      selectedTierIndex,
                    );

                    return (
                      <Pressable
                        key={addon._id}
                        onPress={() => toggleAddon(addon)}
                        disabled={isTypeDisabled}
                        style={({ pressed }) => [
                          styles.addonCard,
                          selected && styles.addonCardSelected,
                          isTypeDisabled && styles.addonCardDisabled,
                          pressed && !isTypeDisabled && styles.pressed,
                        ]}
                      >
                        <View style={styles.addonImageWrap}>
                          {imageUri ? (
                            <Image
                              source={{ uri: imageUri }}
                              style={styles.addonImage}
                              contentFit="cover"
                              transition={180}
                            />
                          ) : (
                            <View style={styles.addonFallback}>
                              <Ionicons name="add-circle-outline" size={24} color={ACCENT} />
                            </View>
                          )}
                          <View style={styles.addonCheck}>
                            <Ionicons
                              name={selected ? "checkmark-circle" : "ellipse-outline"}
                              size={19}
                              color={
                                selected
                                  ? "#22c55e"
                                  : isTypeDisabled
                                    ? "#64748b"
                                    : "#cbd5e1"
                              }
                            />
                          </View>
                        </View>
                        <Text style={styles.addonName} numberOfLines={2}>
                          {addon.name}
                        </Text>
                        {isTypeDisabled ? (
                          <Text style={styles.addonLockedText} numberOfLines={2}>
                            Another option of this type is selected
                          </Text>
                        ) : null}
                        <Text style={styles.addonPrice}>GBP {price.toFixed(2)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Message</Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  textAlignVertical="top"
                  placeholder="Optional note for the booking team"
                  placeholderTextColor="rgba(148,163,184,0.72)"
                  style={[styles.input, styles.messageInput]}
                />
              </View>

              {bookingPrice && (
                <View style={styles.breakdown}>
                  <Text style={styles.sectionTitle}>Price breakdown</Text>
                  {[
                    { label: "Van hire", value: bookingPrice.daysPrice },
                    ...(bookingPrice.extraHoursPrice > 0 ? [{ label: "Extra hours", value: bookingPrice.extraHoursPrice }] : []),
                    ...(bookingPrice.gearExtraPrice > 0 ? [{ label: "Automatic gearbox", value: bookingPrice.gearExtraPrice }] : []),
                    ...addonLineItems.map((item) => ({ label: item.name, value: item.price })),
                    ...(bookingPrice.pickupExtensionPrice > 0 ? [{ label: "Pickup extension", value: bookingPrice.pickupExtensionPrice }] : []),
                    ...(bookingPrice.returnExtensionPrice > 0 ? [{ label: "Return extension", value: bookingPrice.returnExtensionPrice }] : []),
                    { label: "Service charge", value: bookingPrice.serviceCharge },
                  ].map((item, index) => (
                    <View key={`${item.label}-${index}`} style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>{item.label}</Text>
                      <Text style={styles.breakdownValue}>GBP {item.value.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.pricePanel}>
                <View>
                  <Text style={styles.priceLabel}>Updated total</Text>
                  <Text style={styles.priceSubLabel}>
                    {bookingPrice
                      ? `${bookingPrice.totalDays} day(s), add-ons included`
                      : "Select dates and times"}
                  </Text>
                </View>
                <Text style={styles.priceValue}>
                  GBP {(bookingPrice?.totalPrice ?? reservation?.totalPrice ?? 0).toFixed(2)}
                </Text>
              </View>

              <Pressable
                onPress={saveChanges}
                disabled={!canSave}
                style={({ pressed }) => [
                  styles.saveButton,
                  !canSave && styles.saveButtonDisabled,
                  pressed && canSave && styles.pressed,
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color={DARK} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={19} color={DARK} />
                    <Text style={styles.saveButtonText}>Save changes</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={dateModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDateModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setDateModalVisible(false)}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.calendarBox}
          >
            <BookingCalendarChrome
              phase={selectingDate}
              selectedLabel={
                selectingDate === "pickup"
                  ? formatCalendarLabel(pickupDate)
                  : formatCalendarLabel(returnDate)
              }
              onClose={() => setDateModalVisible(false)}
            >
              <Calendar
                hideExtraDays
                enableSwipeMonths
                minDate={
                  selectingDate === "pickup"
                    ? getMinimumPickupDateInput()
                    : pickupDate
                      ? formatDateForStorage(pickupDate)
                      : getMinimumPickupDateInput()
                }
                maxDate={
                  selectingDate === "return" && pickupDate
                    ? addDaysToDateInput(formatDateForStorage(pickupDate), 30)
                    : undefined
                }
                onDayPress={(day) => handleDateSelect(day.dateString)}
                markedDates={renderMarkedDates()}
                markingType="period"
                theme={BOOKING_CALENDAR_THEME}
              />
            </BookingCalendarChrome>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={timeModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setTimeModalVisible(false);
            setTimeModalField(null);
          }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.timeSheet,
              timeModalField === "returnTime" && styles.timeSheetReturn,
            ]}
          >
            <LinearGradient
              colors={
                timeModalField === "returnTime"
                  ? ["#102536", "#0b1826", "#07101c"]
                  : ["#121b29", "#0b1421", "#08111d"]
              }
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.timeHeader}>
              <View>
                <Text
                  style={[
                    styles.timeTitle,
                    timeModalField === "returnTime" && styles.timeTitleReturn,
                  ]}
                >
                  {timeModalField === "returnTime" ? "Return Time" : "Pickup Time"}
                </Text>
                <Text style={styles.timeSubtitle}>
                  {timeModalField === "returnTime"
                    ? "Step 2 of 2 - choose when the van comes back"
                    : "Step 1 of 2 - choose when the van is collected"}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setTimeModalVisible(false);
                  setTimeModalField(null);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#e2e8f0" />
              </Pressable>
            </View>

            <View style={styles.timePhaseRow}>
              <View
                style={[
                  styles.timePhasePill,
                  timeModalField === "pickupTime" && styles.timePhaseActive,
                ]}
              >
                <Ionicons
                  name={
                    timeModalField === "returnTime"
                      ? "checkmark-circle"
                      : "radio-button-on"
                  }
                  size={14}
                  color={timeModalField === "returnTime" ? "#22c55e" : ACCENT}
                />
                <Text style={styles.timePhaseText}>Pickup</Text>
              </View>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={timeModalField === "returnTime" ? RETURN_ACCENT : "#64748b"}
              />
              <View
                style={[
                  styles.timePhasePill,
                  timeModalField === "returnTime" && styles.timePhaseReturnActive,
                ]}
              >
                <Ionicons
                  name={
                    timeModalField === "returnTime"
                      ? "radio-button-on"
                      : "ellipse-outline"
                  }
                  size={14}
                  color={timeModalField === "returnTime" ? RETURN_ACCENT : "#94a3b8"}
                />
                <Text style={styles.timePhaseText}>Return</Text>
              </View>
            </View>

            <Animated.View
              style={[
                styles.timeAnimatedPane,
                {
                  transform: [{ translateX: timePhaseSlide }],
                },
              ]}
            >
              <ScrollView
                style={styles.slotsScroll}
                showsVerticalScrollIndicator
                nestedScrollEnabled
                contentContainerStyle={styles.slotsContent}
              >
                {renderTimeSlots()}
              </ScrollView>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.76)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: height * 0.92,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  topGlow: {
    position: "absolute",
    left: 28,
    right: 28,
    top: -48,
    height: 120,
    borderRadius: 80,
    backgroundColor: "rgba(254,154,0,0.14)",
  },
  handleArea: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.24)",
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  content: {
    padding: 18,
    gap: 14,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(254,154,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.2)",
  },
  noticeText: {
    flex: 1,
    color: "#fed7aa",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  summaryCard: {
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  summaryTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  summaryMeta: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  section: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "900",
  },
  dateSelector: {
    minHeight: 66,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  selectorIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.12)",
  },
  selectorCopy: {
    flex: 1,
    minWidth: 0,
  },
  selectorLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  selectorValue: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  timeRow: {
    flexDirection: "row",
    gap: 10,
  },
  timeButton: {
    flex: 1,
    minHeight: 76,
    borderRadius: 16,
    padding: 12,
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.18)",
  },
  timeButtonReturn: {
    backgroundColor: "rgba(56,189,248,0.08)",
    borderColor: "rgba(56,189,248,0.2)",
  },
  timeButtonLabel: {
    color: "#cbd5e1",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 5,
    textTransform: "uppercase",
  },
  timeButtonValue: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 11,
    borderRadius: 13,
    backgroundColor: "rgba(239,68,68,0.13)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.25)",
  },
  errorText: {
    flex: 1,
    color: "#fecaca",
    fontSize: 12,
    fontWeight: "800",
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  inputError: {
    borderColor: "rgba(248,113,113,0.4)",
    backgroundColor: "rgba(239,68,68,0.09)",
  },
  input: {
    flex: 1,
    minHeight: 42,
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800",
  },
  messageInput: {
    minHeight: 86,
    padding: 12,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    fontWeight: "700",
  },
  helperText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
  },
  addonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  addonCard: {
    width: "48%",
    minHeight: 158,
    borderRadius: 16,
    padding: 9,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  addonCardSelected: {
    borderColor: "rgba(34,197,94,0.55)",
    backgroundColor: "rgba(34,197,94,0.1)",
  },
  addonCardDisabled: {
    opacity: 0.46,
    borderColor: "rgba(100,116,139,0.2)",
  },
  addonImageWrap: {
    height: 88,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: "rgba(2,6,23,0.55)",
    marginBottom: 8,
  },
  addonImage: {
    width: "100%",
    height: "100%",
  },
  addonFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addonCheck: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,6,23,0.72)",
  },
  addonName: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
    minHeight: 31,
  },
  addonPrice: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  addonLockedText: {
    color: "#94a3b8",
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "800",
    marginTop: 3,
  },
  pricePanel: {
    minHeight: 72,
    borderRadius: 17,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.24)",
  },
  breakdown: { paddingHorizontal: 2, marginBottom: 10 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, paddingVertical: 4 },
  breakdownLabel: { flex: 1, color: "#cbd5e1", fontSize: 12 },
  breakdownValue: { color: "#f8fafc", fontSize: 12, fontWeight: "700" },
  priceLabel: {
    color: "#bbf7d0",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  priceSubLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  priceValue: {
    color: "#22c55e",
    fontSize: 20,
    fontWeight: "900",
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: ACCENT,
    borderWidth: 1,
    borderColor: "rgba(255,218,150,0.55)",
  },
  saveButtonDisabled: {
    opacity: 0.48,
  },
  saveButtonText: {
    color: DARK,
    fontSize: 14,
    fontWeight: "900",
  },
  calendarBox: {
    marginHorizontal: 14,
    marginTop: "auto",
    marginBottom: 28,
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "#0b1424",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  timeSheet: {
    marginHorizontal: 12,
    marginTop: "auto",
    marginBottom: 24,
    height: Math.min(height * 0.82, 700),
    maxHeight: Math.min(height * 0.82, 700),
    borderRadius: 24,
    overflow: "hidden",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.18)",
  },
  timeSheetReturn: {
    borderColor: "rgba(56,189,248,0.24)",
  },
  timeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  timeTitle: {
    color: ACCENT,
    fontSize: 20,
    fontWeight: "900",
  },
  timeTitleReturn: {
    color: RETURN_ACCENT,
  },
  timeSubtitle: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  timePhaseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  timePhasePill: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  timePhaseActive: {
    borderColor: "rgba(254,154,0,0.42)",
    backgroundColor: "rgba(254,154,0,0.1)",
  },
  timePhaseReturnActive: {
    borderColor: "rgba(56,189,248,0.44)",
    backgroundColor: "rgba(56,189,248,0.1)",
  },
  timePhaseText: {
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: "900",
  },
  timeAnimatedPane: {
    flex: 1,
    minHeight: 0,
  },
  slotsScroll: {
    flex: 1,
  },
  slotsContent: {
    paddingBottom: 8,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  timeSlot: {
    width: "31%",
    minHeight: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  timeSlotSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  timeSlotReturnSelected: {
    backgroundColor: RETURN_ACCENT,
    borderColor: RETURN_ACCENT,
  },
  timeSlotDisabled: {
    opacity: 0.38,
  },
  slotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timeSlotText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
  },
  timeSlotSelectedText: {
    color: DARK,
  },
  extensionText: {
    color: "#fbbf24",
    fontSize: 9,
    fontWeight: "800",
  },
  extensionTextSelected: {
    color: DARK,
  },
  slotsLoading: {
    minHeight: 190,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  slotsLoadingText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});

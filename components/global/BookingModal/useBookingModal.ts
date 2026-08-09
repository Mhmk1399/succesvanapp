import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/global/AppToast";
import { addonService } from "@/services/addonService";
import { officeService } from "@/services/officeService";
import { reservationService } from "@/services/reservationService";
import { AddOn, Category, Office } from "@/types/type";
import {
  calculateBookingPrice,
  getAddonLineItems,
  getMatchingAddonTierIndex,
  getMinDriverAge,
} from "@/utils/bookingPrice";
import { calculateOfficeExtensionPrices } from "@/utils/bookingSchedule";
import {
  createLondonDateTime,
  formatDateForStorage,
  getMinimumPickupDateInput,
  syncServerClock,
} from "@/utils/londonTime";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { discountService } from "@/services/discountService";

const buildLocalDateTime = (date: Date | null, time: string) => {
  if (!date || !time) return null;
  const [hour, minute] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
};

const parseStoredDate = (displayDate?: string, isoDate?: string) => {
  const source = displayDate || isoDate;
  if (!source) return null;
  const datePart = source.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const sanitizeDriverAge = (value?: string | number | null) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 2);

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
    pickupExtensionFee?: number;
    returnExtensionFee?: number;
    startDateDisplay?: string;
    endDateDisplay?: string;
  },
  onReservationComplete?: () => void,
  discountData?: any
) => {
  const hasPrefilledData = !!prefilledData;
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loginRequiredVisible, setLoginRequiredVisible] = useState(false);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState<Date | null>(() => {
    return parseStoredDate(
      prefilledData?.startDateDisplay,
      prefilledData?.pickupDate,
    );
  });
  const [pickupTime, setPickupTime] = useState<string>(
    prefilledData?.pickupTime || ""
  );
  const [returnDate, setReturnDate] = useState<Date | null>(() => {
    return parseStoredDate(
      prefilledData?.endDateDisplay,
      prefilledData?.returnDate,
    );
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
    Record<string, { quantity: number; tierId?: string; selectedTierIndex?: number }>
  >({});
  const [offices, setOffices] = useState<Office[]>([]);
  const [filteredOffices, setFilteredOffices] = useState<Office[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<string>(
    prefilledData?.office || ""
  );
  const [officeModalVisible, setOfficeModalVisible] = useState(false);
  const [driverAge, setDriverAge] = useState(
    sanitizeDriverAge(prefilledData?.driverAge)
  );
  const [message, setMessage] = useState("");
  const [dynamicVanPrice, setDynamicVanPrice] = useState<number>(0);
  const [selectedGear, setSelectedGear] = useState<"manual" | "automatic">(
    "manual"
  );
  const minDriverAge = useMemo(
    () => getMinDriverAge((van as any)?.type?.name || van?.name),
    [van],
  );

  const selectedOfficeObject = useMemo(
    () => getSelectedOffice(offices, selectedOffice),
    [offices, selectedOffice],
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
    if (hasPrefilledData) {
      return {
        pickupExtension: prefilledData?.pickupExtensionFee || 0,
        returnExtension: prefilledData?.returnExtensionFee || 0,
      };
    }

    if (!selectedOfficeObject) {
      return { pickupExtension: 0, returnExtension: 0 };
    }

    return calculateOfficeExtensionPrices({
      office: selectedOfficeObject,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
    });
  }, [
    hasPrefilledData,
    pickupDate,
    pickupTime,
    prefilledData?.pickupExtensionFee,
    prefilledData?.returnExtensionFee,
    returnDate,
    returnTime,
    selectedOfficeObject,
  ]);

  const baseBookingPrice = useMemo(
    () =>
      calculateBookingPrice({
        startDate: localStartDate,
        endDate: localEndDate,
        pricingTiers: van?.pricingTiers || [],
        extraHoursRate: van?.extraHoursRate || 0,
        pickupExtensionPrice: extensionPrices.pickupExtension,
        returnExtensionPrice: extensionPrices.returnExtension,
        gearExtraCostPerDay:
          selectedGear === "automatic" &&
          typeof van?.gear === "object" &&
          van.gear.availableTypes?.includes("automatic") &&
          van.gear.availableTypes?.includes("manual")
            ? van.gear.automaticExtraCost || 0
            : 0,
        sellOffer: (van as any)?.selloffer || 0,
      }),
    [
      extensionPrices.pickupExtension,
      extensionPrices.returnExtension,
      localEndDate,
      localStartDate,
      selectedGear,
      van,
    ],
  );

  const addonLineItems = useMemo(
    () =>
      getAddonLineItems(
        addons,
        addonSelections,
        baseBookingPrice?.totalDays || 1,
      ),
    [addonSelections, addons, baseBookingPrice?.totalDays],
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
        pricingTiers: van?.pricingTiers || [],
        extraHoursRate: van?.extraHoursRate || 0,
        pickupExtensionPrice: extensionPrices.pickupExtension,
        returnExtensionPrice: extensionPrices.returnExtension,
        gearExtraCostPerDay:
          selectedGear === "automatic" &&
          typeof van?.gear === "object" &&
          van.gear.availableTypes?.includes("automatic") &&
          van.gear.availableTypes?.includes("manual")
            ? van.gear.automaticExtraCost || 0
            : 0,
        addOnsPrice,
        sellOffer: (van as any)?.selloffer || 0,
        discountPercentage: discountData?.percentage || 0,
      }),
    [
      addOnsPrice,
      discountData?.percentage,
      extensionPrices.pickupExtension,
      extensionPrices.returnExtension,
      localEndDate,
      localStartDate,
      selectedGear,
      van,
    ],
  );

  useEffect(() => {
    setDynamicVanPrice(bookingPrice?.totalPrice || 0);
  }, [bookingPrice?.totalPrice]);

  // Reset when modal opens/closes if desired
  useEffect(() => {
    if (visible) {
      syncServerClock().catch(() => {});
      setTermsAccepted(false);
    }
  }, [visible]);

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
      setName([user.name, user.lastName].filter(Boolean).join(" ") || "");
      setLastName(user.lastName || "");
      setEmail(user.emaildata?.emailAddress || "");
      setPhone(user.phoneData?.phoneNumber || "");
    }
  }, [user]);

  useEffect(() => {
    if (prefilledData?.pickupDate) {
      const d = new Date(prefilledData.pickupDate);
      const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      setPickupDate(localDate);
    }
    if (prefilledData?.returnDate) {
      const d = new Date(prefilledData.returnDate);
      const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      setReturnDate(localDate);
    }
    if (prefilledData?.driverAge) {
      setDriverAge(sanitizeDriverAge(prefilledData.driverAge));
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
          addonService.getAll("?status=active"),
          officeService.getAll("?status=active"),
        ]);
        const addonData = Array.isArray(addonsResult?.data?.data)
          ? addonsResult.data.data
          : Array.isArray(addonsResult?.data)
            ? addonsResult.data
            : Array.isArray(addonsResult)
              ? addonsResult
              : [];
        setAddons(addonData);
        const allOffices = officesResult.data || [];
        setOffices(allOffices);

        // Filter offices based on van category
        if (!hasPrefilledData && van?.id) {
          const filtered = allOffices.filter((office: Office) => {
            const categoryIds = Array.isArray(office.categories)
              ? office.categories.map((c: Category) => c._id || c)
              : [];
            return categoryIds.includes(van.id);
          });
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

        if (data.success && data.data?.reservedSlots) {
          // Filter slots to only those that match the exact date
          const filteredSlots = data.data.reservedSlots.filter(
            (slot: {
              startDate: string;
              endDate: string;
              startTime: string;
              endTime: string;
              isSameDay: boolean;
            }) => {
              if (type === "start") {
                return slot.startDate === dateStr;
              } else {
                return slot.endDate === dateStr;
              }
            }
          );
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

  const openDatePicker = (
    initialSelection: "pickup" | "return" = "pickup",
  ) => {
    if (!selectedOffice) {
      Alert.alert("Select Office", "Please select an office first.");
      return;
    }
    Haptics.selectionAsync();
    const nextSelection =
      initialSelection === "return" && !pickupDate ? "pickup" : initialSelection;
    setSelectingDate(nextSelection);
    setTempPickupDate(nextSelection === "return" ? pickupDate : null);
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
      if (dateString < getMinimumPickupDateInput()) {
        Alert.alert(
          "Pickup date unavailable",
          "Please choose a pickup date that matches our UK booking cut-off.",
        );
        return;
      }

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
      if (returnDate) {
        setTimeModalField("returnTime");
        Haptics.selectionAsync();
      } else {
        setTimeModalVisible(false);
        setTimeModalField(null);
      }
      return;
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
      setLoginRequiredVisible(true);
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

    const normalizedDriverAge = sanitizeDriverAge(driverAge);
    const age = Number(normalizedDriverAge);
    if (
      !normalizedDriverAge ||
      !Number.isInteger(age) ||
      age < minDriverAge ||
      age > 80
    ) {
      newErrors.driverAge = `Driver age must be between ${minDriverAge} and 80`;
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

      const startDateTime = createLondonDateTime(pickupDate!, pickupTime);
      const endDateTime = createLondonDateTime(returnDate!, returnTime);

      console.log("[BookingModal.handleSubmit] Dates before reservation:", {
        pickupDate: formatDateForStorage(pickupDate!),
        returnDate: formatDateForStorage(returnDate!),
        startDateTime,
        endDateTime,
      });

      const addonsForPayload = Object.entries(addonSelections)
        .filter(([_, selection]) => Number(selection?.quantity || 0) > 0)
        .map(([addonId, selection]) => {
          const addon = addons.find((a) => a._id === addonId);
          const selectedTierIndex =
            selection.selectedTierIndex ??
            (addon
              ? getMatchingAddonTierIndex(addon, bookingPrice?.totalDays || 1)
              : undefined);
          return {
            addOn: addonId,
            quantity: 1,
            ...(selectedTierIndex !== undefined ? { selectedTierIndex } : {}),
          };
        });

      const categoryId = van?.id;

      const reservationData = {
        category: categoryId,
        office: hasPrefilledData ? prefilledData.office : selectedOffice,
        startDate: startDateTime,
        endDate: endDateTime,
        startDateDisplay:
          prefilledData?.startDateDisplay || formatDateForStorage(pickupDate!),
        endDateDisplay:
          prefilledData?.endDateDisplay || formatDateForStorage(returnDate!),
        pickupTime,
        returnTime,
        driverAge: age,
        dirverAge: age,
        totalPrice: bookingPrice?.totalPrice || 0,
        addOns: addonsForPayload,
        discountCode: discountData?.code || null,
        selectedGear,
        pickupExtensionPrice: extensionPrices.pickupExtension,
        returnExtensionPrice: extensionPrices.returnExtension,
        reservationType: "App" as const,
        messege: message.trim(),
        message: message.trim(),
      };
      console.log(reservationData, "reservationData");

      const result = await reservationService.create(userData, reservationData);

      if (result.success) {
        console.log("Reservation successful, checking discount:", {
          discountData,
          userId: user._id,
        });
        if (discountData?._id && user._id) {
          console.log("Applying discount:", discountData._id, user._id);
          const discountResult = await discountService.applyDiscount(
            discountData._id,
            user._id
          );
          console.log("Discount apply result:", discountResult);
        }
        await playSuccessSound();
        await scheduleNotification(van);
        handleClose();
        onReservationComplete?.();
        router.push("/dashboard?tab=reservations");
      } else {
        showToast({
          type: "error",
          title: "Booking failed",
          message: result.error || "Please check your booking details.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Booking failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
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
    bookingPrice,
    addonLineItems,
    minDriverAge,
    selectedGear,
    setSelectedGear,
    termsAccepted,
    setTermsAccepted,
    loginRequiredVisible,
    setLoginRequiredVisible,
    handleLoginRequiredLogin: () => {
      setLoginRequiredVisible(false);
      router.push("/register");
    },
    handleLoginRequiredCancel: () => setLoginRequiredVisible(false),
  };
};

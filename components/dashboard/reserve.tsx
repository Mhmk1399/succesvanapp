// components/dashboard/UserReservations.tsx
import { reservationService } from "@/services/reservationService";
import { Reservation, AddOn } from "@/types/type";
import { calculateAddonPrice } from "@/utils/addonCalculator";
import { calculatePrice } from "@/utils/priceCalculator";
import { addonService } from "@/services/addonService";
import { Ionicons } from "@expo/vector-icons";
import GlassView from "@/components/global/GlassView";
import { useToast } from "@/components/global/AppToast";
import ReservationJourneyModal from "@/components/dashboard/ReservationJourneyModal";
import ReservationPriceBreakdown from "@/components/dashboard/ReservationPriceBreakdown";
import { DEFAULT_SERVICE_CHARGE } from "@/utils/bookingPrice";
import PendingReservationEditSheet from "@/components/dashboard/PendingReservationEditSheet";
import { statusLabel, statusTone } from "@/constants/reservationStatus";
import { buildReservationJourney, formatMoney } from "@/utils/reservationJourney";
import {
  getInclusiveLondonDeadline,
  getMinimumPickupDateInput,
  getTrustedNowMs,
  syncServerClock,
} from "@/utils/londonTime";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { JSX } from "react/jsx-runtime";

const { height } = Dimensions.get("window");

const ACCENT = "#fe9a00";
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type UserReservationsProps = {
  reservations: Reservation[];
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  ListHeaderComponent?: React.ReactElement | null;
  onScroll?: (event: any) => void;
};

type WorkingTime = {
  day: string;
  isOpen: boolean;
  startTime?: string;
  endTime?: string;
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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const mins = date.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} · ${hours}:${mins}`;
};

const getApiOrigin = () => {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "";
  return baseUrl.replace(/\/api(?:\/.*)?$/i, "").replace(/\/$/, "");
};

const normalizeImageUri = (value: unknown): string | null => {
  if (!value) return null;

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return normalizeImageUri(
      record.url || record.uri || record.src || record.location,
    );
  }

  if (typeof value !== "string") return null;

  const imageValue = value.trim();
  if (!imageValue) return null;

  if (/^(https?:|file:|content:|data:image\/)/i.test(imageValue)) {
    return imageValue;
  }

  if (imageValue.startsWith("//")) {
    return `https:${imageValue}`;
  }

  const origin = getApiOrigin();
  if (imageValue.startsWith("/") && origin) {
    return `${origin}${imageValue}`;
  }

  if (/\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(imageValue) && origin) {
    return `${origin}/${imageValue.replace(/^\/+/, "")}`;
  }

  return null;
};

const getReservationVehicleImage = (reservation: Reservation) => {
  const vehicle = reservation.vehicle as any;
  const category = reservation.category as any;
  const candidates = [
    vehicle?.image,
    vehicle?.thumbnail,
    vehicle?.photo,
    Array.isArray(vehicle?.images) ? vehicle.images[0] : null,
    category?.image,
    category?.thumbnail,
    Array.isArray(category?.images) ? category.images[0] : null,
  ];

  for (const candidate of candidates) {
    const imageUri = normalizeImageUri(candidate);
    if (imageUri) return imageUri;
  }

  return null;
};

const formatCompactCountdown = (deadline: Date) => {
  const difference = Math.max(0, deadline.getTime() - getTrustedNowMs());
  if (difference === 0) return "Reached";

  const days = Math.floor(difference / DAY);
  const hours = Math.floor((difference % DAY) / HOUR);
  const minutes = Math.floor((difference % HOUR) / MINUTE);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
};

export default function UserReservations({
  reservations,
  isLoading = false,
  onRefresh,
  isRefreshing = false,
  ListHeaderComponent,
  onScroll,
}: UserReservationsProps) {
  const { showToast } = useToast();
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editPickupDate, setEditPickupDate] = useState<Date | null>(null);
  const [editPickupTime, setEditPickupTime] = useState("");
  const [editReturnDate, setEditReturnDate] = useState<Date | null>(null);
  const [editReturnTime, setEditReturnTime] = useState("");
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [selectingDate, setSelectingDate] = useState<"pickup" | "return">(
    "pickup",
  );
  const [timeModalField, setTimeModalField] = useState<
    "pickup" | "return" | null
  >(null);

  const [tempPickupDate, setTempPickupDate] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reservedSlots, setReservedSlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);
  const [dynamicPrice, setDynamicPrice] = useState(0);
  const [editMessage, setEditMessage] = useState("");
  const [isValidRental, setIsValidRental] = useState(true);
  const [rentalHours, setRentalHours] = useState(0);
  const [editAddonSelections, setEditAddonSelections] = useState<
    Record<string, number>
  >({});
  const [availableAddons, setAvailableAddons] = useState<AddOn[]>([]);
  const [trackingReservation, setTrackingReservation] =
    useState<Reservation | null>(null);
  const [pendingEditReservation, setPendingEditReservation] =
    useState<Reservation | null>(null);
  const [trackingInitialSection, setTrackingInitialSection] = useState<
    string | undefined
  >(undefined);
  const [, setTimerTick] = useState(0);
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    syncServerClock().catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((value) => value + 1);
    }, MINUTE);

    return () => clearInterval(interval);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeModal();
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
    if (selectedReservation) {
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
  }, [selectedReservation]);

  const closeModal = () => {
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
    ]).start(() => {
      setSelectedReservation(null);
      setIsEditing(false);
    });
  };

  const startEditing = () => {
    if (!selectedReservation) return;
    const pickup = new Date(selectedReservation.startDate);
    const returnD = new Date(selectedReservation.endDate);
    setEditPickupDate(pickup);
    setEditPickupTime(
      `${pickup.getHours().toString().padStart(2, "0")}:${pickup
        .getMinutes()
        .toString()
        .padStart(2, "0")}`,
    );
    setEditReturnDate(returnD);
    setEditReturnTime(
      `${returnD.getHours().toString().padStart(2, "0")}:${returnD
        .getMinutes()
        .toString()
        .padStart(2, "0")}`,
    );
    setEditMessage(selectedReservation.messege || "");

    const addonMap: Record<string, number> = {};
    selectedReservation.addOns?.forEach((addon) => {
      if (addon.addOn?._id) {
        addonMap[addon.addOn._id] = addon.quantity;
      }
    });
    setEditAddonSelections(addonMap);

    addonService.getAll().then((res) => {
      if (res.success) setAvailableAddons(res.data || []);
    });

    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const openPendingEdit = (reservation: Reservation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingEditReservation(reservation);
  };

  const openPendingEditFromDetails = () => {
    const reservationToEdit = selectedReservation;
    if (!reservationToEdit) return;
    closeModal();
    setTimeout(() => setPendingEditReservation(reservationToEdit), 260);
  };

  useEffect(() => {
    const fetchReservedSlots = async () => {
      if (
        !timeModalVisible ||
        !selectedReservation?.office?._id ||
        !timeModalField
      )
        return;
      const dateToFetch =
        timeModalField === "pickup" ? editPickupDate : editReturnDate;
      if (!dateToFetch) return;
      try {
        const dateStr = dateToFetch.toISOString().split("T")[0];
        const type = timeModalField === "pickup" ? "start" : "end";
        const url = `${
          process.env.EXPO_PUBLIC_RESERVATIONS_BY_OFFICE_API
        }?office=${selectedReservation.office._id}&${
          type === "start" ? "startDate" : "endDate"
        }=${dateStr}&type=${type}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && Array.isArray(data.data?.reservedSlots)) {
          const filteredSlots = data.data.reservedSlots.filter(
            (slot: {
              startDate: string;
              endDate: string;
              startTime: string;
              endTime: string;
            }) => {
              if (type === "start") {
                return slot.startDate === dateStr;
              } else {
                return slot.endDate === dateStr;
              }
            },
          );
          setReservedSlots(filteredSlots);
        } else {
          setReservedSlots([]);
        }
      } catch (error) {
        console.log("[reserve.tsx] Failed to fetch reserved slots:", error);
        setReservedSlots([]);
      }
    };
    fetchReservedSlots();
  }, [
    timeModalVisible,
    selectedReservation,
    timeModalField,
    editPickupDate,
    editReturnDate,
  ]);

  useEffect(() => {
    if (
      !isEditing ||
      !editPickupDate ||
      !editReturnDate ||
      !editPickupTime ||
      !editReturnTime ||
      !selectedReservation
    )
      return;
    const start = new Date(editPickupDate);
    const end = new Date(editReturnDate);
    const [pH, pM] = editPickupTime.split(":").map(Number);
    const [rH, rM] = editReturnTime.split(":").map(Number);
    start.setHours(pH, pM, 0, 0);
    end.setHours(rH, rM, 0, 0);

    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    setRentalHours(diffHours);
    setIsValidRental(diffHours >= 6);

    const vanPrice = calculatePrice(
      start,
      end,
      selectedReservation.category?.pricingTiers || [],
      selectedReservation.category?.extrahoursRate ||
        selectedReservation.category?.extraHoursRate ||
        0,
    );

    const reservationAddOns = Array.isArray(selectedReservation.addOns)
      ? selectedReservation.addOns.map((a) => a.addOn).filter(Boolean)
      : [];
    const allAddons = [
      ...reservationAddOns,
      ...(Array.isArray(availableAddons) ? availableAddons : []),
    ];
    const uniqueAddons = (Array.isArray(allAddons) ? allAddons : []).filter(
      (addon, index, self) =>
        addon && self.findIndex((a) => a?._id === addon._id) === index,
    );

    const addonsPrice = uniqueAddons.reduce((sum, addon) => {
      if (!addon || !editPickupDate || !editReturnDate) return sum;
      const quantity = editAddonSelections[addon._id] || 0;
      if (quantity === 0) return sum;
      const price = calculateAddonPrice(
        addon,
        editPickupDate,
        editReturnDate,
        editPickupTime,
        editReturnTime,
        quantity,
      );
      return sum + price;
    }, 0);

    setDynamicPrice(vanPrice + addonsPrice);
  }, [
    editPickupDate,
    editReturnDate,
    editPickupTime,
    editReturnTime,
    isEditing,
    selectedReservation,
    editAddonSelections,
    availableAddons,
  ]);

  const getAvailableTimeSlots = (
    date: Date | null,
    office: { _id: string; name: string; workingTime?: WorkingTime[] },
    isPickup: boolean,
  ) => {
    if (!office || !date)
      return {
        start: "00:00",
        end: "23:59",
        normalStart: "00:00",
        normalEnd: "23:59",
      };
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];
    const workingDay = office.workingTime?.find(
      (w: WorkingTime) => w.day === dayName,
    );
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

  const handleDateSelect = (dateString: string) => {
    const date = new Date(dateString);
    Haptics.selectionAsync();
    if (selectingDate === "pickup") {
      if (dateString < getMinimumPickupDateInput()) {
        Alert.alert(
          "Pickup date unavailable",
          "Please choose a pickup date that matches our UK booking cut-off.",
        );
        return;
      }
      setEditPickupDate(date);
      setTempPickupDate(date);
      setSelectingDate("return");
    } else {
      if (tempPickupDate && date < tempPickupDate) {
        Alert.alert("Invalid Date", "Return date must be after pickup date.");
        return;
      }
      setEditReturnDate(date);
      setDateModalVisible(false);
      setSelectingDate("pickup");
      setTempPickupDate(null);
    }
  };

  const selectTime = (time: string) => {
    Haptics.selectionAsync();
    if (timeModalField === "pickup") {
      setEditPickupTime(time);
    } else {
      if (editPickupDate && editReturnDate && editPickupTime) {
        const isSameDay =
          editPickupDate.toDateString() === editReturnDate.toDateString();
        if (isSameDay) {
          const [pH, pM] = editPickupTime.split(":").map(Number);
          const [rH, rM] = time.split(":").map(Number);
          const pickupMinutes = pH * 60 + pM;
          const returnMinutes = rH * 60 + rM;
          const diffMinutes = returnMinutes - pickupMinutes;
          if (diffMinutes < 360) {
            Alert.alert(
              "Minimum Rental Period",
              "Minimum 6 hours required for same-day rental.",
            );
            return;
          }
        }
      }
      setEditReturnTime(time);
    }
    setTimeModalVisible(false);
    setTimeModalField(null);
  };

  const saveChanges = async () => {
    if (!selectedReservation || !editPickupDate || !editReturnDate) return;

    const start = new Date(editPickupDate);
    const end = new Date(editReturnDate);
    const [pH, pM] = editPickupTime.split(":").map(Number);
    const [rH, rM] = editReturnTime.split(":").map(Number);
    start.setHours(pH, pM, 0, 0);
    end.setHours(rH, rM, 0, 0);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours < 6) {
      Alert.alert("Minimum Rental Period", "Minimum rental period is 6 hours.");
      return;
    }

    setIsUpdating(true);
    try {
      const updatedAddOns = Object.entries(editAddonSelections)
        .filter(([_, quantity]) => quantity > 0)
        .map(([addonId, quantity]) => ({
          addOn: addonId,
          quantity,
        }));

      const result = await reservationService.update(
        selectedReservation._id || "",
        {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          totalPrice: dynamicPrice,
          messege: editMessage.trim(),
          message: editMessage.trim(),
          addOns: updatedAddOns,
        },
      );

      if (result.success) {
        setIsEditing(false);
        closeModal();
        onRefresh?.();
      } else {
        showToast({
          type: "error",
          title: "Update failed",
          message: result.error || "Failed to update reservation",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Update failed",
        message: "Failed to update reservation",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  const renderStatus = (status: string) => {
    const label = statusLabel(status);
    const color = statusTone(status).fg;
    return (
      <View style={[styles.statusBadge, { backgroundColor: color + "33" }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Reservation }) => {
    const journey = buildReservationJourney(item);
    const vehicleImageUri = getReservationVehicleImage(item);
    const plateNumber = item.vehicle?.number
      ? String(item.vehicle.number)
      : "Plate pending";
    const categoryName = item.category?.name || "Category pending";
    const refundDeadline =
      journey.mainStatus === "refund_processing"
        ? getInclusiveLondonDeadline(journey.refund?.expectedBy)
        : null;
    const timerValue = refundDeadline
      ? formatCompactCountdown(refundDeadline)
      : null;
    const openDetails = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedReservation(item);
    };
    const openTracker = (section?: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTrackingInitialSection(section);
      setTrackingReservation(item);
    };

    return (
      <Pressable
        onPress={openDetails}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(19,29,45,0.98)",
            "rgba(8,17,31,0.99)",
            "rgba(7,15,28,0.99)",
          ]}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.cardTopGlow} />
        <View pointerEvents="none" style={styles.cardEdgeHighlight} />

        <View style={styles.cardTopRow}>
          <View style={styles.vehicleImageWrap}>
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(31,46,67,0.96)",
                "rgba(12,24,40,0.96)",
                "rgba(5,12,22,0.98)",
              ]}
              style={StyleSheet.absoluteFill}
            />

            <View pointerEvents="none" style={styles.vehicleImageGlow} />

            {vehicleImageUri ? (
              <Image
                source={{ uri: vehicleImageUri }}
                style={styles.vehicleImage}
                contentFit="cover"
                transition={220}
              />
            ) : (
              <View style={styles.vehicleImageFallback}>
                <Ionicons name="car-sport-outline" size={30} color={ACCENT} />
              </View>
            )}

            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(5,10,18,0)",
                "rgba(5,10,18,0.08)",
                "rgba(5,10,18,0.72)",
              ]}
              locations={[0, 0.58, 1]}
              style={styles.vehicleImageShade}
            />
          </View>

          <View style={styles.cardSummary}>
            <View style={styles.cardTitleLine}>
              <Text style={styles.vanName} numberOfLines={1}>
                {journey.vehicleName}
              </Text>

              <Text style={styles.vehiclePlateText} numberOfLines={1}>
                {plateNumber}
              </Text>
            </View>

            <View style={styles.compactInfoRow}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText} numberOfLines={1}>
                  {categoryName}
                </Text>
              </View>
              <View style={styles.statusWrap}>{renderStatus(item.status)}</View>
            </View>
          </View>
        </View>

        <View style={styles.datesRow}>
          <View style={styles.dateBlock}>
            <View style={styles.dateHeaderRow}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color="rgba(226,232,240,0.56)"
              />
              <Text style={styles.dateLabel}>PICKUP</Text>
            </View>
            <Text style={styles.dateValue} numberOfLines={1}>
              {journey.pickupDateTime}
            </Text>
          </View>

          <View style={styles.dateBlock}>
            <View style={styles.dateHeaderRow}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color="rgba(226,232,240,0.56)"
              />
              <Text style={styles.dateLabel}>RETURN</Text>
            </View>
            <Text style={styles.dateValue} numberOfLines={1}>
              {journey.returnDateTime}
            </Text>
          </View>
        </View>

        {timerValue ? (
          <View style={styles.compactTimerRow}>
            <View style={styles.compactTimerLeft}>
              <View style={styles.compactTimerIcon}>
                <Ionicons name="timer-outline" size={14} color="#38bdf8" />
              </View>
              <Text style={styles.compactTimerLabel}>Refund timer</Text>
            </View>

            <Text
              style={[
                styles.compactTimerValue,
                timerValue === "Reached" && styles.compactTimerReached,
              ]}
            >
              {timerValue}
            </Text>
          </View>
        ) : null}

        <View style={styles.compactActions}>
          <View style={styles.compactHiddenPrice}>
            <Text style={styles.priceLabel}>Total Price</Text>
            <Text style={styles.priceValue}>{item.perInvoice ? "Per Invoice" : formatMoney(item.totalPrice)}</Text>
          </View>

          <View style={styles.cardActions}>
            {item.status === "pending" ? (
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  openPendingEdit(item);
                }}
                style={({ pressed }) => [
                  styles.editReservationButton,
                  pressed && styles.actionPressed,
                ]}
              >
                <Ionicons name="create-outline" size={13} color="#052e16" />
                <Text style={styles.editReservationText}>Edit</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                openDetails();
              }}
              style={({ pressed }) => [
                styles.moreInfoButton,
                pressed && styles.actionPressed,
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={14}
                color="#0f172a"
              />
              <Text style={styles.moreInfoText}>More info</Text>
            </Pressable>

            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                openTracker();
              }}
              style={({ pressed }) => [
                styles.trackButton,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={styles.trackButtonText}>Track</Text>
              <Ionicons name="arrow-forward" size={13} color={ACCENT} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
      >
        {ListHeaderComponent}
        <View style={[styles.emptyState, styles.loadingState]}>
          <View style={styles.loadingRing}>
            <ActivityIndicator size="small" color={ACCENT} />
          </View>
          <Text style={styles.emptyTitle}>Loading reservations</Text>
          <Text style={styles.emptySubtitle}>
            Checking your latest bookings...
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (!reservations.length) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
      >
        {ListHeaderComponent}
        <View style={styles.emptyState}>
          <EmptyReservationArtwork />
          <Text style={styles.emptyTitle}>No reservations yet</Text>
          <Text style={styles.emptySubtitle}>
            When you book a van, your
            {`
`}
            reservations will appear here.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Ensure reservations is always a valid array
  const safeReservations = Array.isArray(reservations) ? reservations : [];

  return (
    <>
      <FlatList
        data={[...safeReservations].reverse()}
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={styles.listContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
      />

      <ReservationJourneyModal
        visible={!!trackingReservation}
        reservation={trackingReservation}
        initialSection={trackingInitialSection}
        onClose={() => {
          setTrackingReservation(null);
          setTrackingInitialSection(undefined);
        }}
        onUpdated={onRefresh}
      />

      <PendingReservationEditSheet
        visible={!!pendingEditReservation}
        reservation={pendingEditReservation}
        onClose={() => setPendingEditReservation(null)}
        onUpdated={onRefresh}
      />

      <Modal
        visible={
          !!selectedReservation && !dateModalVisible && !timeModalVisible
        }
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} />
        </Pressable>

        {selectedReservation && (
          <Animated.View
            style={[styles.modalContainer, { transform: [{ translateY }] }]}
          >
            <GlassView intensity={90} tint="dark" style={styles.modalContent}>
              <View {...panResponder.panHandlers} style={styles.handleArea}>
                <View style={styles.handle} />
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isEditing ? "Edit Reservation" : "Reservation Details"}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {!isEditing && selectedReservation.status === "pending" && (
                      <Pressable
                        onPress={openPendingEditFromDetails}
                        style={styles.editBtn}
                      >
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color={ACCENT}
                        />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={isEditing ? cancelEditing : closeModal}
                      style={styles.closeBtn}
                    >
                      <Ionicons name="close" size={24} color="#e5e7eb" />
                    </Pressable>
                  </View>
                </View>

                {selectedReservation.category?.image && (
                  <View style={styles.vanImageContainer}>
                    <Image
                      source={{ uri: selectedReservation.category.image }}
                      style={styles.vanImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={["rgba(0,0,0,0.6)", "transparent"]}
                      style={styles.imageGradient}
                    />
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.vanNameLarge}>
                    {selectedReservation.category?.name || "Van"}
                  </Text>
                  <Text style={styles.officeText}>
                    <Ionicons name="location" size={14} color={ACCENT} />{" "}
                    {selectedReservation.office?.name}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Rental Period</Text>
                  {isEditing ? (
                    <>
                      <Pressable
                        onPress={() => {
                          setSelectingDate("pickup");
                          setTempPickupDate(null);
                          setDateModalVisible(true);
                        }}
                        style={styles.editField}
                      >
                        <Ionicons name="calendar" size={16} color={ACCENT} />
                        <Text style={styles.editFieldLabel}>Dates</Text>
                        <Text style={styles.editFieldValue}>
                          {editPickupDate?.toLocaleDateString()} -{" "}
                          {editReturnDate?.toLocaleDateString()}
                        </Text>
                      </Pressable>
                      <View
                        style={{ flexDirection: "row", gap: 8, marginTop: 8 }}
                      >
                        <Pressable
                          onPress={() => {
                            setTimeModalField("pickup");
                            setTimeModalVisible(true);
                          }}
                          style={[styles.editField, { flex: 1 }]}
                        >
                          <Ionicons name="time" size={16} color="#22c55e" />
                          <Text style={styles.editFieldLabel}>Pickup</Text>
                          <Text style={styles.editFieldValue}>
                            {editPickupTime}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setTimeModalField("return");
                            setTimeModalVisible(true);
                          }}
                          style={[styles.editField, { flex: 1 }]}
                        >
                          <Ionicons name="time" size={16} color="#ef4444" />
                          <Text style={styles.editFieldLabel}>Return</Text>
                          <Text style={styles.editFieldValue}>
                            {editReturnTime}
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <View style={styles.dateRow}>
                      <View style={styles.dateCol}>
                        <View style={styles.dateIcon}>
                          <Ionicons
                            name="arrow-up-circle"
                            size={20}
                            color="#22c55e"
                          />
                        </View>
                        <Text style={styles.dateLabel}>Pickup</Text>
                        <Text style={styles.dateText}>
                          {formatDate(selectedReservation.startDate)}
                        </Text>
                      </View>
                      <View style={styles.dateCol}>
                        <View style={styles.dateIcon}>
                          <Ionicons
                            name="arrow-down-circle"
                            size={20}
                            color="#ef4444"
                          />
                        </View>
                        <Text style={styles.dateLabel}>Return</Text>
                        <Text style={styles.dateText}>
                          {formatDate(selectedReservation.endDate)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {selectedReservation.messege && !isEditing && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Message</Text>
                    <View style={styles.messageBox}>
                      <Text style={styles.messageText}>
                        {selectedReservation.messege}
                      </Text>
                    </View>
                  </View>
                )}

                {isEditing && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Message (Optional)</Text>
                    <TextInput
                      style={styles.messageInput}
                      placeholder="Add a message..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={editMessage}
                      onChangeText={setEditMessage}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                )}

                <View style={styles.infoRow}>
                  <View style={styles.infoBox}>
                    <Text style={styles.sectionTitle}>Status</Text>
                    {renderStatus(selectedReservation.status)}
                  </View>

                  {selectedReservation.addOns &&
                    selectedReservation.addOns.length > 0 && (
                      <View style={[styles.infoBox, { flex: 1 }]}>
                        <Text style={styles.sectionTitle}>
                          Add-ons ({selectedReservation.addOns.length})
                        </Text>
                        {selectedReservation.addOns.map((addon, index) => (
                          <View key={index} style={styles.addonRow}>
                            <Ionicons
                              name="checkmark-circle"
                              size={12}
                              color={ACCENT}
                            />
                            <Text style={styles.addonText}>
                              {addon.addOn?.name || "Add-on"} x{addon.quantity}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Price Breakdown</Text>
                  {(() => {
                    if (!isEditing) {
                      return <ReservationPriceBreakdown reservation={selectedReservation} />;
                    }
                    const start =
                      isEditing && editPickupDate
                        ? new Date(editPickupDate)
                        : new Date(selectedReservation.startDate);
                    const end =
                      isEditing && editReturnDate
                        ? new Date(editReturnDate)
                        : new Date(selectedReservation.endDate);
                    if (isEditing && editPickupTime && editReturnTime) {
                      const [pH, pM] = editPickupTime.split(":").map(Number);
                      const [rH, rM] = editReturnTime.split(":").map(Number);
                      start.setHours(pH, pM, 0, 0);
                      end.setHours(rH, rM, 0, 0);
                    }
                    const diffTime = end.getTime() - start.getTime();
                    const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
                    const days = Math.floor(totalHours / 24);
                    const hours = totalHours % 24;

                    const addonsFromReservation = Array.isArray(
                      selectedReservation.addOns,
                    )
                      ? selectedReservation.addOns
                          .map((a: any) => a.addOn)
                          .filter(
                            (addon: any): addon is AddOn =>
                              addon !== null && addon !== undefined,
                          )
                      : [];
                    const allAddons = [
                      ...addonsFromReservation,
                      ...(Array.isArray(availableAddons)
                        ? availableAddons
                        : []),
                    ];
                    const uniqueAddons = (
                      Array.isArray(allAddons) ? allAddons : []
                    ).filter(
                      (addon, index, self) =>
                        addon &&
                        self.findIndex((a) => a?._id === addon._id) === index,
                    );

                    const totalPrice = isEditing
                      ? dynamicPrice
                      : selectedReservation.totalPrice;

                    let addOnsPrice = 0;
                    const addonItems: JSX.Element[] = [];

                    uniqueAddons.forEach((addon) => {
                      if (!addon) return;
                      const quantity = isEditing
                        ? editAddonSelections[addon._id] || 0
                        : selectedReservation.addOns?.find(
                            (a) => a.addOn?._id === addon._id,
                          )?.quantity || 0;
                      if (quantity === 0) return;

                      const pickupDate =
                        isEditing && editPickupDate ? editPickupDate : start;
                      const returnDate =
                        isEditing && editReturnDate ? editReturnDate : end;
                      const pickupTime = isEditing
                        ? editPickupTime
                        : editPickupTime;
                      const returnTime = isEditing
                        ? editReturnTime
                        : editReturnTime;

                      const price = calculateAddonPrice(
                        addon,
                        pickupDate,
                        returnDate,
                        pickupTime,
                        returnTime,
                        quantity,
                      );

                      addOnsPrice += price;

                      addonItems.push(
                        <View
                          key={addon._id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Ionicons
                              name="add-circle-outline"
                              size={13}
                              color="#08d72bff"
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#d1d5db",
                                fontWeight: "500",
                              }}
                            >
                              {addon.name} ×{quantity}
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#f9fafb",
                              fontWeight: "700",
                            }}
                          >
                            £{price.toFixed(2)}
                          </Text>
                        </View>,
                      );
                    });

                    const vanPrice = totalPrice - addOnsPrice - DEFAULT_SERVICE_CHARGE;

                    return (
                      <>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Ionicons
                              name="calendar-outline"
                              size={13}
                              color="#f79515ff"
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#d1d5db",
                                fontWeight: "500",
                              }}
                            >
                              {days}d {hours}h rental
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#f9fafb",
                              fontWeight: "700",
                            }}
                          >
                            £{vanPrice.toFixed(2)}
                          </Text>
                        </View>

                        {addonItems}

                        <View style={styles.priceBreakdownRow}>
                          <Text style={{ fontSize: 12, color: "#d1d5db" }}>Service charge</Text>
                          <Text style={{ fontSize: 14, color: "#f9fafb", fontWeight: "700" }}>{formatMoney(DEFAULT_SERVICE_CHARGE)}</Text>
                        </View>

                        <View
                          style={{
                            height: 1,
                            backgroundColor: "rgba(255,255,255,0.1)",
                            marginVertical: 8,
                          }}
                        />

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#f9fafb",
                              fontWeight: "600",
                            }}
                          >
                            Total
                          </Text>
                          <Text
                            style={{
                              fontSize: 20,
                              color: "#22c55e",
                              fontWeight: "900",
                            }}
                          >
                            £{totalPrice.toFixed(2)}
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>

                {isEditing && (
                  <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                    <View
                      style={{
                        backgroundColor: "rgba(34, 197, 94, 0.15)",
                        padding: 14,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "rgba(34, 197, 94, 0.3)",
                        marginBottom: 12,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#86efac",
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          New Total Price
                        </Text>
                        <Text
                          style={{
                            color: "#22c55e",
                            fontSize: 20,
                            fontWeight: "900",
                          }}
                        >
                          £{dynamicPrice.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    {!isValidRental && (
                      <View
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.15)",
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: "rgba(239, 68, 68, 0.3)",
                          marginBottom: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Ionicons name="warning" size={18} color="#ef4444" />
                        <Text
                          style={{
                            color: "#fca5a5",
                            fontSize: 13,
                            fontWeight: "600",
                            flex: 1,
                          }}
                        >
                          Minimum 6 hours required ({rentalHours.toFixed(1)}h)
                        </Text>
                      </View>
                    )}
                    <Pressable
                      onPress={saveChanges}
                      disabled={isUpdating || !isValidRental}
                      style={({ pressed }) => [
                        styles.saveBtn,
                        pressed &&
                          !isUpdating &&
                          !isValidRental && { opacity: 0.8 },
                        (isUpdating || !isValidRental) && { opacity: 0.5 },
                      ]}
                    >
                      <LinearGradient
                        colors={[ACCENT, "#ff8c00"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveBtnGradient}
                      >
                        {isUpdating ? (
                          <ActivityIndicator color="#0f172a" />
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#0f172a"
                            />
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                          </>
                        )}
                      </LinearGradient>
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            </GlassView>
          </Animated.View>
        )}
      </Modal>

      {dateModalVisible && (
        <Modal
          visible={dateModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setDateModalVisible(false)}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={styles.calendarBox}
            >
              <View style={styles.calendarHeader}>
                <Text style={styles.modalTitle}>
                  {selectingDate === "pickup"
                    ? "📅 Pickup Date"
                    : "📅 Return Date"}
                </Text>
                <Pressable
                  onPress={() => setDateModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={20} color="#e5e7eb" />
                </Pressable>
              </View>
              <Calendar
                onDayPress={(day) => handleDateSelect(day.dateString)}
                markedDates={(() => {
                  const marked: Record<string, any> = {};
                  const currentPickup = tempPickupDate || editPickupDate;
                  if (
                    currentPickup &&
                    editReturnDate &&
                    selectingDate === "pickup"
                  ) {
                    const start = new Date(currentPickup);
                    const end = new Date(editReturnDate);
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
                    marked[currentPickup.toISOString().split("T")[0]] = {
                      selected: true,
                      selectedColor: ACCENT,
                    };
                  }
                  return marked;
                })()}
                markingType="period"
                minDate={
                  selectingDate === "pickup"
                    ? getMinimumPickupDateInput()
                    : tempPickupDate?.toISOString().split("T")[0]
                }
                theme={{
                  calendarBackground: "transparent",
                  textSectionTitleColor: "#9ca3af",
                  selectedDayBackgroundColor: ACCENT,
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
      )}

      {timeModalVisible && (
        <Modal
          visible={timeModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setTimeModalVisible(false)}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={styles.timeBox}
            >
              <View style={styles.calendarHeader}>
                <Text style={styles.modalTitle}>
                  {timeModalField === "pickup" ? "Pickup Time" : "Return Time"}
                </Text>
                <Pressable
                  onPress={() => setTimeModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={20} color="#e5e7eb" />
                </Pressable>
              </View>
              <ScrollView
                showsVerticalScrollIndicator
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    padding: 16,
                  }}
                >
                  {(() => {
                    const office = selectedReservation?.office;
                    const dateToCheck =
                      timeModalField === "pickup"
                        ? editPickupDate
                        : editReturnDate;
                    const isPickup = timeModalField === "pickup";
                    const slots =
                      office && dateToCheck
                        ? getAvailableTimeSlots(dateToCheck, office, isPickup)
                        : null;
                    if (!slots?.start || !slots?.end) return null;
                    const [startH, startM] = slots.start.split(":").map(Number);
                    const [endH, endM] = slots.end.split(":").map(Number);
                    const times: string[] = [];
                    for (let h = startH; h <= endH; h++) {
                      const startMin = h === startH ? startM : 0;
                      const endMin = h === endH ? endM : 45;
                      for (let m = startMin; m <= endMin; m += 15) {
                        times.push(
                          `${h.toString().padStart(2, "0")}:${m
                            .toString()
                            .padStart(2, "0")}`,
                        );
                      }
                    }
                    const currentTime =
                      timeModalField === "pickup"
                        ? editPickupTime
                        : editReturnTime;
                    const dayName = [
                      "sunday",
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                    ][dateToCheck?.getDay() || 0];
                    const workingDay = office?.workingTime?.find(
                      (w: WorkingTime) => w.day === dayName,
                    );
                    const extension = isPickup
                      ? workingDay?.pickupExtension
                      : workingDay?.returnExtension;
                    const is24Hours = slots.normalStart === slots.normalEnd;

                    return times.map((time) => {
                      const isPickup = timeModalField === "pickup";
                      const isReserved = reservedSlots.some((slot) => {
                        if (isPickup) {
                          return time === slot.startTime;
                        } else {
                          return time === slot.endTime;
                        }
                      });
                      const isAvailable = !isReserved;
                      const isExtension =
                        !is24Hours &&
                        slots.normalStart &&
                        slots.normalEnd &&
                        (time < slots.normalStart || time > slots.normalEnd);
                      const extensionPrice =
                        isExtension && extension ? extension.flatPrice : 0;

                      return (
                        <View
                          key={time}
                          style={{ width: "31%", marginBottom: 10 }}
                        >
                          <Pressable
                            disabled={!isAvailable}
                            onPress={() => isAvailable && selectTime(time)}
                            style={[
                              styles.timeSlot,
                              currentTime === time && styles.timeSlotActive,
                              !isAvailable && { opacity: 0.4 },
                            ]}
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
                                marginRight: 6,
                              }}
                            />
                            <Text
                              style={[
                                styles.timeSlotText,
                                currentTime === time &&
                                  styles.timeSlotTextActive,
                              ]}
                            >
                              {time}
                            </Text>
                          </Pressable>
                          {isExtension && extensionPrice > 0 && (
                            <Text
                              style={{
                                fontSize: 9,
                                color:
                                  currentTime === time ? "#fff" : "#fbbf24",
                                textAlign: "center",
                                marginTop: 2,
                              }}
                            >
                              +£{extensionPrice.toFixed(2)}
                            </Text>
                          )}
                        </View>
                      );
                    });
                  })()}
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

function EmptyReservationArtwork() {
  return (
    <View style={styles.emptyArtwork}>
      <View style={styles.emptyArtworkGlow} />
      <View style={[styles.emptySpark, styles.emptySparkOne]} />
      <View style={[styles.emptySpark, styles.emptySparkTwo]} />
      <View style={[styles.emptySpark, styles.emptySparkThree]} />

      <View style={styles.emptyLeafLeft}>
        <View
          style={[styles.emptyLeaf, { transform: [{ rotate: "-34deg" }] }]}
        />
        <View
          style={[styles.emptyLeaf, { transform: [{ rotate: "-12deg" }] }]}
        />
        <View
          style={[styles.emptyLeaf, { transform: [{ rotate: "18deg" }] }]}
        />
      </View>
      <View style={styles.emptyLeafRight}>
        <View
          style={[styles.emptyLeaf, { transform: [{ rotate: "34deg" }] }]}
        />
        <View
          style={[styles.emptyLeaf, { transform: [{ rotate: "12deg" }] }]}
        />
        <View
          style={[styles.emptyLeaf, { transform: [{ rotate: "-18deg" }] }]}
        />
      </View>

      <View style={styles.calendarTopRingLeft} />
      <View style={styles.calendarTopRingRight} />
      <View style={styles.calendarIconBody}>
        <LinearGradient
          colors={["#526389", "#273551"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.calendarIconHeader} />
        <View style={styles.calendarGrid}>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <View
              key={item}
              style={[
                styles.calendarGridDot,
                item === 5 && styles.calendarGridDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 132,
  },
  card: {
    position: "relative",
    overflow: "hidden",
    padding: 12,
    paddingBottom: 7,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: "#08111f",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.5)",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.17,
    shadowRadius: 18,
    elevation: 7,
  },

  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.992 }],
  },

  cardTopGlow: {
    position: "absolute",
    top: -74,
    left: -20,
    width: 190,
    height: 128,
    borderRadius: 90,
    backgroundColor: "rgba(254,154,0,0.075)",
  },

  cardEdgeHighlight: {
    position: "absolute",
    top: 0,
    left: 22,
    right: 22,
    height: 1,
    backgroundColor: "rgba(255,221,162,0.25)",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 91,
  },

  vehicleImageWrap: {
    position: "relative",
    width: 94,
    minHeight: 91,
    overflow: "hidden",
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: "#0b1626",
    borderWidth: 1,
    borderColor: "rgba(119,146,179,0.14)",
  },

  vehicleImageGlow: {
    position: "absolute",
    width: 98,
    height: 70,
    right: -28,
    bottom: -12,
    borderRadius: 52,
    backgroundColor: "rgba(42,91,160,0.12)",
  },

  vehicleImage: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.06 }],
  },

  vehicleImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  vehicleImageShade: {
    ...StyleSheet.absoluteFillObject,
  },

  cardSummary: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  cardTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minWidth: 0,
  },

  vanName: {
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 0,
    maxWidth: "72%",
    color: "#f8fafc",
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: "900",
    letterSpacing: 0,
  },

  cardAlertDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    flexShrink: 0,
    backgroundColor: "#ff334f",
    shadowColor: "#ff334f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
  },

  vehiclePlateRow: {
    alignSelf: "flex-start",
    minHeight: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(254,154,0,0.07)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.16)",
  },

  vehiclePlateIcon: {
    width: 14,
    height: 14,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  vehiclePlateText: {
    maxWidth: 82,
    flexShrink: 0,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "rgba(254,154,0,0.1)",
    color: "#ffd071",
    fontSize: 8.5,
    lineHeight: 10,
    fontWeight: "900",
    letterSpacing: 0,
  },

  compactInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    marginTop: 7,
  },

  categoryPill: {
    maxWidth: 128,
    minHeight: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(133,156,184,0.14)",
  },

  categoryPillText: {
    flexShrink: 1,
    color: "rgba(226,232,240,0.8)",
    fontSize: 8.5,
    fontWeight: "800",
  },

  statusWrap: {
    flexShrink: 1,
  },

  datesRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 11,
  },

  dateBlock: {
    flex: 1,
    minWidth: 0,
    minHeight: 35,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(128,153,184,0.13)",
  },

  dateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },

  dateLabel: {
    color: "rgba(203,213,225,0.48)",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  dateValue: {
    color: "#edf2f8",
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: "800",
  },

  compactTimerRow: {
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(4,114,171,0.09)",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.23)",
  },

  compactTimerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  compactTimerIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(56,189,248,0.08)",
  },

  compactTimerLabel: {
    color: "#dbeafe",
    fontSize: 9.5,
    fontWeight: "800",
  },

  compactTimerValue: {
    color: "#22d3ee",
    fontSize: 11,
    fontWeight: "900",
  },

  compactTimerReached: {
    color: "#fb7185",
  },

  compactActions: {
    marginTop: 9,
  },

  compactHiddenPrice: {
    display: "none",
  },

  priceLabel: {
    color: "rgba(203,213,225,0.48)",
    fontSize: 8.5,
    fontWeight: "800",
  },

  priceValue: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: "900",
  },

  cardActions: {
    flexDirection: "row",
    gap: 8,
  },

  editReservationButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    overflow: "hidden",
    backgroundColor: "#22c55e",
    borderWidth: 1,
    borderColor: "rgba(187,247,208,0.42)",
  },

  editReservationText: {
    color: "#052e16",
    fontSize: 10,
    fontWeight: "900",
  },

  moreInfoButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
    backgroundColor: ACCENT,
    borderWidth: 1,
    borderColor: "rgba(255,218,150,0.55)",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  moreInfoText: {
    color: "#0f172a",
    fontSize: 10,
    fontWeight: "900",
  },

  trackButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(254,154,0,0.035)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.28)",
  },

  trackButtonText: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: "900",
  },

  actionPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  cardBottomChevron: {
    width: 34,
    height: 18,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },

  chevronPressed: {
    opacity: 0.55,
    transform: [{ translateY: 1 }],
  },

  vehicleImageTag: {
    position: "absolute",
    left: 7,
    right: 7,
    bottom: 7,
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(9,15,25,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  vehicleImageTagText: {
    color: "#f8fafc",
    fontSize: 9,
    fontWeight: "900",
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardMetaRow: {
    gap: 7,
    marginTop: 9,
  },
  cardMetaPill: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardMetaText: {
    flex: 1,
    minWidth: 0,
    color: "rgba(226,232,240,0.76)",
    fontSize: 10,
    fontWeight: "800",
  },
  cardHintRow: {
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  cardHintText: {
    flex: 1,
    color: "rgba(148,163,184,0.72)",
    fontSize: 9,
    fontWeight: "700",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  locationText: {
    color: "rgba(208,217,230,0.6)",
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 4,
  },
  reservedDate: {
    color: "rgba(190,201,217,0.45)",
    fontSize: 9.5,
    marginTop: 4,
  },

  statusBadge: {
    maxWidth: 104,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    flexShrink: 1,
    fontSize: 7.5,
    fontWeight: "800",
  },
  emptyState: {
    minHeight: 178,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 19,
    paddingBottom: 18,
    backgroundColor: "rgba(13,22,39,0.97)",
    borderWidth: 1,
    borderColor: "rgba(105,136,174,0.13)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 5,
  },
  loadingState: {
    minHeight: 170,
  },
  loadingRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    backgroundColor: "rgba(254,154,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.16)",
  },
  emptyArtwork: {
    width: 128,
    height: 91,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  emptyArtworkGlow: {
    position: "absolute",
    width: 88,
    height: 72,
    borderRadius: 44,
    top: 7,
    backgroundColor: "rgba(254,154,0,0.11)",
  },
  emptySpark: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  emptySparkOne: { top: 7, right: 34 },
  emptySparkTwo: { top: 25, left: 18, opacity: 0.55 },
  emptySparkThree: { bottom: 15, right: 13, opacity: 0.45 },
  emptyLeafLeft: {
    position: "absolute",
    left: 12,
    bottom: 10,
    width: 36,
    height: 44,
    justifyContent: "space-around",
    alignItems: "flex-end",
    transform: [{ rotate: "-18deg" }],
  },
  emptyLeafRight: {
    position: "absolute",
    right: 12,
    bottom: 10,
    width: 36,
    height: 44,
    justifyContent: "space-around",
    alignItems: "flex-start",
    transform: [{ rotate: "18deg" }],
  },
  emptyLeaf: {
    width: 18,
    height: 7,
    borderRadius: 8,
    backgroundColor: "rgba(58,76,112,0.72)",
  },
  calendarTopRingLeft: {
    position: "absolute",
    zIndex: 4,
    width: 5,
    height: 18,
    borderRadius: 3,
    top: 12,
    left: 49,
    backgroundColor: "#ffab23",
  },
  calendarTopRingRight: {
    position: "absolute",
    zIndex: 4,
    width: 5,
    height: 18,
    borderRadius: 3,
    top: 12,
    right: 49,
    backgroundColor: "#ffab23",
  },
  calendarIconBody: {
    width: 64,
    height: 59,
    marginTop: 15,
    borderRadius: 12,
    overflow: "hidden",
    transform: [{ rotate: "6deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.38,
    shadowRadius: 9,
    elevation: 8,
  },
  calendarIconHeader: {
    height: 14,
    backgroundColor: "#ff9f18",
  },
  calendarGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
  },
  calendarGridDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: "rgba(191,204,229,0.3)",
  },
  calendarGridDotActive: {
    backgroundColor: ACCENT,
  },
  emptyTitle: {
    color: "#f0f2f7",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 1,
    letterSpacing: -0.15,
  },
  emptySubtitle: {
    color: "rgba(190,200,216,0.54)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 5,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.12)",
  },

  nextActionCard: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 13,
    padding: 11,
    marginTop: 11,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },
  nextActionCardHot: {
    backgroundColor: "rgba(254,154,0,0.08)",
    borderColor: "rgba(254,154,0,0.26)",
  },
  nextActionIcon: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.16)",
  },
  nextActionCopy: { flex: 1, minWidth: 0 },
  nextActionKicker: {
    color: "rgba(190,201,216,0.48)",
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 0.65,
    fontWeight: "900",
  },
  nextActionTitle: {
    color: "#f7f8fb",
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 2,
  },
  nextActionDescription: {
    color: "rgba(214,222,234,0.58)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: 3,
  },

  cardActionButton: {
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardActionButtonHot: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  cardActionText: {
    color: "#f8fafc",
    fontSize: 10,
    fontWeight: "900",
  },
  cardActionTextHot: { color: "#111827" },

  addonsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.12)",
  },
  addonsLabel: {
    color: "rgba(190,201,216,0.5)",
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6,
    fontWeight: "800",
  },
  addonItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addonName: {
    color: "#e5e7eb",
    fontSize: 9.5,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.86,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "rgba(7,13,24,0.98)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handleArea: {
    paddingVertical: 11,
    alignItems: "center",
  },
  handle: {
    width: 38,
    height: 4,
    backgroundColor: "rgba(148,163,184,0.58)",
    borderRadius: 999,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#f9fafb",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  vanImageContainer: {
    height: 186,
    marginHorizontal: 18,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 18,
    backgroundColor: "#0d1728",
  },
  vanImage: { width: "100%", height: "100%" },
  imageGradient: { ...StyleSheet.absoluteFillObject },
  detailSection: { paddingHorizontal: 18, marginBottom: 18 },
  vanNameLarge: {
    fontSize: 20,
    fontWeight: "900",
    color: "#f9fafb",
    marginBottom: 7,
  },
  officeText: { fontSize: 12, color: "#94a3b8" },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 10,
  },
  dateRow: { flexDirection: "row", gap: 10 },
  dateCol: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.13)",
  },
  dateIcon: { marginBottom: 7 },
  dateText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#f9fafb",
    marginTop: 4,
  },
  addonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 7,
  },
  addonText: { fontSize: 9.5, color: "#e5e7eb", fontWeight: "600" },
  priceBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  breakdownLabel: { fontSize: 12, color: "#9ca3af" },
  breakdownValue: { fontSize: 12, fontWeight: "700", color: "#e5e7eb" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 11,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(254,154,0,0.22)",
  },
  totalLabel: { fontSize: 14, fontWeight: "800", color: "#f9fafb" },
  totalValue: { fontSize: 21, fontWeight: "900", color: "#22c55e" },
  statusSection: { paddingHorizontal: 18, marginBottom: 18 },
  infoRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.13)",
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(254,154,0,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  editField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.13)",
  },
  editFieldLabel: { fontSize: 10.5, color: "#9ca3af", fontWeight: "600" },
  editFieldValue: {
    fontSize: 11.5,
    color: "#f9fafb",
    fontWeight: "700",
    flex: 1,
  },
  saveBtn: { borderRadius: 15, overflow: "hidden", marginTop: 11 },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  saveBtnText: { fontSize: 14, fontWeight: "900", color: "#0f172a" },
  calendarBox: {
    backgroundColor: "rgba(8,14,26,0.99)",
    borderRadius: 22,
    padding: 18,
    width: "90%",
    maxHeight: height * 0.7,
    zIndex: 10000,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  timeBox: {
    backgroundColor: "rgba(8,14,26,0.99)",
    borderRadius: 22,
    padding: 18,
    width: "90%",
    maxHeight: height * 0.6,
    zIndex: 10000,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  timeSlotActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  timeSlotText: { fontSize: 11, fontWeight: "700", color: "#e5e7eb" },
  timeSlotTextActive: { color: "#0f172a" },
  messageBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.13)",
  },
  messageText: { fontSize: 12, color: "#e5e7eb", lineHeight: 18 },
  messageInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.13)",
    color: "#f9fafb",
    fontSize: 12,
    minHeight: 80,
  },
  addonEditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 11,
    borderRadius: 12,
    marginBottom: 8,
  },
  addonEditName: {
    color: "#f9fafb",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  addonEditControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  addonEditBtn: {
    backgroundColor: "rgba(254,154,0,0.16)",
    borderRadius: 8,
    padding: 6,
  },
  addonEditQty: {
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: "800",
    minWidth: 28,
    textAlign: "center",
  },
});

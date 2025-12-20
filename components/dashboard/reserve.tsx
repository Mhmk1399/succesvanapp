// components/dashboard/UserReservations.tsx
import { reservationService } from "@/services/reservationService";
import { Reservation, AddOn } from "@/types/type";
import { calculateAddonPrice } from "@/utils/addonCalculator";
import { calculatePrice } from "@/utils/priceCalculator";
import { addonService } from "@/services/addonService";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
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

type UserReservationsProps = {
  reservations: Reservation[];
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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

export default function UserReservations({
  reservations,
  isLoading = false,
  onRefresh,
  isRefreshing = false,
}: UserReservationsProps) {
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
    "pickup"
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
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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
    })
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
        .padStart(2, "0")}`
    );
    setEditReturnDate(returnD);
    setEditReturnTime(
      `${returnD.getHours().toString().padStart(2, "0")}:${returnD
        .getMinutes()
        .toString()
        .padStart(2, "0")}`
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

        console.log("[reserve.tsx] Fetching reserved slots:", {
          dateStr,
          type,
          timeModalField,
        });

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.data?.reservedSlots) {
          const filteredSlots = data.data.reservedSlots.filter((slot: any) => {
            if (type === "start") {
              return slot.startDate === dateStr;
            } else {
              return slot.endDate === dateStr;
            }
          });
          console.log("[reserve.tsx] Filtered slots:", filteredSlots);
          setReservedSlots(filteredSlots);
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
        0
    );

    const allAddons = [
      ...(selectedReservation.addOns?.map((a) => a.addOn).filter(Boolean) ||
        []),
      ...availableAddons,
    ];
    const uniqueAddons = allAddons.filter(
      (addon, index, self) =>
        addon && self.findIndex((a) => a?._id === addon._id) === index
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
        quantity
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
    office: any,
    isPickup: boolean
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
      (w: WorkingTime) => w.day === dayName
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

  const handleDateSelect = (dateString: string) => {
    const date = new Date(dateString);
    Haptics.selectionAsync();
    if (selectingDate === "pickup") {
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
          messege: editMessage,
          addOns: updatedAddOns,
        } as any
      );

      if (result.success) {
        Alert.alert("Success", "Reservation updated successfully");
        setIsEditing(false);
        closeModal();
        onRefresh?.();
      } else {
        Alert.alert("Error", result.error || "Failed to update reservation");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update reservation");
    } finally {
      setIsUpdating(false);
    }
  };
  const renderStatus = (status: string) => {
    let label = "";
    let color = "";
    switch (status) {
      case "pending":
        label = "Pending";
        color = "#fbbf24";
        break;
      case "confirmed":
        label = "Confirmed";
        color = "#22c55e";
        break;
      case "completed":
        label = "Completed";
        color = "#38bdf8";
        break;
      case "canceled":
        label = "Cancelled";
        color = "#f97373";
        break;
      default:
        label = status;
        color = "#9ca3af";
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: color + "33" }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Reservation }) => (
    <Pressable
      style={styles.card}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedReservation(item);
      }}
    >
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={styles.vanName}>{item.category?.name || "Van"}</Text>
          <Text style={styles.locationText}>
            <Ionicons name="location-outline" size={13} color={ACCENT} />{" "}
            {item.office?.name || "Office"}
          </Text>
          {item.createdAt && (
            <Text style={styles.reservedDate}>
              <Ionicons name="calendar" size={13} color={ACCENT} /> Reserved On:{" "}
              {formatDate(item.createdAt.toString())}
            </Text>
          )}
        </View>
        {renderStatus(item.status)}
      </View>

      <View style={styles.datesRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Pickup</Text>
          <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
        </View>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Return</Text>
          <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
        </View>
      </View>

      {item.addOns && item.addOns.length > 0 && (
        <View style={styles.addonsSection}>
          <Text style={styles.addonsLabel}>Add-ons</Text>
          {item.addOns.map((addon, index) => (
            <View key={index} style={styles.addonItem}>
              <Text style={styles.addonName}>
                {addon.addOn?.name || "Add-on"} x{addon.quantity}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Total Price</Text>
        <Text style={styles.priceValue}>£{item.totalPrice}</Text>
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={"#fff"} />
        <Text style={styles.emptySubtitle}>Loading reservations...</Text>
      </View>
    );
  }

  if (!reservations.length) {
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="calendar-outline"
          size={40}
          color="rgba(255, 255, 255, 0.9)"
        />
        <Text style={styles.emptyTitle}>No reservations yet</Text>
        <Text style={styles.emptySubtitle}>
          When you book a van, your reservations will appear here.
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={[...reservations].reverse()}
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
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
            <BlurView intensity={90} tint="dark" style={styles.modalContent}>
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
                      <Pressable onPress={startEditing} style={styles.editBtn}>
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
                          console.log("[reserve.tsx] Opening date modal");
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
                            console.log(
                              "[reserve.tsx] Opening pickup time modal"
                            );
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
                            console.log(
                              "[reserve.tsx] Opening return time modal"
                            );
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
                              size={16}
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

                    const allAddons = [
                      ...(selectedReservation.addOns
                        ?.map((a) => a.addOn)
                        .filter(Boolean) || []),
                      ...availableAddons,
                    ];
                    const uniqueAddons = allAddons.filter(
                      (addon, index, self) =>
                        addon &&
                        self.findIndex((a) => a?._id === addon._id) === index
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
                            (a) => a.addOn?._id === addon._id
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
                        quantity
                      );
                      console.log(`[reserve.tsx] Addon: ${addon.name}, Type: ${addon.pricingType}, Quantity: ${quantity}, Price: ${price}`);
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
                            £{price.toFixed(0)}
                          </Text>
                        </View>
                      );
                    });

                    const vanPrice = totalPrice - addOnsPrice;

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
                            £{vanPrice.toFixed(0)}
                          </Text>
                        </View>

                        {addonItems}

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
                            £{totalPrice.toFixed(0)}
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
                          £{dynamicPrice.toFixed(0)}
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
            </BlurView>
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
                  const marked: any = {};
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
                    ? new Date().toISOString().split("T")[0]
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
                            .padStart(2, "0")}`
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
                      (w: WorkingTime) => w.day === dayName
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
                              +£{extensionPrice}
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15,23,42,0.7)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  vanName: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
  },
  locationText: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 4,
  },
  reservedDate: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 4,
  },
  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    color: "#9ca3af",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  dateValue: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  emptySubtitle: {
    color: "#ffffffd4",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.2)",
  },
  priceLabel: {
    color: "#e0e8deff",
    fontSize: 14,
    fontWeight: "900",
  },
  priceValue: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: "800",
  },
  addonsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.2)",
  },
  addonsLabel: {
    color: "#9ca3af",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  addonItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addonName: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.95)",
  },
  handleArea: {
    paddingVertical: 12,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(148,163,184,0.7)",
    borderRadius: 999,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#f9fafb",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  vanImageContainer: {
    height: 180,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  vanImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  detailSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  vanNameLarge: {
    fontSize: 22,
    fontWeight: "900",
    color: "#f9fafb",
    marginBottom: 8,
  },
  officeText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    gap: 16,
  },
  dateCol: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
  dateIcon: {
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f9fafb",
    marginTop: 4,
  },
  addonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  addonText: {
    fontSize: 14,
    color: "#e5e7eb",
    fontWeight: "500",
  },
  priceBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  breakdownLabel: {
    fontSize: 14,
    color: "#9ca3af",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(254,154,0,0.3)",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f9fafb",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#22c55e",
  },
  statusSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(254,154,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  editField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
  editFieldLabel: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600",
  },
  editFieldValue: {
    fontSize: 13,
    color: "#f9fafb",
    fontWeight: "700",
    flex: 1,
  },
  saveBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
  },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  calendarBox: {
    backgroundColor: "rgba(15,23,42,0.98)",
    borderRadius: 24,
    padding: 20,
    width: "90%",
    maxHeight: height * 0.7,
    zIndex: 10000,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timeBox: {
    backgroundColor: "rgba(15,23,42,0.98)",
    borderRadius: 24,
    padding: 20,
    width: "90%",
    maxHeight: height * 0.6,
    zIndex: 10000,
    elevation: 10,
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  timeSlotActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e5e7eb",
  },
  timeSlotTextActive: {
    color: "#0f172a",
  },
  messageBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
  messageText: {
    fontSize: 14,
    color: "#e5e7eb",
    lineHeight: 20,
  },
  messageInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
    color: "#f9fafb",
    fontSize: 14,
    minHeight: 80,
  },
  addonEditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  addonEditName: {
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  addonEditControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addonEditBtn: {
    backgroundColor: "rgba(254,154,0,0.2)",
    borderRadius: 8,
    padding: 6,
  },
  addonEditQty: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
    minWidth: 30,
    textAlign: "center",
  },
});

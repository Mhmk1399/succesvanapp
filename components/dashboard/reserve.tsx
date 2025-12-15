// components/dashboard/UserReservations.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Modal,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Reservation } from "@/types/type";
 
const { height } = Dimensions.get("window");

const ACCENT = "#fe9a00";

type UserReservationsProps = {
  reservations: Reservation[];
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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
    ]).start(() => setSelectedReservation(null));
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
        visible={!!selectedReservation}
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
                  <Text style={styles.modalTitle}>Reservation Details</Text>
                  <Pressable onPress={closeModal} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color="#e5e7eb" />
                  </Pressable>
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
                </View>
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
                    const start = new Date(selectedReservation.startDate);
                    const end = new Date(selectedReservation.endDate);
                    const diffTime = end.getTime() - start.getTime();
                    const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
                    const days = Math.floor(totalHours / 24);
                    const hours = totalHours % 24;

                    const addOnsPrice =
                      selectedReservation.addOns?.reduce((sum, addon) => {
                        if (addon.addOn?.pricingType === "flat") {
                          return sum + (addon.addOn?.flatPrice || 0) * addon.quantity;
                        }
                        if (addon.addOn?.pricingType === "tiered" && addon.addOn?.tiers) {
                          const rentalDays = Math.ceil(days + hours / 24);
                          const tier = addon.addOn.tiers.find(
                            (t: any) => rentalDays >= t.minDays && rentalDays <= t.maxDays
                          );
                          return sum + (tier?.price || 0) * addon.quantity;
                        }
                        return sum;
                      }, 0) || 0;

                    const vanPrice = selectedReservation.totalPrice - addOnsPrice;

                    return (
                      <>
                        <View style={styles.priceBreakdownRow}>
                          <Text style={styles.breakdownLabel}>Rental Duration</Text>
                          <Text style={styles.breakdownValue}>{days}d {hours}h</Text>
                        </View>
                        <View style={styles.priceBreakdownRow}>
                          <Text style={styles.breakdownLabel}>Van Rental</Text>
                          <Text style={styles.breakdownValue}>£{vanPrice}</Text>
                        </View>

                        {selectedReservation.addOns && selectedReservation.addOns.length > 0 && (
                          <View style={styles.priceBreakdownRow}>
                            <Text style={styles.breakdownLabel}>Add-ons</Text>
                            <Text style={styles.breakdownValue}>£{addOnsPrice}</Text>
                          </View>
                        )}

                        <View style={[styles.priceBreakdownRow, styles.totalRow]}>
                          <Text style={styles.totalLabel}>Total</Text>
                          <Text style={styles.totalValue}>£{selectedReservation.totalPrice}</Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
              </ScrollView>
            </BlurView>
          </Animated.View>
        )}
      </Modal>
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
    backgroundColor: "rgba(0,0,0,0.5)",
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
});

// components/dashboard/UserReservations.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Reservation } from "@/types/type";

const ACCENT = "#fe9a00";

type UserReservationsProps = {
  reservations: Reservation[];
  isLoading?: boolean;
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
}: UserReservationsProps) {
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
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={styles.vanName}>{item.category?.name || "Van"}</Text>
          <Text style={styles.locationText}>
            <Ionicons name="location-outline" size={13} color={ACCENT} />{" "}
            {item.office?.name || "Office"}
          </Text>
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
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Total Price</Text>
        <Text style={styles.priceValue}>£{item.totalPrice}</Text>
      </View>
    </View>
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
    <FlatList
      data={reservations}
      keyExtractor={(item) => item._id || Math.random().toString()}
      renderItem={renderItem}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
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
    color: "#c6c7c8ff",
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
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
  },
  priceValue: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: "800",
  },
});

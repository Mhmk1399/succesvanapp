// components/dashboard/UserReservations.tsx
import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ACCENT = "#fe9a00";

export type Reservation = {
  id: string;
  vanName: string;
  pickupDate: string;
  returnDate: string;
  location: string;
  status: "upcoming" | "completed" | "cancelled";
};

type UserReservationsProps = {
  reservations: Reservation[];
};

export default function UserReservations({
  reservations,
}: UserReservationsProps) {
  const renderStatus = (status: Reservation["status"]) => {
    let label = "";
    let color = "";
    switch (status) {
      case "upcoming":
        label = "Upcoming";
        color = "#22c55e";
        break;
      case "completed":
        label = "Completed";
        color = "#38bdf8";
        break;
      case "cancelled":
        label = "Cancelled";
        color = "#f97373";
        break;
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
          <Text style={styles.vanName}>{item.vanName}</Text>
          <Text style={styles.locationText}>
            <Ionicons name="location-outline" size={13} color={ACCENT} />{" "}
            {item.location}
          </Text>
        </View>
        {renderStatus(item.status)}
      </View>

      <View style={styles.datesRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Pickup</Text>
          <Text style={styles.dateValue}>{item.pickupDate}</Text>
        </View>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Return</Text>
          <Text style={styles.dateValue}>{item.returnDate}</Text>
        </View>
      </View>
    </View>
  );

  if (!reservations.length) {
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="calendar-outline"
          size={40}
          color="rgba(148,163,184,0.9)"
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
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15,23,42,0.95)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.45)",
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
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },
});

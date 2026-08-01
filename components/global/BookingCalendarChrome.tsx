import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const ACCENT = "#fe9a00";
const DARK = "#0f172a";

type BookingCalendarChromeProps = {
  phase: "pickup" | "return";
  selectedLabel: string;
  onClose: () => void;
  children: React.ReactNode;
};

export const BOOKING_CALENDAR_THEME = {
  calendarBackground: "transparent",
  textSectionTitleColor: "rgba(226,232,240,0.62)",
  selectedDayBackgroundColor: ACCENT,
  selectedDayTextColor: "#ffffff",
  todayTextColor: "#22c55e",
  dayTextColor: "#f8fafc",
  textDisabledColor: "rgba(148,163,184,0.28)",
  monthTextColor: "#f8fafc",
  arrowColor: ACCENT,
  textDayFontWeight: "700" as const,
  textMonthFontWeight: "900" as const,
  textDayHeaderFontWeight: "800" as const,
  textDayFontSize: 14,
  textMonthFontSize: 17,
  textDayHeaderFontSize: 11,
};

export default function BookingCalendarChrome({
  phase,
  selectedLabel,
  onClose,
  children,
}: BookingCalendarChromeProps) {
  const isPickup = phase === "pickup";

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <LinearGradient
            colors={
              isPickup
                ? ["#22c55e", "#16a34a"]
                : ["#fe9a00", "#f97316"]
            }
            style={styles.iconBox}
          >
            <Ionicons
              name={isPickup ? "arrow-up-circle" : "arrow-down-circle"}
              size={19}
              color={isPickup ? "#052e16" : DARK}
            />
          </LinearGradient>

          <View style={styles.titleCopy}>
            <Text style={styles.kicker}>Reservation date</Text>
            <Text style={styles.title}>
              {isPickup ? "Choose pickup" : "Choose return"}
            </Text>
          </View>
        </View>

        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={19} color="#e2e8f0" />
        </Pressable>
      </View>

      <View style={styles.selectedCard}>
        <View style={styles.selectedIcon}>
          <Ionicons name="calendar-clear-outline" size={16} color={ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.selectedLabel}>Selected</Text>
          <Text style={styles.selectedValue}>{selectedLabel}</Text>
        </View>
      </View>

      <View style={styles.calendarSurface}>{children}</View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ACCENT }]} />
          <Text style={styles.legendText}>Selected range</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: "rgba(148,163,184,0.35)" },
            ]}
          />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  titleCopy: {
    flex: 1,
  },
  kicker: {
    color: "#94a3b8",
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
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "rgba(2,6,23,0.46)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.18)",
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.12)",
  },
  selectedLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  selectedValue: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 1,
  },
  calendarSurface: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
  },
});

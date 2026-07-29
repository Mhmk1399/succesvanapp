import { Ionicons } from "@expo/vector-icons";
import GlassView from "@/components/global/GlassView";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const ACCENT = "#fe9a00";
const DARK = "#0f172a";

interface LicenseUploadBannerProps {
  onPress: () => void;
}

export default function LicenseUploadBanner({
  onPress,
}: LicenseUploadBannerProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
    >
      <GlassView intensity={22} tint="dark" style={styles.glass}>
        <View style={styles.iconContainer}>
          <Ionicons name="card-outline" size={18} color={ACCENT} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Driving licence needed</Text>
          <Text style={styles.message}>Upload it once to complete bookings.</Text>
        </View>
        <View style={styles.actionChip}>
          <Text style={styles.actionText}>Upload</Text>
          <Ionicons name="arrow-forward" size={13} color={DARK} />
        </View>
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 8,
    borderRadius: 18,
    overflow: "hidden",
  },
  bannerPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  glass: {
    minHeight: 58,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.22)",
    backgroundColor: "rgba(254,154,0,0.08)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(254,154,0,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    color: "#f9fafb",
    fontSize: 13,
    fontWeight: "900",
  },
  message: {
    color: "rgba(248,250,252,0.56)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  actionChip: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ACCENT,
  },
  actionText: {
    color: DARK,
    fontSize: 12,
    fontWeight: "900",
  },
});

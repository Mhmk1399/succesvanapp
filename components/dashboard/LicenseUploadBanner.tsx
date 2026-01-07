import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle" size={32} color="#ef4444" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>License Required</Text>
        <Text style={styles.message}>
          Please upload your driving licenses to complete bookings
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={"#ef4444"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(100, 29, 4, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  bannerPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(239,68,68,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  message: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
});

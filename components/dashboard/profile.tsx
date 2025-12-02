// components/dashboard/UserProfileCard.tsx
import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const ACCENT = "#fe9a00";

type UserProfileCardProps = {
  name: string;
  email: string;
  phone: string;
};

export default function UserProfileCard({
  name,
  email,
  phone,
}: UserProfileCardProps) {
  const handleEditPress = async () => {
    await Haptics.selectionAsync();
    // اینجا بعدا می‌تونی به صفحه ویرایش پروفایل نَوِیت کنی
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.avatar}
            resizeMode="contain"
          />
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.subtitle}>Success Van Hire Member</Text>
        </View>

        <Pressable
          onPress={handleEditPress}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.editButtonPressed,
          ]}
        >
          <Ionicons name="create-outline" size={18} color="#0f172a" />
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Ionicons name="mail-outline" size={18} color={ACCENT} />
        <Text style={styles.infoText}>{email}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="call-outline" size={18} color={ACCENT} />
        <Text style={styles.infoText}>{phone}</Text>
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Ionicons name="star-outline" size={16} color={ACCENT} />
          <Text style={styles.badgeText}>Trusted Customer</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark-outline" size={16} color={ACCENT} />
          <Text style={styles.badgeText}>Verified</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15,23,42,0.95)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 20,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  editButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(148,163,184,0.4)",
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    marginBottom: 8,
  },
  infoText: {
    color: "#e5e7eb",
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: "row",
    columnGap: 8,
    marginTop: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(254,154,0,0.08)",
  },
  badgeText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: "600",
  },
});

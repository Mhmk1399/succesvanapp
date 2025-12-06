// components/dashboard/UserProfileCard.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const { user, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || name);
  const [editLastName, setEditLastName] = useState(user?.lastName || "");
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditLastName(user.lastName);
      setEditEmail(user.emaildata.emailAddress);
      setEditPhone(user.phoneData.phoneNumber);
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    if (user) {
      setEditName(user.name);
      setEditLastName(user.lastName);
      setEditEmail(user.emaildata.emailAddress);
      setEditPhone(user.phoneData.phoneNumber);
    }
    Haptics.selectionAsync();
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const token = await AsyncStorage.getItem("authToken");
      const API_URL =
        process.env.EXPO_PUBLIC_USERS_API ||
        "https://succesvan.vercel.app/api/users";

      const response = await fetch(`${API_URL}/${user._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          lastName: editLastName,
          emaildata: {
            emailAddress: editEmail,
            isVerified: user.emaildata.isVerified,
          },
          phoneData: {
            phoneNumber: editPhone,
            isVerified: user.phoneData.isVerified,
          },
        }),
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(text || "Invalid response");
      }

      if (result.success) {
        await AsyncStorage.setItem("user", JSON.stringify(result.data));
        await refreshUser();
        Alert.alert("Success", "Profile updated successfully");
        setIsEditing(false);
      } else {
        Alert.alert("Error", result.error || "Failed to update profile");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    Haptics.selectionAsync();
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
          <Text style={styles.name}>
            {user?.name || name} {user?.lastName || ""}
          </Text>
          <Text style={styles.subtitle}>Success Van Hire Member</Text>
        </View>

        {!isEditing ? (
          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.editButtonPressed,
            ]}
          >
            <Ionicons name="create-outline" size={18} color="#0f172a" />
          </Pressable>
        ) : (
          <View style={styles.editActions}>
            <Pressable onPress={handleCancel} style={styles.cancelButton}>
              <Ionicons name="close" size={18} color="#ef4444" />
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={styles.saveButton}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <Ionicons name="checkmark" size={18} color="#0f172a" />
              )}
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {isEditing ? (
        <>
          <View style={styles.editRow}>
            <Ionicons name="person-outline" size={18} color={ACCENT} />
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.editInput}
              placeholder="First Name"
              placeholderTextColor="#6b7280"
            />
          </View>
          <View style={styles.editRow}>
            <Ionicons name="person-outline" size={18} color={ACCENT} />
            <TextInput
              value={editLastName}
              onChangeText={setEditLastName}
              style={styles.editInput}
              placeholder="Last Name"
              placeholderTextColor="#6b7280"
            />
          </View>
          <View style={styles.editRow}>
            <Ionicons name="mail-outline" size={18} color={ACCENT} />
            <TextInput
              value={editEmail}
              onChangeText={setEditEmail}
              style={styles.editInput}
              placeholder="Email"
              placeholderTextColor="#6b7280"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.editRow}>
            <Ionicons name="call-outline" size={18} color={ACCENT} />
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              style={styles.editInput}
              placeholder="Phone"
              placeholderTextColor="#6b7280"
              keyboardType="phone-pad"
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={ACCENT} />
            <Text style={styles.infoText}>{email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={ACCENT} />
            <Text style={styles.infoText}>{phone}</Text>
          </View>
        </>
      )}

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Ionicons name="person-outline" size={16} color={ACCENT} />
          <Text style={styles.badgeText}>Role: {user?.role || "user"}</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={user?.phoneData?.isVerified ? "#22c55e" : "#9ca3af"}
          />
          <Text
            style={[
              styles.badgeText,
              { color: user?.phoneData?.isVerified ? "#22c55e" : "#9ca3af" },
            ]}
          >
            {user?.phoneData?.isVerified ? "Verified" : "Not Verified"}
          </Text>
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
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.2)",
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  editInput: {
    flex: 1,
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: "500",
  },
});

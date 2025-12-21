// components/dashboard/UserProfileCard.tsx
import { useAuth } from "@/contexts/AuthContext";
import { uploadToS3 } from "@/utils/s3Upload";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const ACCENT = "#fe9a00";

export default function UserProfileCard() {
  const { user, refreshUser } = useAuth();
  // Add a loading state if user might be null
  if (!user) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editLastName, setEditLastName] = useState(user.lastName || "");
  const [editEmail, setEditEmail] = useState(user.emaildata.emailAddress);
  const [editPhone, setEditPhone] = useState(user.phoneData.phoneNumber);
  const [editAddress, setEditAddress] = useState(user.address || "");
  const [licenseFront, setLicenseFront] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [licenseBack, setLicenseBack] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [licensePreviewFront, setLicensePreviewFront] = useState(
    user?.licenceAttached?.front || null
  );
  const [licensePreviewBack, setLicensePreviewBack] = useState(
    user?.licenceAttached?.back || null
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditName(user.name);
    setEditLastName(user.lastName || "");
    setEditEmail(user.emaildata.emailAddress);
    setEditPhone(user.phoneData.phoneNumber);
    setEditAddress(user.address || "");
    setLicensePreviewFront(user.licenceAttached?.front || null);
    setLicensePreviewBack(user.licenceAttached?.back || null);
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    if (user) {
      setEditName(user.name);
      setEditLastName(user.lastName);
      setEditEmail(user.emaildata.emailAddress);
      setEditPhone(user.phoneData.phoneNumber);
      setEditAddress(user.address || "");
    }
    Haptics.selectionAsync();
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      let licenseFrontUrl = licensePreviewFront;
      let licenseBackUrl = licensePreviewBack;

      // Upload license front if new
      if (licenseFront && licenseFront.uri) {
        licenseFrontUrl = await uploadToS3(licenseFront, "license-front");
      }

      // Upload license back if new
      if (licenseBack && licenseBack.uri) {
        licenseBackUrl = await uploadToS3(licenseBack, "license-back");
      }

      const token = await AsyncStorage.getItem("authToken");
      const API_URL = process.env.EXPO_PUBLIC_USERS_API || "";

      const requestBody: Record<string, string> = {
        name: editName.trim(),
        lastName: editLastName.trim(),
        address: editAddress.trim(),
      };

      if (licenseFrontUrl) {
        requestBody["licenceAttached.front"] = licenseFrontUrl;
      }
      if (licenseBackUrl) {
        requestBody["licenceAttached.back"] = licenseBackUrl;
      }

      console.log(
        "[profile.tsx] Saving with:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await fetch(`${API_URL}/${user._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const text = await response.text();

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        console.error("[profile.tsx] Failed to parse JSON:", text);
        throw new Error(text || "Invalid response");
      }

      if (result.success) {
        await AsyncStorage.setItem("user", JSON.stringify(result.data));
        await refreshUser();
        Alert.alert("Success", "Profile updated successfully");
        setIsEditing(false);
        setLicenseFront(null);
        setLicenseBack(null);
      } else {
        Alert.alert("Error", result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("[profile.tsx] Save error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Network error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLicenseFront(null);
    setLicenseBack(null);
    Haptics.selectionAsync();
  };

  const pickLicenseImage = async (side: "front" | "back") => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        if (side === "front") {
          setLicenseFront(file);
          setLicensePreviewFront(file.uri);
        } else {
          setLicenseBack(file);
          setLicensePreviewBack(file.uri);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
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
            {user?.name || ""} {user?.lastName || ""}
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
        <ScrollView
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={false}
        >
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
          <View style={styles.editRow}>
            <Ionicons name="location-outline" size={18} color={ACCENT} />
            <TextInput
              value={editAddress}
              onChangeText={setEditAddress}
              style={styles.editInput}
              placeholder="Address"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* License Upload */}
          <View style={styles.licenseSection}>
            <Text style={styles.licenseTitle}>📄 License Documents</Text>

            {/* Front Side */}
            <View style={styles.licenseUploadArea}>
              <Text style={styles.licenseLabel}>License Front</Text>
              {licensePreviewFront ? (
                <View style={styles.licensePreview}>
                  <Image
                    source={{ uri: licensePreviewFront }}
                    style={styles.licenseImage}
                  />
                  <Pressable 
                    onPress={() => pickLicenseImage("front")}
                    style={styles.changeButton}
                  >
                    <Ionicons name="pencil" size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => pickLicenseImage("front")}
                  style={styles.uploadButton}
                >
                  <Ionicons name="image-outline" size={24} color={ACCENT} />
                  <Text style={styles.uploadButtonText}>Upload Front</Text>
                </Pressable>
              )}
            </View>

            {/* Back Side */}
            <View style={styles.licenseUploadArea}>
              <Text style={styles.licenseLabel}>License Back</Text>
              {licensePreviewBack ? (
                <View style={styles.licensePreview}>
                  <Image
                    source={{ uri: licensePreviewBack }}
                    style={styles.licenseImage}
                  />
                  <Pressable
                    onPress={() => pickLicenseImage("back")}
                    style={styles.changeButton}
                  >
                    <Ionicons name="pencil" size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => pickLicenseImage("back")}
                  style={styles.uploadButton}
                >
                  <Ionicons name="image-outline" size={24} color={ACCENT} />
                  <Text style={styles.uploadButtonText}>Upload Back</Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={ACCENT} />
            <Text style={styles.infoText}>{user.emaildata.emailAddress}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={ACCENT} />
            <Text style={styles.infoText}>{user.phoneData.phoneNumber}</Text>
          </View>
          {user.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={ACCENT} />
              <Text style={styles.infoText}>{user.address.trim()}</Text>
            </View>
          )}
          {(user?.licenceAttached?.front || user?.licenceAttached?.back) && (
            <View style={styles.licenseViewSection}>
              <Text style={styles.licenseViewTitle}>📄 License Documents</Text>
              {user.licenceAttached.front && (
                <View style={styles.licenseViewItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.licenseViewText}>Front uploaded</Text>
                </View>
              )}
              {user.licenceAttached.back && (
                <View style={styles.licenseViewItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.licenseViewText}>Back uploaded</Text>
                </View>
              )}
            </View>
          )}
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
  licenseSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.4)",
  },
  licenseTitle: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  licenseUploadArea: {
    marginBottom: 16,
  },
  licenseLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  uploadButton: {
    backgroundColor: "rgba(254,154,0,0.1)",
    borderWidth: 2,
    borderColor: "rgba(254,154,0,0.5)",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  licensePreview: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  licenseImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },
  changeButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: ACCENT,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  licenseViewSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.4)",
  },
  licenseViewTitle: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  licenseViewItem: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    marginBottom: 6,
  },
  licenseViewText: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "500",
  },
});

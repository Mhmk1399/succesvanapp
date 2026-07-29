// components/dashboard/UserProfileCard.tsx
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/global/AppToast";
import { safeFetch } from "@/services/apiClient";
import { uploadToS3 } from "@/utils/s3Upload";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const { showToast } = useToast();
 
  if (!user) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  const [isEditing, setIsEditing] = useState(false);

  // Profile fields
  const [editName, setEditName] = useState(user.name || "");
  const [editLastName, setEditLastName] = useState(user.lastName || "");
  const [editEmail, setEditEmail] = useState(user.emaildata.emailAddress);
  const [editPhone, setEditPhone] = useState(user.phoneData.phoneNumber);
  const [editAddress, setEditAddress] = useState(user.address || "");
  const [editCity, setEditCity] = useState(user.city || "");
  const [editPostalCode, setEditPostalCode] = useState(user.postalCode || "");

  // License states
  const [licenseFront, setLicenseFront] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [licenseBack, setLicenseBack] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [licensePreviewFront, setLicensePreviewFront] = useState(
    user?.licenceAttached?.front || null,
  );
  const [licensePreviewBack, setLicensePreviewBack] = useState(
    user?.licenceAttached?.back || null,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLicenses, setIsUploadingLicenses] = useState(false);

  useEffect(() => {
    setEditName(user.name || "");
    setEditLastName(user.lastName || "");
    setEditEmail(user.emaildata.emailAddress);
    setEditPhone(user.phoneData.phoneNumber);
    setEditAddress(user.address || "");
    setEditCity(user.city || "");
    setEditPostalCode(user.postalCode || "");
    setLicensePreviewFront(user?.licenceAttached?.front || null);
    setLicensePreviewBack(user?.licenceAttached?.back || null);
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    Haptics.selectionAsync();
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const token = await AsyncStorage.getItem("authToken");
      const API_URL = process.env.EXPO_PUBLIC_USERS_API || "";

      const requestBody: Record<string, string> = {
        name: editName.trim(),
        lastName: editLastName.trim(),
        address: editAddress.trim(),
        city: editCity.trim(),
        postalCode: editPostalCode.trim(),
      };
     

      const response = await safeFetch(`${API_URL}/${user._id}`, {
        method: "PUT",
        toast: {
          successTitle: "Profile updated",
          successMessage: "Your account details have been saved.",
          errorTitle: "Update failed",
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response Status:", response.status);
      const text = await response.text();
      console.log("Response Text:", text);

      let result;
      try {
        result = JSON.parse(text);
        console.log("Parsed Result:", result);
      } catch {
        throw new Error(text || "Invalid response");
      }

      if (result.success) {
        await AsyncStorage.setItem("user", JSON.stringify(result.data));
        await refreshUser();
        setIsEditing(false);
      } else {
        showToast({
          type: "error",
          title: "Update failed",
          message: result.error || "Failed to update profile",
        });
      }
    } catch (error) {
      console.log("Profile Update Error:", error);
      showToast({
        type: "error",
        title: "Update failed",
        message: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadLicenses = async () => {
    if (!licenseFront && !licenseBack) {
      showToast({
        type: "error",
        title: "Licence image needed",
        message: "Please select at least one licence image.",
      });
      return;
    }

    setIsUploadingLicenses(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const token = await AsyncStorage.getItem("authToken");
      const API_URL = process.env.EXPO_PUBLIC_USERS_API || "";
      const requestBody: any = { licenceAttached: {} };

      if (licenseFront?.uri) {
        const url = await uploadToS3(licenseFront, "license-front");
        requestBody.licenceAttached.front = url;
      }
      if (licenseBack?.uri) {
        const url = await uploadToS3(licenseBack, "license-back");
        requestBody.licenceAttached.back = url;
      }

      if (Object.keys(requestBody.licenceAttached).length === 0) {
        return;
      }

      const response = await safeFetch(`${API_URL}/${user._id}`, {
        method: "PUT",
        toast: {
          successTitle: "Licence uploaded",
          successMessage: "Your licence images have been saved.",
          errorTitle: "Upload failed",
        },
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
        console.log("Parsed Result:", result);
      } catch {
        throw new Error(text || "Invalid response");
      }

      if (result.success) {
        await AsyncStorage.setItem("user", JSON.stringify(result.data));
        await refreshUser();
        setLicenseFront(null);
        setLicenseBack(null);
      } else {
        showToast({
          type: "error",
          title: "Upload failed",
          message: result.error || "Failed to update licences",
        });
      }
    } catch (error) {
      console.log("License Upload Error:", error);
      showToast({
        type: "error",
        title: "Upload failed",
        message: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setIsUploadingLicenses(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLicenseFront(null);
    setLicenseBack(null);
    setLicensePreviewFront(user?.licenceAttached?.front || null);
    setLicensePreviewBack(user?.licenceAttached?.back || null);
    Haptics.selectionAsync();
  };

  const pickLicenseImage = async (side: "front" | "back") => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        if (side === "front") {
          setLicenseFront(file);
          setLicensePreviewFront(file.uri);
        } else {
          setLicenseBack(file);
          setLicensePreviewBack(file.uri);
        }
        Haptics.selectionAsync();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Image not selected",
        message: "Failed to pick image.",
      });
    }
  };

  const hasLicenseChanges = !!licenseFront || !!licenseBack;

  const fullAddress =
    [user.address, user.city, user.postalCode].filter(Boolean).join(", ") ||
    null;

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
            {user.name} {user.lastName}
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
            <Ionicons name="create-outline" size={20} color="#0f172a" />
          </Pressable>
        ) : (
          <View style={styles.editActions}>
            <Pressable onPress={handleCancel} style={styles.cancelButton}>
              <Ionicons name="close" size={20} color="#ef4444" />
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={styles.saveButton}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <Ionicons name="checkmark" size={20} color="#0f172a" />
              )}
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {isEditing ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.editRow}>
              <Ionicons name="person-outline" size={20} color={ACCENT} />
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={styles.editInput}
                placeholder="First Name"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.editRow}>
              <Ionicons name="person-outline" size={20} color={ACCENT} />
              <TextInput
                value={editLastName}
                onChangeText={setEditLastName}
                style={styles.editInput}
                placeholder="Last Name"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.editRow}>
              <Ionicons name="mail-outline" size={20} color={ACCENT} />
              <TextInput
                value={editEmail}
                style={styles.editInput}
                editable={false}
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.editRow}>
              <Ionicons name="call-outline" size={20} color={ACCENT} />
              <TextInput
                value={editPhone}
                style={styles.editInput}
                editable={false}
                placeholderTextColor="#6b7280"
              />
            </View>
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>

            <View style={styles.editRow}>
              <Ionicons name="home-outline" size={20} color={ACCENT} />
              <TextInput
                value={editAddress}
                onChangeText={setEditAddress}
                style={styles.editInput}
                placeholder="Street Address"
                placeholderTextColor="#6b7280"
                multiline
              />
            </View>

            <View style={styles.editRow}>
              <Ionicons name="location-outline" size={20} color={ACCENT} />
              <TextInput
                value={editCity}
                onChangeText={setEditCity}
                style={styles.editInput}
                placeholder="City"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.editRow}>
              <Ionicons name="map-outline" size={20} color={ACCENT} />
              <TextInput
                value={editPostalCode}
                onChangeText={setEditPostalCode}
                style={styles.editInput}
                placeholder="Postal Code"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* License Upload */}
          <View style={styles.licenseSection}>
            <Text style={styles.licenseTitle}>License Documents</Text>

            <View style={styles.licenseUploadArea}>
              <Text style={styles.licenseLabel}>Front Side</Text>
              {licensePreviewFront ? (
                <View style={styles.licensePreview}>
                  <Image
                    source={{ uri: licensePreviewFront }}
                    style={styles.licenseImage}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => pickLicenseImage("front")}
                    style={styles.changeButton}
                  >
                    <Ionicons name="pencil" size={18} color="#fff" />
                  </Pressable>
                  {licenseFront && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Pressable
                  onPress={() => pickLicenseImage("front")}
                  style={styles.uploadButton}
                >
                  <Ionicons name="image-outline" size={28} color={ACCENT} />
                  <Text style={styles.uploadButtonText}>Upload Front</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.licenseUploadArea}>
              <Text style={styles.licenseLabel}>Back Side</Text>
              {licensePreviewBack ? (
                <View style={styles.licensePreview}>
                  <Image
                    source={{ uri: licensePreviewBack }}
                    style={styles.licenseImage}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => pickLicenseImage("back")}
                    style={styles.changeButton}
                  >
                    <Ionicons name="pencil" size={18} color="#fff" />
                  </Pressable>
                  {licenseBack && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Pressable
                  onPress={() => pickLicenseImage("back")}
                  style={styles.uploadButton}
                >
                  <Ionicons name="image-outline" size={28} color={ACCENT} />
                  <Text style={styles.uploadButtonText}>Upload Back</Text>
                </Pressable>
              )}
            </View>

            {hasLicenseChanges && (
              <Pressable
                onPress={handleUploadLicenses}
                disabled={isUploadingLicenses}
                style={({ pressed }) => [
                  styles.submitLicensesButton,
                  isUploadingLicenses && styles.submitLicensesButtonDisabled,
                  pressed && styles.submitLicensesButtonPressed,
                ]}
              >
                {isUploadingLicenses ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <Text style={styles.submitLicensesButtonText}>
                    Submit Licenses
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={ACCENT} />
            <Text style={styles.infoText}>{user.emaildata.emailAddress}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={ACCENT} />
            <Text style={styles.infoText}>{user.phoneData.phoneNumber}</Text>
          </View>

          {fullAddress && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={ACCENT} />
              <Text style={styles.infoText}>{fullAddress}</Text>
            </View>
          )}

          {(user?.licenceAttached?.front || user?.licenceAttached?.back) && (
            <View style={styles.licenseViewSection}>
              <Text style={styles.licenseViewTitle}>Licence Documents</Text>
              <View style={styles.licenseGrid}>
                {user.licenceAttached.front && (
                  <View style={styles.licenseViewItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#22c55e"
                    />
                    <Text style={styles.licenseViewText}>Front uploaded</Text>
                  </View>
                )}
                {user.licenceAttached.back && (
                  <View style={styles.licenseViewItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#22c55e"
                    />
                    <Text style={styles.licenseViewText}>Back uploaded</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </>
      )}

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Ionicons name="person-outline" size={18} color={ACCENT} />
          <Text style={styles.badgeText}>Role: {user?.role || "user"}</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
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
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(30,41,59,0.8)",
    borderWidth: 2,
    borderColor: "rgba(254,154,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatar: { width: 48, height: 28 },
  nameBlock: { flex: 1 },
  name: { color: "#f9fafb", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#9ca3af", fontSize: 14, marginTop: 4 },
  editButton: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  editButtonPressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
  divider: {
    height: 1,
    backgroundColor: "rgba(148,163,184,0.3)",
    marginVertical: 24,
  },
  section: { marginBottom: 28 },
  sectionTitle: {
    color: "#e5e7eb",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 14,
    marginBottom: 16,
    backgroundColor: "rgba(30,41,59,0.6)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  editInput: { flex: 1, color: "#f9fafb", fontSize: 16, fontWeight: "500" },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 14,
    marginBottom: 16,
  },
  infoText: { color: "#e5e7eb", fontSize: 16, fontWeight: "500", flex: 1 },
  licenseSection: {
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.3)",
  },
  licenseTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  licenseUploadArea: { marginBottom: 24 },
  licenseLabel: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  uploadButton: {
    backgroundColor: "rgba(254,154,0,0.08)",
    borderWidth: 2,
    borderColor: "rgba(254,154,0,0.4)",
    borderStyle: "dashed",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  uploadButtonText: {
    color: ACCENT,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
  },
  licensePreview: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  licenseImage: { width: "100%", height: 180, borderRadius: 20 },
  changeButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: ACCENT,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  newBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  newBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  submitLicensesButton: {
    backgroundColor: ACCENT,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 12,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  submitLicensesButtonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
  submitLicensesButtonDisabled: { backgroundColor: "rgba(254,154,0,0.5)" },
  submitLicensesButtonPressed: { transform: [{ scale: 0.97 }] },
  licenseViewSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "rgba(30,41,59,0.4)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },
  licenseViewTitle: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  licenseGrid: { flexDirection: "row", gap: 16, justifyContent: "center" },
  licenseViewItem: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    padding: 12,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderRadius: 16,
  },
  licenseViewText: { color: "#22c55e", fontSize: 14, fontWeight: "600" },
  badgeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.2)",
  },
  badge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(254,154,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  badgeText: { color: ACCENT, fontSize: 14, fontWeight: "600" },
  editActions: { flexDirection: "row", gap: 12 },
  cancelButton: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.15)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  saveButton: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

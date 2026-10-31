// components/dashboard/UserProfileCard.tsx
import { useAuth } from "@/contexts/AuthContext";
import { BRAND_LOGO_URI } from "@/constants/branding";
import { useToast } from "@/components/global/AppToast";
import { ImageViewerProvider, useImageViewer } from "@/components/global/ImageViewer";
import { safeFetch } from "@/services/apiClient";
import type { User } from "@/types/type";
import { customerJourneyService, type LicenceDetailsReview } from "@/services/customerJourneyService";
import { LicenceDetailsReviewModal } from "@/components/dashboard/LicenseUploadModal";
import { uploadToS3 } from "@/utils/s3Upload";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const ACCENT = "#fe9a00";

type ProfileProps = { onLicenceLayout?: (y: number) => void; onAddLicence?: () => void };

export default function UserProfileCard(props: ProfileProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  return <ImageViewerProvider><LoadedUserProfileCard user={user} {...props} /></ImageViewerProvider>;
}

function LoadedUserProfileCard({ user, onLicenceLayout, onAddLicence }: { user: User } & ProfileProps) {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const { openDocument } = useImageViewer();

  const [isEditing, setIsEditing] = useState(false);

  // Profile fields
  const [editName, setEditName] = useState(user.name || "");
  const [editLastName, setEditLastName] = useState(user.lastName || "");
  const [editEmail, setEditEmail] = useState(user.emaildata.emailAddress);
  const [editPhone, setEditPhone] = useState(user.phoneData.phoneNumber);
  const [editAddress, setEditAddress] = useState(user.address || "");
  const [editCity, setEditCity] = useState(user.city || "");
  const [editPostalCode, setEditPostalCode] = useState(user.postalCode || "");
  const [avatarAsset, setAvatarAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || null);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);

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
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [isUploadingLicenses, setIsUploadingLicenses] = useState(false);
  const [licenceReview, setLicenceReview] = useState<{ front: string; back: string; details: LicenceDetailsReview } | null>(null);
  const [isDeletingLicense, setIsDeletingLicense] = useState({
    front: false,
    back: false,
  });

  useEffect(() => {
    setEditName(user.name || "");
    setEditLastName(user.lastName || "");
    setEditEmail(user.emaildata.emailAddress);
    setEditPhone(user.phoneData.phoneNumber);
    setEditAddress(user.address || "");
    setEditCity(user.city || "");
    setEditPostalCode(user.postalCode || "");
    setAvatarPreview(user.avatar || null);
    setAvatarAsset(null);
    setAvatarUploadProgress(0);
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

      if (avatarAsset?.uri) {
        setAvatarUploadProgress(1);
        requestBody.avatar = await uploadToS3(
          avatarAsset,
          "avatar",
          setAvatarUploadProgress,
        );
      }

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
        setAvatarAsset(null);
        setAvatarUploadProgress(0);
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
      setAvatarUploadProgress(0);
    }
  };

  const pickAvatarImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.86,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        setAvatarAsset(file);
        setAvatarPreview(file.uri);
        await Haptics.selectionAsync();
      }
    } catch {
      showToast({
        type: "error",
        title: "Image not selected",
        message: "Failed to pick avatar image.",
      });
    }
  };

  const handleDeleteAvatar = async () => {
    if (avatarAsset) {
      setAvatarAsset(null);
      setAvatarPreview(user.avatar || null);
      setAvatarUploadProgress(0);
      await Haptics.selectionAsync();
      return;
    }

    if (!user.avatar) {
      setAvatarPreview(null);
      return;
    }

    setIsDeletingAvatar(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const token = await AsyncStorage.getItem("authToken");
      const API_URL = process.env.EXPO_PUBLIC_USERS_API || "";

      const response = await safeFetch(`${API_URL}/${user._id}`, {
        method: "PUT",
        toast: {
          successTitle: "Avatar deleted",
          successMessage: "Your profile photo has been removed.",
          errorTitle: "Delete failed",
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deleteAvatar: true }),
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(text || "Invalid response");
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to delete avatar");
      }

      await AsyncStorage.setItem("user", JSON.stringify(result.data));
      await refreshUser();
      setAvatarAsset(null);
      setAvatarPreview(null);
    } catch (error) {
      console.log("Avatar Delete Error:", error);
      showToast({
        type: "error",
        title: "Delete failed",
        message: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setIsDeletingAvatar(false);
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
      const requestBody: any = { licenceAttached: { ...user.licenceAttached } };

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
        const { front, back } = requestBody.licenceAttached;
        if (front && back) {
          try {
            const details = await customerJourneyService.extractStoredLicence(front, back);
            setLicenceReview({ front, back, details });
          } catch (error) {
            showToast({ type: "error", title: "Licence scan failed", message: error instanceof Error ? error.message : "Please try scanning again." });
          }
        }
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

  const handleDeleteLicense = async (side: "front" | "back") => {
    const pendingImage = side === "front" ? licenseFront : licenseBack;
    const storedUrl = user?.licenceAttached?.[side];

    if (pendingImage) {
      if (side === "front") {
        setLicenseFront(null);
        setLicensePreviewFront(storedUrl || null);
      } else {
        setLicenseBack(null);
        setLicensePreviewBack(storedUrl || null);
      }
      await Haptics.selectionAsync();
      return;
    }

    if (!storedUrl) {
      if (side === "front") setLicensePreviewFront(null);
      else setLicensePreviewBack(null);
      return;
    }

    setIsDeletingLicense((prev) => ({ ...prev, [side]: true }));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const token = await AsyncStorage.getItem("authToken");
      const API_URL = process.env.EXPO_PUBLIC_USERS_API || "";

      const response = await safeFetch(`${API_URL}/${user._id}`, {
        method: "PUT",
        toast: {
          successTitle: "Licence deleted",
          successMessage: `The ${side} side has been removed from your profile.`,
          errorTitle: "Delete failed",
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deleteLicenceSide: side }),
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(text || "Invalid response");
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to delete licence");
      }

      await AsyncStorage.setItem("user", JSON.stringify(result.data));
      await refreshUser();
      if (side === "front") {
        setLicenseFront(null);
        setLicensePreviewFront(null);
      } else {
        setLicenseBack(null);
        setLicensePreviewBack(null);
      }
    } catch (error) {
      console.log("License Delete Error:", error);
      showToast({
        type: "error",
        title: "Delete failed",
        message: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setIsDeletingLicense((prev) => ({ ...prev, [side]: false }));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarAsset(null);
    setAvatarPreview(user.avatar || null);
    setAvatarUploadProgress(0);
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
    } catch {
      showToast({
        type: "error",
        title: "Image not selected",
        message: "Failed to pick image.",
      });
    }
  };

  const pickLicensePdf = async (side: "front" | "back") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
      if (result.canceled || !result.assets[0]) return;
      const file = result.assets[0];
      const asset: ImagePicker.ImagePickerAsset = { uri: file.uri, fileName: file.name, mimeType: file.mimeType || "application/pdf", fileSize: file.size, width: 0, height: 0 };
      if (side === "front") { setLicenseFront(asset); setLicensePreviewFront(asset.uri); }
      else { setLicenseBack(asset); setLicensePreviewBack(asset.uri); }
    } catch {
      showToast({ type: "error", title: "File not selected", message: "Could not select the PDF." });
    }
  };

  const hasLicenseChanges = !!licenseFront || !!licenseBack;

  const userAvatar =
    typeof avatarPreview === "string" && avatarPreview.trim()
      ? avatarPreview.trim()
      : null;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={["rgba(14,24,42,0.98)", "rgba(7,14,26,0.99)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.cardTopLine} />
      <View pointerEvents="none" style={styles.cardGlow} />

      <View style={styles.headerRow}>
        <View style={styles.avatarHalo}>
          <LinearGradient
            colors={["#fff0c7", "#fe9a00", "#ff7400"]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.avatarRing}
          >
            <Pressable
              disabled={isSaving || isDeletingAvatar || (!isEditing && !userAvatar)}
              accessibilityRole="button"
              accessibilityLabel={isEditing ? "Change profile photo" : "View profile photo"}
              onPress={() => { if (isEditing) void pickAvatarImage(); else if (userAvatar) openDocument({ uri: userAvatar, title: "Profile photo" }); }}
              style={styles.avatarInner}
            >
              <Image
                source={
                  userAvatar
                    ? { uri: userAvatar }
                    : { uri: BRAND_LOGO_URI }
                }
                style={[styles.avatar, userAvatar && styles.avatarPhoto]}
                resizeMode={userAvatar ? "cover" : "contain"}
              />
              {isEditing && (
                <View style={styles.avatarEditOverlay}>
                  <Ionicons name="camera" size={15} color="#07111f" />
                </View>
              )}
            </Pressable>
          </LinearGradient>
          {isEditing && (
            <View style={styles.avatarControls}>
              <Pressable
                onPress={pickAvatarImage}
                disabled={isSaving || isDeletingAvatar}
                style={({ pressed }) => [
                  styles.avatarMiniButton,
                  pressed && styles.avatarMiniButtonPressed,
                  (isSaving || isDeletingAvatar) && styles.avatarMiniDisabled,
                ]}
              >
                <Ionicons name="camera-outline" size={13} color="#07111f" />
              </Pressable>
              {(userAvatar || avatarAsset) && (
                <Pressable
                  onPress={handleDeleteAvatar}
                  disabled={isSaving || isDeletingAvatar}
                  style={({ pressed }) => [
                    styles.avatarDeleteButton,
                    pressed && styles.avatarMiniButtonPressed,
                    (isSaving || isDeletingAvatar) && styles.avatarMiniDisabled,
                  ]}
                >
                  {isDeletingAvatar ? (
                    <ActivityIndicator size="small" color="#fb7185" />
                  ) : (
                    <Ionicons name="trash-outline" size={13} color="#fb7185" />
                  )}
                </Pressable>
              )}
            </View>
          )}
          {avatarAsset && <View style={styles.avatarPendingDot} />}
        </View>

        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name} {user.lastName}
          </Text>
          <View style={styles.memberRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={12}
              color={ACCENT}
            />
          <Text style={styles.subtitle}>Success Van Hire Member</Text>
          </View>
          {isEditing && avatarAsset && (
            <Text style={styles.avatarHint}>
              {isSaving && avatarUploadProgress > 0
                ? `Uploading photo ${avatarUploadProgress}%`
                : "New profile photo selected"}
            </Text>
          )}
        </View>

        {!isEditing ? (
          <Pressable
            onPress={handleEdit}
            hitSlop={8}
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.editButtonPressed,
            ]}
          >
            <LinearGradient
              colors={["#ffb332", ACCENT, "#f27c00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="create-outline" size={18} color="#07111f" />
          </Pressable>
        ) : (
          <View style={styles.editActions}>
            <Pressable
              onPress={handleCancel}
              hitSlop={6}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.actionPressed,
              ]}
            >
              <Ionicons name="close" size={19} color="#aeb8c8" />
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              hitSlop={6}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && !isSaving && styles.actionPressed,
                isSaving && styles.actionDisabled,
              ]}
            >
              <LinearGradient
                colors={["#ffb332", ACCENT, "#f27c00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {isSaving ? (
                <ActivityIndicator size="small" color="#07111f" />
              ) : (
                <Ionicons name="checkmark" size={21} color="#07111f" />
              )}
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={15} color={ACCENT} />
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.sectionHeaderLine} />
        </View>

        {isEditing ? (
          <>
            <ProfileInputRow
              icon="person-outline"
              label="First Name"
              value={editName}
              onChangeText={setEditName}
              placeholder="First name"
            />
            <ProfileInputRow
              icon="person-outline"
              label="Last Name"
              value={editLastName}
              onChangeText={setEditLastName}
              placeholder="Last name"
            />
            <ProfileInputRow
              icon="mail-outline"
              label="Email Address"
              value={editEmail}
              editable={false}
              placeholder="Email address"
            />
            <ProfileInputRow
              icon="call-outline"
              label="Phone Number"
              value={editPhone}
              editable={false}
              placeholder="Phone number"
              last
            />
          </>
        ) : (
          <>
            <ProfileInfoRow
              icon="person-outline"
              label="First Name"
              value={user.name || "Not added yet"}
            />
            <ProfileInfoRow
              icon="person-outline"
              label="Last Name"
              value={user.lastName || "Not added yet"}
            />
            <ProfileInfoRow
              icon="mail-outline"
              label="Email Address"
              value={user.emaildata.emailAddress}
            />
            <ProfileInfoRow
              icon="call-outline"
              label="Phone Number"
              value={user.phoneData.phoneNumber}
              last
            />
          </>
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location" size={15} color={ACCENT} />
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.sectionHeaderLine} />
        </View>

        {isEditing ? (
          <>
            <ProfileInputRow
              icon="home-outline"
              label="Home Address"
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="Street address"
              multiline
            />
            <ProfileInputRow
              icon="location-outline"
              label="City"
              value={editCity}
              onChangeText={setEditCity}
              placeholder="City"
            />
            <ProfileInputRow
              icon="map-outline"
              label="Postal Code"
              value={editPostalCode}
              onChangeText={setEditPostalCode}
              placeholder="Postal code"
              keyboardType="numeric"
              last
            />
          </>
        ) : (
          <>
            <ProfileInfoRow
              icon="home-outline"
              label="Home Address"
              value={user.address || "Not added yet"}
              muted={!user.address}
            />
            <ProfileInfoRow
              icon="location-outline"
              label="City"
              value={user.city || "Not added yet"}
              muted={!user.city}
            />
            <ProfileInfoRow
              icon="map-outline"
              label="Postal Code"
              value={user.postalCode || "Not added yet"}
              muted={!user.postalCode}
              last
            />
          </>
        )}
      </View>

      {isEditing ? (
        <View testID="profile-licence-section" style={[styles.sectionCard, styles.licenseSectionCard]} onLayout={(event) => onLicenceLayout?.(event.nativeEvent.layout.y)}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={15} color={ACCENT} />
            <Text style={styles.sectionTitle}>Licence Documents</Text>
            <View style={styles.sectionHeaderLine} />
          </View>

          <View style={styles.licenseUploadArea}>
            <Text style={styles.licenseLabel}>Front Side</Text>
            {licensePreviewFront ? (
              <View style={styles.licensePreview}>
                <Pressable accessibilityRole="button" accessibilityLabel="View front licence" onPress={() => openDocument({ uri: licensePreviewFront, title: "Driving licence - front", mimeType: licenseFront?.mimeType })}>
                {licenseFront?.mimeType === "application/pdf" || /\.pdf(?:\?|$)/i.test(licensePreviewFront) ? <View style={[styles.licenseImage, { alignItems: "center", justifyContent: "center" }]}><Ionicons name="document-text-outline" size={36} color={ACCENT} /></View> : <Image
                  source={{ uri: licensePreviewFront }}
                  style={styles.licenseImage}
                  resizeMode="cover"
                />}
                </Pressable>
                <View style={styles.licensePreviewActions}>
                  <Pressable
                    onPress={() => handleDeleteLicense("front")}
                    disabled={isDeletingLicense.front || isUploadingLicenses}
                    style={[
                      styles.deleteLicenseButton,
                      (isDeletingLicense.front || isUploadingLicenses) &&
                        styles.licenseActionDisabled,
                    ]}
                  >
                    {isDeletingLicense.front ? (
                      <ActivityIndicator size="small" color="#fb7185" />
                    ) : (
                      <Ionicons name="trash-outline" size={16} color="#fb7185" />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => pickLicenseImage("front")}
                    disabled={isDeletingLicense.front || isUploadingLicenses}
                    style={[
                      styles.changeButton,
                      (isDeletingLicense.front || isUploadingLicenses) &&
                        styles.licenseActionDisabled,
                    ]}
                  >
                    <Ionicons name="pencil" size={16} color="#07111f" />
                  </Pressable>
                </View>
                {licenseFront && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
            ) : (
              <Pressable
                onPress={() => pickLicenseImage("front")}
                style={({ pressed }) => [
                  styles.uploadButton,
                  pressed && styles.uploadButtonPressed,
                ]}
              >
                <Ionicons name="image-outline" size={26} color={ACCENT} />
                <Text style={styles.uploadButtonText}>Upload Front</Text>
              </Pressable>
            )}
            <Pressable onPress={() => pickLicensePdf("front")} disabled={isUploadingLicenses} style={{ paddingVertical: 8 }}><Text style={{ color: ACCENT }}>Choose front PDF</Text></Pressable>
          </View>

          <View style={styles.licenseUploadArea}>
            <Text style={styles.licenseLabel}>Back Side</Text>
            {licensePreviewBack ? (
              <View style={styles.licensePreview}>
                <Pressable accessibilityRole="button" accessibilityLabel="View back licence" onPress={() => openDocument({ uri: licensePreviewBack, title: "Driving licence - back", mimeType: licenseBack?.mimeType })}>
                {licenseBack?.mimeType === "application/pdf" || /\.pdf(?:\?|$)/i.test(licensePreviewBack) ? <View style={[styles.licenseImage, { alignItems: "center", justifyContent: "center" }]}><Ionicons name="document-text-outline" size={36} color={ACCENT} /></View> : <Image
                  source={{ uri: licensePreviewBack }}
                  style={styles.licenseImage}
                  resizeMode="cover"
                />}
                </Pressable>
                <View style={styles.licensePreviewActions}>
                  <Pressable
                    onPress={() => handleDeleteLicense("back")}
                    disabled={isDeletingLicense.back || isUploadingLicenses}
                    style={[
                      styles.deleteLicenseButton,
                      (isDeletingLicense.back || isUploadingLicenses) &&
                        styles.licenseActionDisabled,
                    ]}
                  >
                    {isDeletingLicense.back ? (
                      <ActivityIndicator size="small" color="#fb7185" />
                    ) : (
                      <Ionicons name="trash-outline" size={16} color="#fb7185" />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => pickLicenseImage("back")}
                    disabled={isDeletingLicense.back || isUploadingLicenses}
                    style={[
                      styles.changeButton,
                      (isDeletingLicense.back || isUploadingLicenses) &&
                        styles.licenseActionDisabled,
                    ]}
                  >
                    <Ionicons name="pencil" size={16} color="#07111f" />
                  </Pressable>
                </View>
                {licenseBack && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
            ) : (
              <Pressable
                onPress={() => pickLicenseImage("back")}
                style={({ pressed }) => [
                  styles.uploadButton,
                  pressed && styles.uploadButtonPressed,
                ]}
              >
                <Ionicons name="image-outline" size={26} color={ACCENT} />
                <Text style={styles.uploadButtonText}>Upload Back</Text>
              </Pressable>
            )}
            <Pressable onPress={() => pickLicensePdf("back")} disabled={isUploadingLicenses} style={{ paddingVertical: 8 }}><Text style={{ color: ACCENT }}>Choose back PDF</Text></Pressable>
          </View>

          {hasLicenseChanges && (
            <Pressable
              onPress={handleUploadLicenses}
              disabled={isUploadingLicenses}
              style={({ pressed }) => [
                styles.submitLicensesButton,
                isUploadingLicenses && styles.submitLicensesButtonDisabled,
                pressed &&
                  !isUploadingLicenses &&
                  styles.submitLicensesButtonPressed,
              ]}
            >
              <LinearGradient
                colors={["#ffb332", ACCENT, "#f27c00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitLicensesGradient}
              >
                {isUploadingLicenses ? (
                  <ActivityIndicator size="small" color="#07111f" />
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={18}
                      color="#07111f"
                    />
                    <Text style={styles.submitLicensesButtonText}>
                      Submit Licences
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          )}
        </View>
      ) : (
          <View testID="profile-licence-section" style={[styles.sectionCard, styles.licenseSectionCard]} onLayout={(event) => onLicenceLayout?.(event.nativeEvent.layout.y)}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card-outline" size={15} color={ACCENT} />
              <Text style={styles.sectionTitle}>Licence Documents</Text>
              <View style={styles.sectionHeaderLine} />
            </View>
            <View style={styles.licenseGrid}>
              {user.licenceAttached?.front && (
                <Pressable accessibilityRole="button" accessibilityLabel="View front licence" onPress={() => openDocument({ uri: user.licenceAttached!.front!, title: "Driving licence - front" })} style={styles.licenseViewItem}>
                  <Ionicons name="checkmark-circle" size={17} color="#32d47c" />
                  <Text style={styles.licenseViewText}>View front</Text>
                </Pressable>
              )}
              {user.licenceAttached?.back && (
                <Pressable accessibilityRole="button" accessibilityLabel="View back licence" onPress={() => openDocument({ uri: user.licenceAttached!.back!, title: "Driving licence - back" })} style={styles.licenseViewItem}>
                  <Ionicons name="checkmark-circle" size={17} color="#32d47c" />
                  <Text style={styles.licenseViewText}>View back</Text>
                </Pressable>
              )}
              {!user.licenceAttached?.front || !user.licenceAttached?.back ? (
                <Pressable accessibilityRole="button" onPress={onAddLicence} style={styles.licenseViewItem}>
                  <Ionicons name="cloud-upload-outline" size={17} color={ACCENT} />
                  <Text style={styles.licenseViewText}>Upload licence</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
      )}
      <Modal visible={Boolean(licenceReview)} transparent animationType="fade" onRequestClose={() => setLicenceReview(null)}>
        <ImageViewerProvider>
        <LicenceDetailsReviewModal visible={Boolean(licenceReview)} imagePreview={licenceReview?.front} details={licenceReview?.details || null} saving={isUploadingLicenses} onCancel={() => setLicenceReview(null)} onConfirm={async (details) => {
          if (!licenceReview) return;
          setIsUploadingLicenses(true);
          try {
            await customerJourneyService.updateUserLicence(user._id, { front: licenceReview.front, back: licenceReview.back }, details);
            await refreshUser();
            setLicenceReview(null);
            showToast({ type: "success", title: "Licence confirmed", message: "Your licence details have been saved." });
          } catch (error) {
            showToast({ type: "error", title: "Could not save licence", message: error instanceof Error ? error.message : "Please try again." });
          } finally { setIsUploadingLicenses(false); }
        }} />
        </ImageViewerProvider>
      </Modal>
    </View>
  );
}

type ProfileInfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  muted?: boolean;
  last?: boolean;
};

function ProfileInfoRow({
  icon,
  label,
  value,
  muted = false,
  last = false,
}: ProfileInfoRowProps) {
  return (
    <View style={[styles.fieldRow, last && styles.fieldRowLast]}>
      <View style={styles.fieldIcon}>
        <Ionicons name={icon} size={16} color={ACCENT} />
      </View>
      <Text style={styles.fieldLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[styles.fieldValue, muted && styles.fieldValueMuted]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={15}
        color="rgba(213,222,235,0.42)"
      />
    </View>
  );
}

type ProfileInputRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder: string;
  editable?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
  last?: boolean;
};

function ProfileInputRow({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  multiline = false,
  keyboardType = "default",
  last = false,
}: ProfileInputRowProps) {
  return (
    <View style={[styles.fieldRow, last && styles.fieldRowLast]}>
      <View style={styles.fieldIcon}>
        <Ionicons name={icon} size={16} color={ACCENT} />
      </View>
      <Text style={styles.fieldLabel} numberOfLines={1}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(202,212,226,0.35)"
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
        selectionColor={ACCENT}
        style={[
          styles.fieldInput,
          multiline && styles.fieldInputMultiline,
          !editable && styles.fieldInputDisabled,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 19,
    padding: 11,
    marginBottom: 122,
    borderWidth: 1,
    borderColor: "rgba(102,136,176,0.17)",
    backgroundColor: "#08111f",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.28,
        shadowRadius: 22,
      },
      android: { elevation: 7 },
    }),
  },
  cardTopLine: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  cardGlow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    top: -64,
    left: -30,
    backgroundColor: "rgba(254,154,0,0.055)",
  },
  headerRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
    paddingVertical: 4,
    marginBottom: 10,
  },
  avatarHalo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    backgroundColor: "rgba(254,154,0,0.1)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.38,
        shadowRadius: 13,
      },
      android: { elevation: 7 },
    }),
  },
  avatarRing: {
    width: 53,
    height: 53,
    borderRadius: 27,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a1424",
    borderWidth: 2,
    borderColor: "#0a1424",
  },
  avatar: { width: 37, height: 27 },
  avatarPhoto: {
    width: "100%",
    height: "100%",
  },
  avatarEditOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.86)",
  },
  avatarControls: {
    position: "absolute",
    right: -9,
    bottom: -6,
    flexDirection: "row",
    gap: 4,
  },
  avatarMiniButton: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    borderWidth: 1,
    borderColor: "rgba(255,219,146,0.72)",
  },
  avatarDeleteButton: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.42)",
  },
  avatarMiniButtonPressed: { opacity: 0.78, transform: [{ scale: 0.94 }] },
  avatarMiniDisabled: { opacity: 0.5 },
  avatarPendingDot: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#25c96f",
    borderWidth: 2,
    borderColor: "#08111f",
  },
  nameBlock: { flex: 1, minWidth: 0 },
  name: {
    color: "#f8fafc",
    fontSize: 16.5,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  subtitle: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: "700",
  },
  avatarHint: {
    color: "#25c96f",
    fontSize: 8.5,
    fontWeight: "800",
    marginTop: 4,
  },
  editButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,219,146,0.6)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 9,
      },
      android: { elevation: 7 },
    }),
  },
  editButtonPressed: { opacity: 0.84, transform: [{ scale: 0.95 }] },
  editActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,48,72,0.88)",
    borderWidth: 1,
    borderColor: "rgba(137,162,196,0.16)",
  },
  saveButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,219,146,0.6)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.34,
        shadowRadius: 9,
      },
      android: { elevation: 7 },
    }),
  },
  actionPressed: { opacity: 0.76, transform: [{ scale: 0.95 }] },
  actionDisabled: { opacity: 0.62 },
  sectionCard: {
    overflow: "hidden",
    marginBottom: 10,
    padding: 8,
    borderRadius: 15,
    backgroundColor: "rgba(9,18,32,0.78)",
    borderWidth: 1,
    borderColor: "rgba(91,126,166,0.11)",
  },
  sectionHeader: {
    minHeight: 24,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },
  sectionTitle: {
    color: "rgba(244,247,252,0.92)",
    fontSize: 11.5,
    fontWeight: "800",
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    marginLeft: 3,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  fieldRow: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    marginBottom: 6,
    borderRadius: 11,
    backgroundColor: "rgba(17,29,49,0.92)",
    borderWidth: 1,
    borderColor: "rgba(101,134,173,0.1)",
  },
  fieldRowLast: { marginBottom: 0 },
  fieldIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  fieldLabel: {
    width: 84,
    color: "rgba(199,209,223,0.57)",
    fontSize: 9.2,
    fontWeight: "700",
  },
  fieldValue: {
    flex: 1,
    color: "#eef2f7",
    fontSize: 10.2,
    fontWeight: "600",
    paddingRight: 6,
  },
  fieldValueMuted: { color: "rgba(202,212,226,0.45)" },
  fieldInput: {
    flex: 1,
    minHeight: 42,
    paddingVertical: 9,
    color: "#f8fafc",
    fontSize: 10.4,
    fontWeight: "600",
  },
  fieldInputMultiline: {
    minHeight: 52,
    textAlignVertical: "center",
  },
  fieldInputDisabled: { color: "rgba(225,232,242,0.58)" },
  licenseSectionCard: { paddingBottom: 10 },
  licenseUploadArea: { marginBottom: 12 },
  licenseLabel: {
    color: "rgba(196,207,222,0.55)",
    fontSize: 9,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  uploadButton: {
    minHeight: 92,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(254,154,0,0.3)",
    backgroundColor: "rgba(254,154,0,0.045)",
  },
  uploadButtonPressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  uploadButtonText: {
    color: ACCENT,
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 6,
  },
  licensePreview: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#0a1220",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  licenseImage: { width: "100%", height: 140 },
  licensePreviewActions: {
    position: "absolute",
    left: 9,
    right: 9,
    bottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  changeButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },
  deleteLicenseButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.86)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.32)",
  },
  licenseActionDisabled: { opacity: 0.55 },
  newBadge: {
    position: "absolute",
    top: 9,
    left: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: "#25c96f",
  },
  newBadgeText: { color: "#fff", fontSize: 8, fontWeight: "900" },
  submitLicensesButton: {
    overflow: "hidden",
    borderRadius: 12,
    marginTop: 2,
  },
  submitLicensesGradient: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  submitLicensesButtonText: {
    color: "#07111f",
    fontSize: 11.5,
    fontWeight: "900",
  },
  submitLicensesButtonDisabled: { opacity: 0.55 },
  submitLicensesButtonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  licenseGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  licenseViewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(50,212,124,0.07)",
    borderWidth: 1,
    borderColor: "rgba(50,212,124,0.14)",
  },
  licenseViewText: { color: "#52df91", fontSize: 9.5, fontWeight: "700" },
});

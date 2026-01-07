import { uploadToS3 } from "@/utils/s3Upload";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ACCENT = "#fe9a00";

interface LicenseUploadModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export default function LicenseUploadModal({
  visible,
  onClose,
  userId,
  onSuccess,
}: LicenseUploadModalProps) {
  const [licenseFront, setLicenseFront] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [licenseBack, setLicenseBack] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async (side: "front" | "back") => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        if (side === "front") {
          setLicenseFront(result.assets[0]);
        } else {
          setLicenseBack(result.assets[0]);
        }
        Haptics.selectionAsync();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleUpload = async () => {
    if (!licenseFront || !licenseBack) {
      Alert.alert("Error", "Please select both front and back images");
      return;
    }

    setIsUploading(true);
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

      const response = await fetch(`${API_URL}/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        await AsyncStorage.setItem("user", JSON.stringify(result.data));
        Alert.alert("Success", "Licenses uploaded successfully");
        onSuccess();
        handleClose();
      } else {
        Alert.alert("Error", result.error || "Failed to upload licenses");
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Network error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setLicenseFront(null);
    setLicenseBack(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Upload License</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Please upload both sides of your driving license
          </Text>

          <View style={styles.uploadArea}>
            <Text style={styles.label}>Front Side</Text>
            {licenseFront ? (
              <View style={styles.preview}>
                <Image source={{ uri: licenseFront.uri }} style={styles.image} />
                <Pressable onPress={() => pickImage("front")} style={styles.changeBtn}>
                  <Ionicons name="pencil" size={16} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => pickImage("front")} style={styles.uploadBtn}>
                <Ionicons name="image-outline" size={32} color={ACCENT} />
                <Text style={styles.uploadText}>Upload Front</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.uploadArea}>
            <Text style={styles.label}>Back Side</Text>
            {licenseBack ? (
              <View style={styles.preview}>
                <Image source={{ uri: licenseBack.uri }} style={styles.image} />
                <Pressable onPress={() => pickImage("back")} style={styles.changeBtn}>
                  <Ionicons name="pencil" size={16} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => pickImage("back")} style={styles.uploadBtn}>
                <Ionicons name="image-outline" size={32} color={ACCENT} />
                <Text style={styles.uploadText}>Upload Back</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={handleUpload}
            disabled={!licenseFront || !licenseBack || isUploading}
            style={({ pressed }) => [
              styles.submitBtn,
              (!licenseFront || !licenseBack || isUploading) && styles.submitBtnDisabled,
              pressed && styles.submitBtnPressed,
            ]}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#0f172a" />
            ) : (
              <Text style={styles.submitText}>Submit Licenses</Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    color: "#f9fafb",
    fontSize: 22,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 24,
  },
  uploadArea: {
    marginBottom: 20,
  },
  label: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  uploadBtn: {
    backgroundColor: "rgba(254,154,0,0.08)",
    borderWidth: 2,
    borderColor: "rgba(254,154,0,0.4)",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  uploadText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  preview: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 16,
  },
  changeBtn: {
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
  submitBtn: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: "rgba(254,154,0,0.3)",
  },
  submitBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  submitText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
});

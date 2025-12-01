// components/ReservationForm.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

type ReservationFormProps = {
  isModal?: boolean;
  onClose?: () => void;
};

const ACCENT = "#fe9a00";
const DARK = "#0f172a";

export default function ReservationForm({
  isModal,
  onClose,
}: ReservationFormProps) {
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [location, setLocation] = useState("");
  const [passengers, setPassengers] = useState("");

  // Focus states for input animations
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSubmit = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      "✅ Reservation Submitted",
      "Your reservation has been successfully submitted!",
      [
        {
          text: "OK",
          onPress: () => {
            if (isModal && onClose) onClose();
          },
        },
      ]
    );
  };

  const handleFocus = (inputName: string) => {
    Haptics.selectionAsync();
    setFocusedInput(inputName);
  };

  const handleBlur = () => {
    setFocusedInput(null);
  };

  const renderInput = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof Ionicons.glyphMap,
    inputName: string,
    keyboardType: "default" | "numeric" = "default"
  ) => {
    const isFocused = focusedInput === inputName;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View
          style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={isFocused ? ACCENT : "rgba(255,255,255,0.4)"}
            style={styles.inputIcon}
          />
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={value}
            onChangeText={onChangeText}
            onFocus={() => handleFocus(inputName)}
            onBlur={handleBlur}
            style={styles.input}
            keyboardType={keyboardType}
          />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrapper}>
            <Ionicons name="calendar" size={20} color={ACCENT} />
          </View>
          <Text style={styles.sectionTitle}>Booking Details</Text>
        </View>

        {/* Pickup Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pickup Information</Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              {renderInput(
                "Date",
                "DD/MM/YYYY",
                pickupDate,
                setPickupDate,
                "calendar-outline",
                "pickupDate"
              )}
            </View>
            <View style={styles.halfField}>
              {renderInput(
                "Time",
                "HH:MM",
                pickupTime,
                setPickupTime,
                "time-outline",
                "pickupTime"
              )}
            </View>
          </View>
        </View>

        {/* Return Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Return Information</Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              {renderInput(
                "Date",
                "DD/MM/YYYY",
                returnDate,
                setReturnDate,
                "calendar-outline",
                "returnDate"
              )}
            </View>
            <View style={styles.halfField}>
              {renderInput(
                "Time",
                "HH:MM",
                returnTime,
                setReturnTime,
                "time-outline",
                "returnTime"
              )}
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Location & Details</Text>
          {renderInput(
            "Pickup Location",
            "e.g. NW London",
            location,
            setLocation,
            "location-outline",
            "location"
          )}
        </View>

        {/* Passengers */}
        <View style={styles.section}>
          {renderInput(
            "Number of Passengers",
            "e.g. 3",
            passengers,
            setPassengers,
            "people-outline",
            "passengers",
            "numeric"
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={ACCENT} />
          <Text style={styles.infoText}>
            All fields are required. We'll confirm your booking within 24 hours.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={handleSubmit}
            onPressIn={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            }
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
            ]}
          >
            <LinearGradient
              colors={[ACCENT, "#ff8c00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <Ionicons name="checkmark-circle" size={20} color={DARK} />
              <Text style={styles.submitText}>Complete Reservation</Text>
              <Ionicons name="arrow-forward" size={18} color={DARK} />
            </LinearGradient>
          </Pressable>

          {isModal && onClose && (
            <Pressable
              onPress={onClose}
              onPressIn={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 24,
    paddingBottom: 40,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  sectionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(254,154,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Row Layout
  row: {
    flexDirection: "row",
    gap: 16,
  },
  halfField: {
    flex: 1,
  },

  // Input Group
  inputGroup: {
    gap: 10,
  },
  label: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
   },
  inputWrapperFocused: {
    backgroundColor: "rgba(254,154,0,0.08)",
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginLeft: 2,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingVertical: 14,
    fontWeight: "500",
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(254,154,0,0.08)",
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    padding: 16,
    borderRadius: 12,
    marginBottom: 28,
  },
  infoText: {
    flex: 1,
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    lineHeight: 20,
  },

  // Buttons
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  submitText: {
    color: DARK,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  cancelButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: [{ scale: 0.98 }],
  },
  cancelText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "600",
  },
});

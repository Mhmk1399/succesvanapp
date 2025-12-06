import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Alert,
  PanResponder,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Image } from "react-native";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Van } from "./vanlist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reservationService } from "@/services/reservationService";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";

const { height } = Dimensions.get("window");
const ACCENT = "#fe9a00";
const DARK = "#0f172a";

type BookingModalProps = {
  visible: boolean;
  van: Van | null;
  onClose: () => void;
};

type PickerField =
  | "pickupDate"
  | "pickupTime"
  | "returnDate"
  | "returnTime"
  | null;

export default function BookingModal({
  visible,
  van,
  onClose,
}: BookingModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (visible && !user && van && !hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      AsyncStorage.setItem("pendingBookingVan", JSON.stringify(van));
      setTimeout(() => {
        handleClose();
        Alert.alert(
          "Login Required",
          "Please login or register to book a van.",
          [
            {
              text: "Register",
              onPress: () => router.push("/register" as any),
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      }, 100);
    }
    if (!visible) {
      hasCheckedAuth.current = false;
    }
  }, [visible, user, van]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 50,
            friction: 9,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setLastName(user.lastName || "");
      setEmail(user.emaildata?.emailAddress || "");
      setPhone(user.phoneData?.phoneNumber || "");
    }
  }, [user]);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [returnTime, setReturnTime] = useState<Date | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [pickerField, setPickerField] = useState<PickerField>(null);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Setup audio mode
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(height);
      opacity.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "DD/MM/YYYY";
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear().toString();
    return `${d}/${m}/${y}`;
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "HH:MM";
    const h = date.getHours().toString().padStart(2, "0");
    const min = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${min}`;
  };

  const openPicker = (field: PickerField, mode: "date" | "time") => {
    Haptics.selectionAsync();
    setPickerField(field);
    setPickerMode(mode);
  };

  const handleConfirm = (date: Date) => {
    switch (pickerField) {
      case "pickupDate":
        setPickupDate(date);
        break;
      case "pickupTime":
        setPickupTime(date);
        break;
      case "returnDate":
        setReturnDate(date);
        break;
      case "returnTime":
        setReturnTime(date);
        break;
    }
    setPickerField(null);
  };

  const handleSubmit = async () => {
    console.log("=== BOOKING SUBMIT START ===");
    console.log("User:", user);
    
    if (!user) {
      Alert.alert("Login Required", "Please login to book a van.");
      return;
    }

    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Please enter your name";
    }
    if (!email.trim()) {
      newErrors.email = "Please enter your email";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email";
    }
    if (!pickupDate || !pickupTime) {
      newErrors.pickup = "Please select pickup date and time";
    }
    if (!returnDate || !returnTime) {
      newErrors.return = "Please select return date and time";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const userData = { userId: user._id };

      const startDateTime = new Date(pickupDate!);
      const [pickupHour, pickupMin] = formatTime(pickupTime).split(':');
      startDateTime.setHours(parseInt(pickupHour), parseInt(pickupMin));

      const endDateTime = new Date(returnDate!);
      const [returnHour, returnMin] = formatTime(returnTime).split(':');
      endDateTime.setHours(parseInt(returnHour), parseInt(returnMin));

      const reservationData = {
        category: van?.id,
        office: "6926e38162f2c0d857bffff9",
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        dirverAge: 25,
        totalPrice: 0,
      };

      console.log("userData:", userData);
      console.log("reservationData:", reservationData);
      console.log("Calling reservationService.create...");
      
      const result = await reservationService.create(userData, reservationData);
      
      console.log("API Response:", result);

      if (result.success) {
        await playSuccessSound();
        await scheduleNotification();

        Alert.alert(
          "✅ Booking Confirmed",
          `Your ${van?.name} has been booked successfully!`,
          [{ text: "OK", onPress: handleClose }]
        );
      } else {
        console.error("Booking failed:", result.error);
        Alert.alert("Error", result.error || "Booking failed");
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      Alert.alert("Error", error.message || "Network error");
    } finally {
      setIsSubmitting(false);
      console.log("=== BOOKING SUBMIT END ===");
    }
  };

  const playSuccessSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/sounds/Iphone.mp3"),
        { shouldPlay: true, volume: 0.7 },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        }
      );
      await sound.playAsync();
    } catch (error) {
      console.log("Sound error:", error);
    }
  };

  const scheduleNotification = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Booking Confirmed!",
        body: `Your ${van?.name} is reserved. We'll contact you soon.`,
        sound: true,
        data: { vanId: van?.id, vanName: van?.name },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  };

  if (!van) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} />
      </Pressable>

      <Animated.View
        style={[styles.modalContainer, { transform: [{ translateY }] }]}
      >
        <BlurView intensity={50} tint="dark" style={styles.blurContainer}>
          <View {...panResponder.panHandlers} style={styles.handleArea}>
            <View style={styles.handle} />
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Booking Details</Text>
                {/* <Pressable onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#fff" />
                </Pressable> */}
              </View>
              {/* Van Image Card */}
              <View style={styles.vanImageCard}>
                <Image
                  source={
                    typeof van.image === "string"
                      ? { uri: van.image }
                      : van.image
                  }
                  style={styles.vanImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["transparent", "rgba(2,6,23,0.8)"]}
                  style={styles.vanImageGradient}
                />
                <View style={styles.vanImageOverlay}>
                  <View>
                    <Text style={styles.vanImageTitle}>{van.name}</Text>
                    <View style={styles.vanImageSpecs}>
                      <View style={styles.vanImageSpec}>
                        <Ionicons name="people" size={14} color={ACCENT} />
                        <Text style={styles.vanImageSpecText}>
                          {van.seats} seats
                        </Text>
                      </View>
                      <View style={styles.vanImageSpec}>
                        <Ionicons name="settings" size={14} color={ACCENT} />
                        <Text style={styles.vanImageSpecText}>{van.gear}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.vanImagePrice}>
                    <Text style={styles.vanImagePriceValue}>
                      £{van.pricePerHour}
                    </Text>
                    <Text style={styles.vanImagePriceUnit}>/hour</Text>
                  </View>
                </View>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedInput === "name" && styles.inputFocused,
                      user && styles.inputDisabled,
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={focusedInput === "name" ? ACCENT : "#9ca3af"}
                    />
                    <TextInput
                      placeholder="Enter your name"
                      placeholderTextColor="#6b7280"
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      onFocus={() => {
                        Haptics.selectionAsync();
                        setFocusedInput("name");
                      }}
                      onBlur={() => setFocusedInput(null)}
                      style={styles.input}
                      editable={!user}
                    />
                  </View>
                  {errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedInput === "email" && styles.inputFocused,
                      user && styles.inputDisabled,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={focusedInput === "email" ? ACCENT : "#9ca3af"}
                    />
                    <TextInput
                      placeholder="your@email.com"
                      placeholderTextColor="#6b7280"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) setErrors({ ...errors, email: "" });
                      }}
                      onFocus={() => {
                        Haptics.selectionAsync();
                        setFocusedInput("email");
                      }}
                      onBlur={() => setFocusedInput(null)}
                      style={styles.input}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!user}
                    />
                  </View>
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                {/* Pickup */}
                <Text style={styles.sectionLabel}>Pickup</Text>
                {errors.pickup && (
                  <Text style={styles.errorText}>{errors.pickup}</Text>
                )}
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>Date</Text>
                    <Pressable
                      onPress={() => openPicker("pickupDate", "date")}
                      style={[
                        styles.inputWrapper,
                        pickerField === "pickupDate" && styles.inputFocused,
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={pickupDate ? ACCENT : "#9ca3af"}
                      />
                      <Text
                        style={[
                          styles.input,
                          !pickupDate && { color: "#6b7280" },
                        ]}
                      >
                        {formatDate(pickupDate)}
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>Time</Text>
                    <Pressable
                      onPress={() => openPicker("pickupTime", "time")}
                      style={[
                        styles.inputWrapper,
                        pickerField === "pickupTime" && styles.inputFocused,
                      ]}
                    >
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={pickupTime ? ACCENT : "#9ca3af"}
                      />
                      <Text
                        style={[
                          styles.input,
                          !pickupTime && { color: "#6b7280" },
                        ]}
                      >
                        {formatTime(pickupTime)}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Return */}
                <Text style={styles.sectionLabel}>Return</Text>
                {errors.return && (
                  <Text style={styles.errorText}>{errors.return}</Text>
                )}
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>Date</Text>
                    <Pressable
                      onPress={() => openPicker("returnDate", "date")}
                      style={[
                        styles.inputWrapper,
                        pickerField === "returnDate" && styles.inputFocused,
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={returnDate ? ACCENT : "#9ca3af"}
                      />
                      <Text
                        style={[
                          styles.input,
                          !returnDate && { color: "#6b7280" },
                        ]}
                      >
                        {formatDate(returnDate)}
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>Time</Text>
                    <Pressable
                      onPress={() => openPicker("returnTime", "time")}
                      style={[
                        styles.inputWrapper,
                        pickerField === "returnTime" && styles.inputFocused,
                      ]}
                    >
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={returnTime ? ACCENT : "#9ca3af"}
                      />
                      <Text
                        style={[
                          styles.input,
                          !returnTime && { color: "#6b7280" },
                        ]}
                      >
                        {formatTime(returnTime)}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Submit */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    pressed && styles.submitBtnPressed,
                    isSubmitting && styles.submitBtnDisabled,
                  ]}
                >
                  <LinearGradient
                    colors={[ACCENT, "#ff8c00"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={DARK} size="small" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>Confirm Booking</Text>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={DARK}
                        />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </BlurView>
      </Animated.View>

      <DateTimePickerModal
        isVisible={pickerField !== null}
        mode={pickerMode}
        onConfirm={handleConfirm}
        onCancel={() => setPickerField(null)}
        is24Hour={true}
        display="spinner"
        themeVariant={colorScheme === "dark" ? "dark" : "light"}
        accentColor={ACCENT}
        textColor={colorScheme === "dark" ? "#fff" : DARK}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    borderColor: "rgba(254,154,0,0.2)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  blurContainer: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.6)",
    paddingTop: 12,
  },
  handleArea: {
    paddingVertical: 12,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(148,163,184,0.7)",
    borderRadius: 999,
    marginBottom: 12,
  },
  vanImageCard: {
    height: 180,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  vanImage: {
    width: "100%",
    height: "100%",
  },
  vanImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  vanImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: "space-between",
  },
  vanImageTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
  },
  vanImageSpecs: {
    flexDirection: "row",
    gap: 12,
  },
  vanImageSpec: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15,23,42,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  vanImageSpecText: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "600",
  },
  vanImagePrice: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  vanImagePriceValue: {
    fontSize: 28,
    fontWeight: "900",
    color: ACCENT,
  },
  vanImagePriceUnit: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#f9fafb",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    }),
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  inputFocused: {
    backgroundColor: "rgba(254,154,0,0.08)",
    borderColor: ACCENT,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  input: {
    flex: 1,
    color: "#f9fafb",
    fontSize: 14,
    paddingVertical: 8,
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  half: {
    flex: 1,
  },
  submitBtn: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  submitText: {
    fontSize: 15,
    fontWeight: "800",
    color: DARK,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
});

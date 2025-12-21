import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { authService } from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";

const ACCENT = "#fe9a00";
const DARK = "#0f172a";

type Step = "phone" | "code" | "register";

export default function AuthScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const codeInputRef = React.useRef<TextInput>(null);

  const handleSendCode = async () => {
    if (!phone.trim()) {
      setErrors({ phone: "Phone required" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
    try {
      const fullPhone = `+44${phone}`;
      const result = await authService.sendCode(fullPhone);
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep("code");
        setTimeout(() => codeInputRef.current?.focus(), 100);
        Alert.alert(
          "Code Sent",
          `Verification code sent to ${fullPhone}`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", result.message || "Failed to send code");
      }
    } catch (error) {
      console.error("Send code error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Network error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setErrors({ code: "Code required" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    try {
      const fullPhone = `+44${phone}`;
      const result = await authService.verifyCode(fullPhone, code);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (result.data.userExists) {
          await refreshUser();
          const pendingVan = await AsyncStorage.getItem("pendingBookingVan");
          const pendingForm = await AsyncStorage.getItem(
            "pendingReservationForm"
          );
          if (pendingVan) {
            await AsyncStorage.removeItem("pendingBookingVan");
            Alert.alert("✅ Success", "Logged in! Redirecting to booking...", [
              { text: "OK", onPress: () => router.push("/vans") },
            ]);
          } else if (pendingForm) {
            Alert.alert(
              "✅ Success",
              "Logged in! Continuing your reservation...",
              [{ text: "OK", onPress: () => router.push("/") }]
            );
          } else {
            Alert.alert("✅ Success", "Logged in!", [
              { text: "OK", onPress: () => router.push("/dashboard") },
            ]);
          }
        } else {
          setStep("register");
        }
      } else {
        Alert.alert("Error", result.message || "Invalid code");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Network error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "First name required";
    if (!lastName.trim()) newErrors.lastName = "Last name required";
    if (!email.trim()) newErrors.email = "Email required";
    else if (!email.includes("@")) newErrors.email = "Invalid email";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    try {
      const fullPhone = `+44${phone}`;
      const result = await authService.register(fullPhone, name, lastName, email);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refreshUser();
        const pendingVan = await AsyncStorage.getItem("pendingBookingVan");
        const pendingForm = await AsyncStorage.getItem(
          "pendingReservationForm"
        );
        if (pendingVan) {
          await AsyncStorage.removeItem("pendingBookingVan");
          Alert.alert(
            "✅ Success",
            "Account created! Redirecting to booking...",
            [{ text: "OK", onPress: () => router.push("/vans") }]
          );
        } else if (pendingForm) {
          Alert.alert(
            "✅ Success",
            "Account created! Continuing your reservation...",
            [{ text: "OK", onPress: () => router.push("/") }]
          );
        } else {
          Alert.alert("✅ Success", "Account created!", [
            { text: "OK", onPress: () => router.push("/dashboard") },
          ]);
        }
      } else {
        Alert.alert("Error", result.message || "Registration failed");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Network error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Success Van</Text>
          <Text style={styles.tagline}>Premium Van Rental</Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#f9fafb" />
        </Pressable>

        <BlurView intensity={40} tint="dark" style={styles.formCard}>
          <View style={styles.formContent}>
            {step === "phone" && (
              <>
                <Text style={styles.stepTitle}>Enter Phone Number</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedInput === "phone" && styles.inputFocused,
                      errors.phone && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={focusedInput === "phone" ? ACCENT : "#9ca3af"}
                    />
                    <Text style={styles.prefix}>+44</Text>
                    <TextInput
                      placeholder="7700 900000"
                      placeholderTextColor="#6b7280"
                      value={phone}
                      onChangeText={(text) => {
                        setPhone(text);
                        if (errors.phone) setErrors({ ...errors, phone: "" });
                      }}
                      onFocus={() => {
                        Haptics.selectionAsync();
                        setFocusedInput("phone");
                      }}
                      onBlur={() => setFocusedInput(null)}
                      style={styles.input}
                      keyboardType="phone-pad"
                    />
                  </View>
                  {errors.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}
                </View>
                <Pressable
                  onPress={handleSendCode}
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
                        <Text style={styles.submitText}>Send Code</Text>
                        <Ionicons name="arrow-forward" size={20} color={DARK} />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </>
            )}

            {step === "code" && (
              <>
                <Text style={styles.stepTitle}>Enter Verification Code</Text>
                <Text style={styles.stepDesc}>Code sent to +44{phone}</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Code</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedInput === "code" && styles.inputFocused,
                      errors.code && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="key-outline"
                      size={18}
                      color={focusedInput === "code" ? ACCENT : "#9ca3af"}
                    />
                    <TextInput
                      ref={codeInputRef}
                      autoFocus
                      placeholder="xxxxxx"
                      placeholderTextColor="#9a9a9bff"
                      value={code}
                      onChangeText={(text) => {
                        setCode(text);
                        if (errors.code) setErrors({ ...errors, code: "" });
                      }}
                      onFocus={() => {
                        Haptics.selectionAsync();
                        setFocusedInput("code");
                      }}
                      onBlur={() => setFocusedInput(null)}
                      style={styles.input}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                  {errors.code && (
                    <Text style={styles.errorText}>{errors.code}</Text>
                  )}
                </View>
                <Pressable
                  onPress={handleVerifyCode}
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
                        <Text style={styles.submitText}>Verify</Text>
                        <Ionicons name="arrow-forward" size={20} color={DARK} />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStep("phone");
                    setCode("");
                    setErrors({});
                  }}
                  style={styles.changePhoneBtn}
                >
                  <Text style={styles.changePhoneText}>Change Phone Number</Text>
                </Pressable>
              </>
            )}

            {step === "register" && (
              <>
                <Text style={styles.stepTitle}>Complete Registration</Text>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>First Name</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        focusedInput === "name" && styles.inputFocused,
                        errors.name && styles.inputError,
                      ]}
                    >
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color={focusedInput === "name" ? ACCENT : "#9ca3af"}
                      />
                      <TextInput
                        placeholder="John"
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
                      />
                    </View>
                    {errors.name && (
                      <Text style={styles.errorText}>{errors.name}</Text>
                    )}
                  </View>

                  <View style={styles.half}>
                    <Text style={styles.label}>Last Name</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        focusedInput === "lastName" && styles.inputFocused,
                        errors.lastName && styles.inputError,
                      ]}
                    >
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color={focusedInput === "lastName" ? ACCENT : "#9ca3af"}
                      />
                      <TextInput
                        placeholder="Doe"
                        placeholderTextColor="#6b7280"
                        value={lastName}
                        onChangeText={(text) => {
                          setLastName(text);
                          if (errors.lastName)
                            setErrors({ ...errors, lastName: "" });
                        }}
                        onFocus={() => {
                          Haptics.selectionAsync();
                          setFocusedInput("lastName");
                        }}
                        onBlur={() => setFocusedInput(null)}
                        style={styles.input}
                      />
                    </View>
                    {errors.lastName && (
                      <Text style={styles.errorText}>{errors.lastName}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedInput === "email" && styles.inputFocused,
                      errors.email && styles.inputError,
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
                    />
                  </View>
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                <Pressable
                  onPress={handleRegister}
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
                        <Text style={styles.submitText}>Create Account</Text>
                        <Ionicons name="arrow-forward" size={20} color={DARK} />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </View>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, marginTop: 46 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 32, fontWeight: "900", color: "#fff", marginBottom: 4 },
  tagline: { fontSize: 14, color: "#ece6e6ff", fontWeight: "600" },
  backButton: {
    position: "absolute",
    left: 10,
    top: -3,
    zIndex: 999,
    padding: 8,
  },
  formCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.2)",
  },
  formContent: { padding: 24, backgroundColor: "rgba(15,23,42,0.4)" },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  stepDesc: { fontSize: 14, color: "#9ca3af", marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  row: { flexDirection: "row", gap: 12, marginBottom: 20 },
  half: { flex: 1 },
  label: { fontSize: 14, fontWeight: "600", color: "#e5e7eb", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 52,
  },
  inputFocused: {
    backgroundColor: "rgba(254,154,0,0.08)",
    borderColor: ACCENT,
  },
  inputError: { borderColor: "#ef4444" },
  input: {
    flex: 1,
    color: "#f9fafb",
    fontSize: 16,
    paddingVertical: 16,
    fontWeight: "500",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
  },
  submitBtn: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
  submitBtnPressed: { transform: [{ scale: 0.98 }] },
  submitBtnDisabled: { opacity: 0.6 },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
    minHeight: 56,
  },
  submitText: { fontSize: 16, fontWeight: "800", color: DARK },
  prefix: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "600",
  },
  changePhoneBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  changePhoneText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: "600",
  },
});

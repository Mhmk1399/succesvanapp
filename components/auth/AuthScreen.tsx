import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlassView from "@/components/global/GlassView";
import { useToast } from "@/components/global/AppToast";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const ACCENT = "#fe9a00";
const DARK = "#0f172a";
const PHONE_LENGTH = 10;
const CODE_LENGTH = 6;

type Step = "phone" | "code" | "register";

export default function AuthScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const codeInputRef = React.useRef<TextInput>(null);
  const shakeAnims = React.useRef<Record<string, Animated.Value>>({
    phone: new Animated.Value(0),
    code: new Animated.Value(0),
    name: new Animated.Value(0),
    lastName: new Animated.Value(0),
    email: new Animated.Value(0),
    city: new Animated.Value(0),
  }).current;

  const onlyDigits = (value: string, maxLength: number) =>
    value.replace(/\D/g, "").slice(0, maxLength);

  const shakeField = (field: keyof typeof shakeAnims) => {
    const anim = shakeAnims[field];
    anim.stopAnimation();
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: -1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showFieldError = (
    field: keyof typeof shakeAnims,
    message: string,
    extraErrors: Record<string, string> = {},
    shouldToast = true,
  ) => {
    setErrors({ ...extraErrors, [field]: message });
    if (shouldToast) {
      showToast({ type: "error", title: "Check this field", message });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shakeField(field);
  };

  const inputShakeStyle = (field: keyof typeof shakeAnims) => ({
    transform: [
      {
        translateX: shakeAnims[field].interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-9, 0, 9],
        }),
      },
    ],
  });

  const finishAuthFlow = async () => {
    await refreshUser();
    const pendingVan = await AsyncStorage.getItem("pendingBookingVan");
    const pendingForm = await AsyncStorage.getItem("pendingReservationForm");

    if (pendingVan) {
      router.replace("/vans");
      return;
    }

    if (pendingForm) {
      router.replace("/");
      return;
    }

    router.replace("/dashboard");
  };

  const handleSendCode = async () => {
    if (phone.length !== PHONE_LENGTH) {
      showFieldError(
        "phone",
        `Enter exactly ${PHONE_LENGTH} digits after +44.`
      );
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
      } else {
        showFieldError("phone", result.message || "Failed to send code.", {}, false);
      }
    } catch (error) {
      console.log("Send code error:", error);
      showFieldError(
        "phone",
        error instanceof Error ? error.message : "Network error",
        {},
        false,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== CODE_LENGTH) {
      showFieldError("code", `Enter the ${CODE_LENGTH}-digit SMS code.`);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const fullPhone = `+44${phone}`;
      const result = await authService.verifyCode(fullPhone, code);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (result.data.userExists) {
          await finishAuthFlow();
        } else {
          setStep("register");
        }
      } else {
        showFieldError("code", result.message || "Invalid SMS code.", {}, false);
      }
    } catch (error) {
      showFieldError(
        "code",
        error instanceof Error ? error.message : "Network error",
        {},
        false,
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
    if (!city.trim()) newErrors.city = "City required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast({
        type: "error",
        title: "Almost there",
        message: newErrors[Object.keys(newErrors)[0]],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const firstField = Object.keys(newErrors)[0] as keyof typeof shakeAnims;
      if (shakeAnims[firstField]) shakeField(firstField);
      return;
    }

    setIsSubmitting(true);
    try {
      const fullPhone = `+44${phone}`;
      const result = await authService.register(
        fullPhone,
        name,
        lastName,
        email,
        address,
        postalCode,
        city
      );
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await finishAuthFlow();
      } else {
        setErrors({ form: result.message || "Registration failed." });
        showToast({
          type: "error",
          title: "Registration failed",
          message: result.message || "Please check your details and try again.",
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Network error",
      });
      showToast({
        type: "error",
        title: "Registration failed",
        message: error instanceof Error ? error.message : "Network error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

        <GlassView intensity={40} tint="dark" style={styles.formCard}>
          <View style={styles.formContent}>
            {step === "phone" && (
              <>
                <Text style={styles.stepTitle}>Enter Phone Number</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone number</Text>
                  <Animated.View
                    style={inputShakeStyle("phone")}
                  >
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
                      placeholder="7700900000"
                      placeholderTextColor="#6b7280"
                      value={phone}
                      onChangeText={(text) => {
                        setPhone(onlyDigits(text, PHONE_LENGTH));
                        if (errors.phone) setErrors({ ...errors, phone: "" });
                      }}
                      onFocus={() => {
                        Haptics.selectionAsync();
                        setFocusedInput("phone");
                      }}
                      onBlur={() => setFocusedInput(null)}
                      style={styles.input}
                      keyboardType="number-pad"
                      textContentType="telephoneNumber"
                      maxLength={PHONE_LENGTH}
                    />
                  </View>
                  </Animated.View>
                  {errors.phone && (
                    <InlineError message={errors.phone} />
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
                  <Text style={styles.label}>SMS code</Text>
                  <Animated.View
                    style={inputShakeStyle("code")}
                  >
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
                      placeholder="000000"
                      placeholderTextColor="#9a9a9bff"
                      value={code}
                      onChangeText={(text) => {
                        setCode(onlyDigits(text, CODE_LENGTH));
                        if (errors.code) setErrors({ ...errors, code: "" });
                      }}
                      onFocus={() => {
                        Haptics.selectionAsync();
                        setFocusedInput("code");
                      }}
                      onBlur={() => setFocusedInput(null)}
                      style={styles.input}
                      keyboardType="number-pad"
                      textContentType="oneTimeCode"
                      maxLength={CODE_LENGTH}
                    />
                  </View>
                  </Animated.View>
                  {errors.code && (
                    <InlineError message={errors.code} />
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
                  <Text style={styles.changePhoneText}>
                    Change Phone Number
                  </Text>
                </Pressable>
              </>
            )}

            {step === "register" && (
              <>
                <Text style={styles.stepTitle}>Complete Registration</Text>
                {errors.form && <FormError message={errors.form} />}

                {/* Name Row */}
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>First Name</Text>
                    <Animated.View style={inputShakeStyle("name")}>
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
                    </Animated.View>
                    {errors.name && (
                      <InlineError message={errors.name} />
                    )}
                  </View>

                  <View style={styles.half}>
                    <Text style={styles.label}>Last Name</Text>
                    <Animated.View style={inputShakeStyle("lastName")}>
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
                    </Animated.View>
                    {errors.lastName && (
                      <InlineError message={errors.lastName} />
                    )}
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <Animated.View style={inputShakeStyle("email")}>
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
                  </Animated.View>
                  {errors.email && (
                    <InlineError message={errors.email} />
                  )}
                </View>

                {/* Address Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Address Information</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Address</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        focusedInput === "address" && styles.inputFocused,
                        errors.address && styles.inputError,
                      ]}
                    >
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color={focusedInput === "address" ? ACCENT : "#9ca3af"}
                      />
                      <TextInput
                        placeholder="London"
                        placeholderTextColor="#6b7280"
                        value={address}
                        onChangeText={(text) => {
                          setAddress(text);
                          if (errors.address)
                            setErrors({ ...errors, address: "" });
                        }}
                        onFocus={() => {
                          Haptics.selectionAsync();
                          setFocusedInput("address");
                        }}
                        onBlur={() => setFocusedInput(null)}
                        style={styles.input}
                      />
                    </View>
                    {errors.address && (
                      <Text style={styles.errorText}>{errors.address}</Text>
                    )}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>City</Text>
                    <Animated.View style={inputShakeStyle("city")}>
                    <View
                      style={[
                        styles.inputWrapper,
                        focusedInput === "city" && styles.inputFocused,
                        errors.city && styles.inputError,
                      ]}
                    >
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color={focusedInput === "city" ? ACCENT : "#9ca3af"}
                      />
                      <TextInput
                        placeholder="London"
                        placeholderTextColor="#6b7280"
                        value={city}
                        onChangeText={(text) => {
                          setCity(text);
                          if (errors.city) setErrors({ ...errors, city: "" });
                        }}
                        onFocus={() => {
                          Haptics.selectionAsync();
                          setFocusedInput("city");
                        }}
                        onBlur={() => setFocusedInput(null)}
                        style={styles.input}
                      />
                    </View>
                    </Animated.View>
                    {errors.city && (
                      <InlineError message={errors.city} />
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Postal Code</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        focusedInput === "postalCode" && styles.inputFocused,
                        errors.postalCode && styles.inputError,
                      ]}
                    >
                      <Ionicons
                        name="map-outline"
                        size={18}
                        color={
                          focusedInput === "postalCode" ? ACCENT : "#9ca3af"
                        }
                      />
                      <TextInput
                        placeholder="SW1A 1AA"
                        placeholderTextColor="#6b7280"
                        value={postalCode}
                        onChangeText={(text) => {
                          setPostalCode(text);
                          if (errors.postalCode)
                            setErrors({ ...errors, postalCode: "" });
                        }}
                        onFocus={() => {
                          Haptics.selectionAsync();
                          setFocusedInput("postalCode");
                        }}
                        onBlur={() => setFocusedInput(null)}
                        style={styles.input}
                        keyboardType="default"
                      />
                    </View>
                    {errors.postalCode && (
                      <Text style={styles.errorText}>{errors.postalCode}</Text>
                    )}
                  </View>
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
        </GlassView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <View style={styles.inlineError}>
      <Ionicons name="alert-circle" size={14} color="#fecaca" />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <View style={styles.formError}>
      <Ionicons name="warning" size={18} color="#fecaca" />
      <Text style={styles.formErrorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 46,
    paddingBottom: 42,
  },
  header: { alignItems: "center", marginBottom: 34 },
  logo: { fontSize: 34, fontWeight: "900", color: "#fff", marginBottom: 4 },
  tagline: { fontSize: 14, color: "rgba(255,255,255,0.78)", fontWeight: "700" },
  backButton: {
    position: "absolute",
    left: 10,
    top: -3,
    zIndex: 999,
    padding: 8,
  },
  formCard: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  formContent: { padding: 24, backgroundColor: "rgba(8,12,22,0.54)" },
  stepTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
  },
  stepDesc: { fontSize: 14, color: "rgba(229,231,235,0.72)", marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  row: { flexDirection: "row", gap: 12, marginBottom: 20 },
  half: { flex: 1 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e5e7eb",
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#e5e7eb", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 58,
  },
  inputFocused: {
    backgroundColor: "rgba(254,154,0,0.1)",
    borderColor: ACCENT,
  },
  inputError: {
    borderColor: "#fb7185",
    backgroundColor: "rgba(127,29,29,0.22)",
  },
  input: {
    flex: 1,
    color: "#f9fafb",
    fontSize: 16,
    paddingVertical: 16,
    fontWeight: "500",
  },
  inlineError: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(127,29,29,0.32)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.32)",
  },
  errorText: {
    flex: 1,
    color: "#fecaca",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },
  formError: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(127,29,29,0.34)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.36)",
  },
  formErrorText: {
    flex: 1,
    color: "#fee2e2",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
  },
  submitBtn: { borderRadius: 18, overflow: "hidden", marginTop: 8 },
  submitBtnPressed: { transform: [{ scale: 0.98 }] },
  submitBtnDisabled: { opacity: 0.6 },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
    minHeight: 60,
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

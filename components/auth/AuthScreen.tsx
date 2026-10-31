import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlassView from "@/components/global/GlassView";
import HeaderBackButton from "@/components/global/HeaderBackButton";
import { useToast } from "@/components/global/AppToast";
import { PENDING_BOOKING_KEY } from "@/utils/pendingBooking";
import SecurityCheck from "./SecurityCheck";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
  const headerTop = Math.max(insets.top, 18) + 12;
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
  const [securityToken, setSecurityToken] = useState<string | null>(null);
  const [securityResetKey, setSecurityResetKey] = useState(0);
  const sendCodeInFlight = React.useRef(false);
  const handleSecurityToken = React.useCallback((token: string | null) => setSecurityToken(token), []);
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
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      showToast({ type: "error", title: "Sign in incomplete", message: "Please sign in again to continue your booking." });
      return;
    }
    await refreshUser();
    const pendingDraft = await AsyncStorage.getItem(PENDING_BOOKING_KEY);
    const pendingVan = await AsyncStorage.getItem("pendingBookingVan");
    const pendingForm = await AsyncStorage.getItem("pendingReservationForm");

    if (pendingDraft) {
      router.replace({ pathname: "/vans", params: { resumeBooking: "1" } });
      return;
    }

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
        `Enter exactly ${PHONE_LENGTH} digits after +44.`,
      );
      return;
    }

    if (!securityToken || sendCodeInFlight.current) return;
    sendCodeInFlight.current = true;

    setIsSubmitting(true);
    setErrors({});

    try {
      const fullPhone = `+44${phone}`;
      const result = await authService.sendCode(fullPhone, securityToken);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep("code");
        setTimeout(() => codeInputRef.current?.focus(), 100);
      } else {
        showFieldError(
          "phone",
          result.message || "Failed to send code.",
          {},
          false,
        );
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
      sendCodeInFlight.current = false;
      setSecurityToken(null);
      setSecurityResetKey((current) => current + 1);
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
        showFieldError(
          "code",
          result.message || "Invalid SMS code.",
          {},
          false,
        );
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
        city,
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

  const displayPhone = phone
    ? `+44 ${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`.trim()
    : "+44 7700 900000";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#04070d", "#07101d", "#081221"]}
        locations={[0, 0.46, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.backgroundGlowTop} />
      <View pointerEvents="none" style={styles.backgroundGlowBottom} />

      <HeaderBackButton
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        style={[styles.backButton, { top: headerTop }]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerTop + 48 }]}
      >
        <View style={styles.contentShell}>
          <View style={styles.brandHeader}>
            <View style={styles.brandCopy}>
              <View style={styles.brandTitleRow}>
                <Text style={styles.logo}>Success Van</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={10} color={DARK} />
                </View>
              </View>
              <Text style={styles.tagline}>Premium Van Rental</Text>
            </View>

            <View style={styles.headerVanStage} pointerEvents="none">
              <View style={styles.headerVanGlow} />
              <Image
                source={require("@/assets/images/van.png")}
                style={styles.headerVanImage}
                contentFit="contain"
                transition={180}
              />
            </View>
          </View>

          <GlassView intensity={48} tint="dark" style={styles.formCard}>
            <LinearGradient
              colors={["rgba(11,21,36,0.98)", "rgba(6,14,26,0.97)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.cardTopHighlight} />

            <View style={styles.formContent}>
              {step === "phone" && (
                <>
                  <Text style={styles.stepTitle}>Enter your phone number</Text>
                  <Text style={styles.stepDesc}>
                    We&apos;ll send a 6-digit code to verify your number.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone number</Text>
                    <Animated.View style={inputShakeStyle("phone")}>
                      <View
                        style={[
                          styles.phoneInputWrapper,
                          focusedInput === "phone" && styles.inputFocused,
                          errors.phone && styles.inputError,
                        ]}
                      >
                        <View style={styles.fixedPrefix} pointerEvents="none">
                          <Text style={styles.flagText}>🇬🇧</Text>
                          <Text style={styles.prefix}>+44</Text>
                          <View style={styles.prefixDivider} />
                        </View>

                        <TextInput
                          placeholder="7700 900000"
                          placeholderTextColor="rgba(211,220,233,0.34)"
                          value={phone}
                          onChangeText={(text) => {
                            setPhone(onlyDigits(text, PHONE_LENGTH));
                            if (errors.phone)
                              setErrors({ ...errors, phone: "" });
                          }}
                          onFocus={() => {
                            Haptics.selectionAsync();
                            setFocusedInput("phone");
                          }}
                          onBlur={() => setFocusedInput(null)}
                          style={styles.phoneInput}
                          keyboardType="number-pad"
                          textContentType="telephoneNumber"
                          maxLength={PHONE_LENGTH}
                        />
                      </View>
                    </Animated.View>
                    {errors.phone && <InlineError message={errors.phone} />}
                  </View>

                  <View style={styles.secureHint}>
                    <Ionicons name="lock-closed" size={11} color="#8390a3" />
                    <Text style={styles.secureHintText}>
                      Your number is safe with us.
                    </Text>
                  </View>

                  <SecurityCheck onTokenChange={handleSecurityToken} resetKey={securityResetKey} />

                  <PrimaryActionButton
                    label="Send Code"
                    loading={isSubmitting}
                    disabled={!securityToken}
                    onPress={handleSendCode}
                  />
                </>
              )}

              {step === "code" && (
                <>
                  <Text style={styles.stepTitle}>Enter verification code</Text>
                  <Text style={styles.stepDesc}>
                    We&apos;ve sent a 6-digit code to
                  </Text>
                  <Text style={styles.sentPhone}>{displayPhone}</Text>

                  <View style={[styles.inputGroup, styles.codeGroup]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Enter verification code"
                      onPress={() => codeInputRef.current?.focus()}
                    >
                      <Animated.View
                        style={[styles.otpRow, inputShakeStyle("code")]}
                      >
                        {Array.from({ length: CODE_LENGTH }).map((_, index) => {
                          const digit = code[index] || "";
                          const active =
                            focusedInput === "code" &&
                            (index === code.length ||
                              (code.length === CODE_LENGTH &&
                                index === CODE_LENGTH - 1));

                          return (
                            <View
                              key={index}
                              style={[
                                styles.otpCell,
                                digit && styles.otpCellFilled,
                                active && styles.otpCellActive,
                                errors.code && styles.otpCellError,
                              ]}
                            >
                              <Text style={styles.otpDigit}>{digit}</Text>
                            </View>
                          );
                        })}
                      </Animated.View>
                    </Pressable>

                    <TextInput
                      ref={codeInputRef}
                      autoFocus
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
                      keyboardType="number-pad"
                      textContentType="oneTimeCode"
                      maxLength={CODE_LENGTH}
                      style={styles.hiddenCodeInput}
                      caretHidden
                    />

                    {errors.code && <InlineError message={errors.code} />}
                  </View>

                  <View style={styles.expiryRow}>
                    <Text style={styles.expiryLabel}>Code expires in</Text>
                    <Text style={styles.expiryTime}>02:45</Text>
                  </View>

                  <PrimaryActionButton
                    label="Verify Code"
                    loading={isSubmitting}
                    onPress={handleVerifyCode}
                  />
                </>
              )}

              {step === "register" && (
                <>
                  <Text style={styles.stepTitle}>Complete registration</Text>
                  <Text style={styles.stepDesc}>
                    Add your details to finish creating your account.
                  </Text>
                  {errors.form && <FormError message={errors.form} />}

                  <View style={styles.row}>
                    <View style={styles.half}>
                      <Text style={styles.label}>First name</Text>
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
                            size={17}
                            color={focusedInput === "name" ? ACCENT : "#8490a2"}
                          />
                          <TextInput
                            placeholder="John"
                            placeholderTextColor="rgba(211,220,233,0.3)"
                            value={name}
                            onChangeText={(text) => {
                              setName(text);
                              if (errors.name)
                                setErrors({ ...errors, name: "" });
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
                      {errors.name && <InlineError message={errors.name} />}
                    </View>

                    <View style={styles.half}>
                      <Text style={styles.label}>Last name</Text>
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
                            size={17}
                            color={
                              focusedInput === "lastName" ? ACCENT : "#8490a2"
                            }
                          />
                          <TextInput
                            placeholder="Doe"
                            placeholderTextColor="rgba(211,220,233,0.3)"
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
                          size={17}
                          color={focusedInput === "email" ? ACCENT : "#8490a2"}
                        />
                        <TextInput
                          placeholder="your@email.com"
                          placeholderTextColor="rgba(211,220,233,0.3)"
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email)
                              setErrors({ ...errors, email: "" });
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
                    {errors.email && <InlineError message={errors.email} />}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Address information</Text>

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
                          size={17}
                          color={
                            focusedInput === "address" ? ACCENT : "#8490a2"
                          }
                        />
                        <TextInput
                          placeholder="Street address"
                          placeholderTextColor="rgba(211,220,233,0.3)"
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
                            name="business-outline"
                            size={17}
                            color={focusedInput === "city" ? ACCENT : "#8490a2"}
                          />
                          <TextInput
                            placeholder="London"
                            placeholderTextColor="rgba(211,220,233,0.3)"
                            value={city}
                            onChangeText={(text) => {
                              setCity(text);
                              if (errors.city)
                                setErrors({ ...errors, city: "" });
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
                      {errors.city && <InlineError message={errors.city} />}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Postal code</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          focusedInput === "postalCode" && styles.inputFocused,
                          errors.postalCode && styles.inputError,
                        ]}
                      >
                        <Ionicons
                          name="map-outline"
                          size={17}
                          color={
                            focusedInput === "postalCode" ? ACCENT : "#8490a2"
                          }
                        />
                        <TextInput
                          placeholder="SW1A 1AA"
                          placeholderTextColor="rgba(211,220,233,0.3)"
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
                        <Text style={styles.errorText}>
                          {errors.postalCode}
                        </Text>
                      )}
                    </View>
                  </View>

                  <PrimaryActionButton
                    label="Create Account"
                    loading={isSubmitting}
                    onPress={handleRegister}
                  />
                </>
              )}
            </View>
          </GlassView>

          {step === "phone" ? (
            <View style={styles.footerTrustRow}>
              <View style={styles.footerIconWrap}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={15}
                  color={ACCENT}
                />
              </View>
              <Text style={styles.footerTrustText}>
                We never share your number{"\n"}with third parties.
              </Text>
            </View>
          ) : step === "code" ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep("phone");
                setCode("");
                setErrors({});
              }}
              style={({ pressed }) => [
                styles.changePhoneBtn,
                pressed && styles.changePhonePressed,
              ]}
            >
              <Text style={styles.changePhoneMuted}>
                Didn&apos;t receive the code?
              </Text>
              <Text style={styles.changePhoneText}>Change number</Text>
            </Pressable>
          ) : (
            <View style={styles.footerTrustRow}>
              <View style={styles.footerIconWrap}>
                <Ionicons name="lock-closed-outline" size={15} color={ACCENT} />
              </View>
              <Text style={styles.footerTrustText}>
                Your personal information is encrypted and secure.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type PrimaryActionButtonProps = {
  label: string;
  loading: boolean;
  onPress: () => void;
  disabled?: boolean;
};

function PrimaryActionButton({
  label,
  loading,
  onPress,
  disabled = false,
}: PrimaryActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.submitBtn,
        pressed && styles.submitBtnPressed,
        (loading || disabled) && styles.submitBtnDisabled,
      ]}
    >
      <LinearGradient
        colors={["#ffae22", ACCENT, "#f38300"]}
        locations={[0, 0.54, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.submitGradient}
      >
        <View pointerEvents="none" style={styles.submitGloss} />
        {loading ? (
          <ActivityIndicator color={DARK} size="small" />
        ) : (
          <>
            <Text style={styles.submitText}>{label}</Text>
            <Ionicons name="arrow-forward" size={16} color={DARK} />
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <View style={styles.inlineError}>
      <Ionicons name="alert-circle" size={13} color="#fecaca" />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <View style={styles.formError}>
      <Ionicons name="warning" size={17} color="#fecaca" />
      <Text style={styles.formErrorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#04070d",
  },
  backgroundGlowTop: {
    position: "absolute",
    width: 270,
    height: 210,
    borderRadius: 150,
    top: -100,
    right: -85,
    backgroundColor: "rgba(254,154,0,0.075)",
  },
  backgroundGlowBottom: {
    position: "absolute",
    width: 320,
    height: 260,
    borderRadius: 180,
    bottom: -155,
    left: -155,
    backgroundColor: "rgba(28,78,145,0.085)",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 132,
  },
  contentShell: {
    width: "100%",
    maxWidth: 390,
  },
  backButton: {
    position: "absolute",
    left: 16,
    zIndex: 999,
  },
  brandHeader: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingLeft: 5,
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 8,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logo: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  verifiedBadge: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    borderWidth: 1,
    borderColor: "rgba(255,223,160,0.7)",
  },
  tagline: {
    marginTop: 4,
    color: "#ffb238",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  headerVanStage: {
    width: 148,
    height: 92,
    marginRight: -14,
    justifyContent: "center",
    alignItems: "center",
  },
  headerVanGlow: {
    position: "absolute",
    width: 115,
    height: 48,
    borderRadius: 60,
    bottom: 10,
    backgroundColor: "rgba(254,154,0,0.09)",
    transform: [{ scaleX: 1.35 }],
  },
  headerVanImage: {
    width: 148,
    height: 86,
  },
  formCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(114,146,184,0.22)",
    backgroundColor: "rgba(7,15,27,0.96)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTopHighlight: {
    position: "absolute",
    top: 0,
    left: 22,
    right: 22,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  formContent: {
    paddingHorizontal: 18,
    paddingTop: 21,
    paddingBottom: 20,
  },
  stepTitle: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    letterSpacing: -0.35,
    marginBottom: 7,
  },
  stepDesc: {
    color: "rgba(220,228,239,0.62)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "600",
    marginBottom: 17,
  },
  sentPhone: {
    color: "#ffffff",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
    marginTop: -12,
    marginBottom: 19,
  },
  inputGroup: {
    marginBottom: 12,
  },
  codeGroup: {
    marginBottom: 7,
  },
  label: {
    color: "rgba(231,236,244,0.83)",
    fontSize: 9.5,
    fontWeight: "800",
    marginBottom: 7,
  },
  phoneInputWrapper: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(111,141,178,0.18)",
  },
  fixedPrefix: {
    height: "100%",
    minWidth: 83,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  flagText: {
    fontSize: 14,
  },
  prefix: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "900",
  },
  prefixDivider: {
    position: "absolute",
    right: 0,
    top: 10,
    bottom: 10,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  phoneInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  inputWrapper: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(111,141,178,0.18)",
  },
  inputFocused: {
    borderColor: "rgba(254,154,0,0.88)",
    backgroundColor: "rgba(254,154,0,0.06)",
  },
  inputError: {
    borderColor: "#fb7185",
    backgroundColor: "rgba(127,29,29,0.18)",
  },
  input: {
    flex: 1,
    minHeight: 46,
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "600",
    paddingVertical: 11,
  },
  secureHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: -1,
    marginBottom: 14,
  },
  secureHintText: {
    color: "rgba(190,201,216,0.48)",
    fontSize: 8.5,
    fontWeight: "700",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  otpCell: {
    flex: 1,
    aspectRatio: 0.82,
    maxHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.028)",
    borderWidth: 1,
    borderColor: "rgba(114,146,184,0.17)",
  },
  otpCellFilled: {
    borderColor: "rgba(254,154,0,0.38)",
    backgroundColor: "rgba(254,154,0,0.055)",
  },
  otpCellActive: {
    borderColor: ACCENT,
    borderWidth: 1.5,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 3,
  },
  otpCellError: {
    borderColor: "#fb7185",
    backgroundColor: "rgba(127,29,29,0.16)",
  },
  otpDigit: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  hiddenCodeInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  expiryLabel: {
    color: "rgba(191,201,214,0.52)",
    fontSize: 8.5,
    fontWeight: "700",
  },
  expiryTime: {
    color: ACCENT,
    fontSize: 8.5,
    fontWeight: "900",
  },
  submitBtn: {
    borderRadius: 13,
    overflow: "hidden",
    marginTop: 2,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  submitGloss: {
    position: "absolute",
    top: 1,
    left: 12,
    right: 12,
    height: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  submitText: {
    color: DARK,
    fontSize: 11.5,
    fontWeight: "900",
  },
  footerTrustRow: {
    minHeight: 48,
    marginTop: 10,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
  },
  footerIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.14)",
  },
  footerTrustText: {
    color: "rgba(197,207,220,0.5)",
    fontSize: 8.2,
    lineHeight: 12,
    fontWeight: "700",
  },
  changePhoneBtn: {
    minHeight: 48,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  changePhonePressed: {
    opacity: 0.7,
  },
  changePhoneMuted: {
    color: "rgba(198,207,219,0.46)",
    fontSize: 8.5,
    fontWeight: "700",
  },
  changePhoneText: {
    color: ACCENT,
    fontSize: 8.5,
    fontWeight: "900",
  },
  row: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 12,
  },
  half: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    marginTop: 3,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  sectionTitle: {
    color: "rgba(235,239,246,0.76)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  inlineError: {
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(127,29,29,0.24)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.28)",
  },
  errorText: {
    flex: 1,
    color: "#fecaca",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "800",
  },
  formError: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(127,29,29,0.27)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.3)",
  },
  formErrorText: {
    flex: 1,
    color: "#fee2e2",
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: "800",
  },
});

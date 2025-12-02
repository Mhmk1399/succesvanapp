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
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const ACCENT = "#fe9a00";
const DARK = "#0f172a";

type AuthMode = "login" | "signup";

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenceFront, setLicenceFront] = useState<string | null>(null);
  const [licenceBack, setLicenceBack] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMode(mode === "login" ? "signup" : "login");
    setErrors({});
  };

  const pickImage = async (type: "front" | "back") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.8,
    });

    if (!result.canceled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (type === "front") {
        setLicenceFront(result.assets[0].uri);
      } else {
        setLicenceBack(result.assets[0].uri);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === "signup") {
      if (!name.trim()) newErrors.name = "First name required";
      if (!lastName.trim()) newErrors.lastName = "Last name required";
      if (!phone.trim()) newErrors.phone = "Phone required";
      else if (phone.length < 10) newErrors.phone = "Invalid phone";
    }

    if (!email.trim()) newErrors.email = "Email required";
    else if (!email.includes("@")) newErrors.email = "Invalid email";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(async () => {
      // Save mock token
      await AsyncStorage.setItem("authToken", "mock-token-" + Date.now());
      await AsyncStorage.setItem("userName", name || "User");
      
      setIsSubmitting(false);
      Alert.alert(
        "✅ Success",
        mode === "login" ? "Logged in!" : "Account created!",
        [
          {
            text: "OK",
            onPress: () => router.push("/dashboard" as any),
          },
        ]
      );
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#020617", "#0f172a", "#1e293b"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Success Van</Text>
          <Text style={styles.tagline}>Premium Van Rental</Text>
        </View>

        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => mode === "signup" && toggleMode()}
            style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}
          >
            <Text style={[styles.modeText, mode === "login" && styles.modeTextActive]}>
              Login
            </Text>
          </Pressable>
          <Pressable
            onPress={() => mode === "login" && toggleMode()}
            style={[styles.modeBtn, mode === "signup" && styles.modeBtnActive]}
          >
            <Text style={[styles.modeText, mode === "signup" && styles.modeTextActive]}>
              Sign Up
            </Text>
          </Pressable>
        </View>

        <BlurView intensity={40} tint="dark" style={styles.formCard}>
          <View style={styles.formContent}>
            {mode === "signup" && (
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={[styles.inputWrapper, focusedInput === "name" && styles.inputFocused, errors.name && styles.inputError]}>
                    <Ionicons name="person-outline" size={18} color={focusedInput === "name" ? ACCENT : "#9ca3af"} />
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
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                <View style={styles.half}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={[styles.inputWrapper, focusedInput === "lastName" && styles.inputFocused, errors.lastName && styles.inputError]}>
                    <Ionicons name="person-outline" size={18} color={focusedInput === "lastName" ? ACCENT : "#9ca3af"} />
                    <TextInput
                      placeholder="Doe"
                      placeholderTextColor="#6b7280"
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(text);
                        if (errors.lastName) setErrors({ ...errors, lastName: "" });
                      }}
                      onFocus={() => {
                        Haptics.selectionAsync();
                        setFocusedInput("lastName");
                      }}
                      onBlur={() => setFocusedInput(null)}
                      style={styles.input}
                    />
                  </View>
                  {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrapper, focusedInput === "email" && styles.inputFocused, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={18} color={focusedInput === "email" ? ACCENT : "#9ca3af"} />
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
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {mode === "signup" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone</Text>
                  <View style={[styles.inputWrapper, focusedInput === "phone" && styles.inputFocused, errors.phone && styles.inputError]}>
                    <Ionicons name="call-outline" size={18} color={focusedInput === "phone" ? ACCENT : "#9ca3af"} />
                    <TextInput
                      placeholder="+44 7700 900000"
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
                  {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                </View>

                <View style={styles.licenceSection}>
                  <Text style={styles.sectionLabel}>Driving Licence (Optional)</Text>
                  <View style={styles.licenceRow}>
                    <Pressable onPress={() => pickImage("front")} style={styles.licenceBtn}>
                      {licenceFront ? (
                        <Ionicons name="checkmark-circle" size={24} color={ACCENT} />
                      ) : (
                        <Ionicons name="camera-outline" size={24} color="#9ca3af" />
                      )}
                      <Text style={styles.licenceBtnText}>Front</Text>
                    </Pressable>
                    <Pressable onPress={() => pickImage("back")} style={styles.licenceBtn}>
                      {licenceBack ? (
                        <Ionicons name="checkmark-circle" size={24} color={ACCENT} />
                      ) : (
                        <Ionicons name="camera-outline" size={24} color="#9ca3af" />
                      )}
                      <Text style={styles.licenceBtnText}>Back</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.submitBtnPressed,
                isSubmitting && styles.submitBtnDisabled,
              ]}
            >
              <LinearGradient colors={[ACCENT, "#ff8c00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                {isSubmitting ? (
                  <ActivityIndicator color={DARK} size="small" />
                ) : (
                  <>
                    <Text style={styles.submitText}>{mode === "login" ? "Login" : "Create Account"}</Text>
                    <Ionicons name="arrow-forward" size={20} color={DARK} />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 32, fontWeight: "900", color: "#fff", marginBottom: 8 },
  tagline: { fontSize: 14, color: ACCENT, fontWeight: "600" },
  modeToggle: { flexDirection: "row", backgroundColor: "rgba(15,23,42,0.6)", borderRadius: 16, padding: 4, marginBottom: 24 },
  modeBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 12 },
  modeBtnActive: { backgroundColor: ACCENT },
  modeText: { fontSize: 15, fontWeight: "600", color: "#9ca3af" },
  modeTextActive: { color: DARK },
  formCard: { borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "rgba(254,154,0,0.2)" },
  formContent: { padding: 24, backgroundColor: "rgba(15,23,42,0.4)" },
  inputGroup: { marginBottom: 20 },
  row: { flexDirection: "row", gap: 12, marginBottom: 20 },
  half: { flex: 1 },
  label: { fontSize: 14, fontWeight: "600", color: "#e5e7eb", marginBottom: 8 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", borderRadius: 14, paddingHorizontal: 16, gap: 12, minHeight: 52 },
  inputFocused: { backgroundColor: "rgba(254,154,0,0.08)", borderColor: ACCENT },
  inputError: { borderColor: "#ef4444" },
  input: { flex: 1, color: "#f9fafb", fontSize: 16, paddingVertical: 16, fontWeight: "500" },
  errorText: { color: "#ef4444", fontSize: 13, marginTop: 6, marginLeft: 4, fontWeight: "500" },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#9ca3af", marginBottom: 12 },
  licenceSection: { marginBottom: 20 },
  licenceRow: { flexDirection: "row", gap: 12 },
  licenceBtn: { flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", borderRadius: 14, paddingVertical: 20, alignItems: "center", gap: 8 },
  licenceBtnText: { color: "#e5e7eb", fontSize: 14, fontWeight: "600" },
  submitBtn: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
  submitBtnPressed: { transform: [{ scale: 0.98 }] },
  submitBtnDisabled: { opacity: 0.6 },
  submitGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 20, minHeight: 56 },
  submitText: { fontSize: 16, fontWeight: "800", color: DARK },
});

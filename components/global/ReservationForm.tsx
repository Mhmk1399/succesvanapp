// components/ReservationForm.tsx
import React, { useState, useRef, useEffect } from "react";
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
  useColorScheme,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const ACCENT = "#fe9a00";
const DARK = "#0f172a";
const { height } = Dimensions.get("window");

type PickerField =
  | "pickupDate"
  | "pickupTime"
  | "returnDate"
  | "returnTime"
  | null;

type ReservationFormProps = {
  /** اگه خواستی بعداً این دکمه رو توی مودال دیگه استفاده کنی */
  onCompleted?: () => void;
};

export default function ReservationForm({ onCompleted }: ReservationFormProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shineAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 600],
  });

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
          closeSheet();
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

  const openSheet = async () => {
    await Haptics.selectionAsync();
    setSheetVisible(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: height,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSheetVisible(false);
    });
  };

  return (
    <>
      {/* MAIN CTA BUTTON */}
      <Pressable
        onPress={openSheet}
        style={({ pressed }) => [
          styles.mainButton,
          pressed && styles.mainButtonPressed,
        ]}
      >
        <LinearGradient
          colors={[ACCENT, "#ff8c00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.mainButtonGradient}
        >
          <Animated.View
            style={[
              styles.shineEffect,
              { transform: [{ translateX: shineTranslate }] },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <View style={[styles.mainButtonLeft, { zIndex: 2 }]}>
            <Ionicons name="flash-outline" size={22} color={DARK} />
            <Text style={styles.mainButtonText}>Quick Reservation</Text>
          </View>
          <View style={[styles.mainButtonRight, { zIndex: 2 }]}>
            <Ionicons name="calendar-outline" size={16} color={DARK} />
            <Text style={styles.mainButtonSubText}>Under 1 minute</Text>
          </View>
        </LinearGradient>
      </Pressable>
      

      {/* BOTTOM SHEET MODAL */}
      <Modal visible={sheetVisible} transparent animationType="none">
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "rgba(0,0,0,0.2)",
                opacity: backdropOpacity,
              },
            ]}
          />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
            <View {...panResponder.panHandlers} style={styles.handleArea}>
              <View style={styles.sheetHandle} />
            </View>

            <ReservationSheetContent
              onClose={closeSheet}
              onCompleted={onCompleted}
            />
          </BlurView>
        </Animated.View>
      </Modal>
    </>
  );
}

/* ===================== SHEET CONTENT ===================== */

type SheetContentProps = {
  onClose: () => void;
  onCompleted?: () => void;
};

function ReservationSheetContent({ onClose, onCompleted }: SheetContentProps) {
  const colorScheme = useColorScheme();

  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [returnTime, setReturnTime] = useState<Date | null>(null);
  const [location, setLocation] = useState("");
  const [passengers, setPassengers] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [pickerField, setPickerField] = useState<PickerField>(null);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const isPickerVisible = pickerField !== null;

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

  const openPicker = async (field: PickerField, mode: "date" | "time") => {
    await Haptics.selectionAsync();
    setPickerField(field);
    setPickerMode(mode);
  };

  const hidePicker = () => setPickerField(null);

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
    hidePicker();
  };

  const handleSubmit = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "✅ Reservation Submitted",
      "Your reservation has been successfully submitted!",
      [
        {
          text: "OK",
          onPress: () => {
            onCompleted?.();
            onClose();
          },
        },
      ]
    );
  };

  const handleFocus = (inputName: string) => {
    Haptics.selectionAsync();
    setFocusedInput(inputName);
  };

  const handleBlur = () => setFocusedInput(null);

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof Ionicons.glyphMap,
    inputName: string,
    keyboardType: "default" | "numeric" = "default"
  ) => {
    const isFocused = focusedInput === inputName;
    return (
      <View style={sheetStyles.inputGroup}>
        <View
          style={[
            sheetStyles.inputWrapper,
            isFocused && sheetStyles.inputWrapperFocused,
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={isFocused ? ACCENT : "rgba(255,255,255,0.4)"}
            style={sheetStyles.inputIcon}
          />
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={value}
            onChangeText={onChangeText}
            onFocus={() => handleFocus(inputName)}
            onBlur={handleBlur}
            style={sheetStyles.input}
            keyboardType={keyboardType}
          />
        </View>
      </View>
    );
  };

  const renderDateTimeField = (
    field: PickerField,
    mode: "date" | "time",
    icon: keyof typeof Ionicons.glyphMap,
    value: Date | null,
    placeholder: string
  ) => {
    const isActive = pickerField === field;
    const displayValue =
      mode === "date" ? formatDate(value) : formatTime(value);
    const hasValue = value !== null;

    return (
      <Pressable
        onPress={() => openPicker(field, mode)}
        style={({ pressed }) => [
          sheetStyles.inputWrapper,
          (pressed || isActive) && sheetStyles.inputWrapperFocused,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={hasValue ? ACCENT : "rgba(255,255,255,0.4)"}
          style={sheetStyles.inputIcon}
        />
        <Text
          style={[
            sheetStyles.input,
            !hasValue && { color: "rgba(255,255,255,0.35)" },
          ]}
        >
          {hasValue ? displayValue : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.5)" />
      </Pressable>
    );
  };

  return (
    <>
      {/* DATE / TIME PICKER MODAL */}
      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode={pickerMode}
        onConfirm={handleConfirm}
        onCancel={hidePicker}
        is24Hour={true}
        display="spinner"
        themeVariant={colorScheme === "dark" ? "dark" : "light"}
        accentColor={ACCENT}
        textColor={colorScheme === "dark" ? "#fff" : DARK}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={sheetStyles.container}
        >
          {/* Header */}
          <View style={sheetStyles.headerRow}>
            <View>
              <Text style={sheetStyles.sheetTitle}>Quick Reservation</Text>
              <Text style={sheetStyles.sheetSubtitle}>
                Just a few details to get started
              </Text>
            </View>
            <Pressable onPress={onClose} style={sheetStyles.closeBtn}>
              <Ionicons name="close" size={22} color="#e5e7eb" />
            </Pressable>
          </View>

          {/* AI VOICE BUTTON */}
          <VoiceAIButton />

          {/* PICKUP / RETURN */}
          <View style={sheetStyles.section}>
            <Text style={sheetStyles.sectionLabel}>Pickup</Text>
            <View style={sheetStyles.row}>
              <View style={sheetStyles.half}>
                {renderDateTimeField(
                  "pickupDate",
                  "date",
                  "calendar-outline",
                  pickupDate,
                  "Pickup date"
                )}
              </View>
              <View style={sheetStyles.half}>
                {renderDateTimeField(
                  "pickupTime",
                  "time",
                  "time-outline",
                  pickupTime,
                  "Time"
                )}
              </View>
            </View>
          </View>

          <View style={sheetStyles.section}>
            <Text style={sheetStyles.sectionLabel}>Return</Text>
            <View style={sheetStyles.row}>
              <View style={sheetStyles.half}>
                {renderDateTimeField(
                  "returnDate",
                  "date",
                  "calendar-outline",
                  returnDate,
                  "Return date"
                )}
              </View>
              <View style={sheetStyles.half}>
                {renderDateTimeField(
                  "returnTime",
                  "time",
                  "time-outline",
                  returnTime,
                  "Time"
                )}
              </View>
            </View>
          </View>

          {/* LOCATION & PASSENGERS (MINIMAL) */}
          <View style={sheetStyles.section}>
            {renderInput(
              "Pickup location (e.g. NW London)",
              location,
              setLocation,
              "location-outline",
              "location"
            )}
          </View>

          <View style={sheetStyles.section}>
            {renderInput(
              "Number of passengers",
              passengers,
              setPassengers,
              "people-outline",
              "passengers",
              "numeric"
            )}
          </View>

          {/* SUBMIT */}
          <View style={sheetStyles.buttonsRow}>
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                sheetStyles.submitButton,
                pressed && sheetStyles.submitButtonPressed,
              ]}
            >
              <LinearGradient
                colors={[ACCENT, "#ff8c00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={sheetStyles.submitGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color={DARK} />
                <Text style={sheetStyles.submitText}>Confirm Reservation</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

/* ===================== VOICE + AI BUTTON ===================== */

function VoiceAIButton() {
  const [recording, setRecording] = useState(false);
  const bars = [0, 1, 2, 3, 4, 5];
  const barAnims = useRef(bars.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (recording) {
      barAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 260 + index * 60,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 260 + index * 60,
              useNativeDriver: false,
            }),
          ])
        ).start();
      });
    } else {
      barAnims.forEach((anim) => {
        anim.stopAnimation(() => {
          anim.setValue(0);
        });
      });
    }
  }, [recording]);

  const toggleRecording = async () => {
    await Haptics.impactAsync(
      recording
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    );
    setRecording((prev) => !prev);

    // 🔊 اینجا می‌تونی رکورد صدا رو شروع/متوقف کنی
    // - با expo-av: Audio.Recording
    // - بعد بفرستی سرور/Cloud Function که هوش مصنوعی متن رو استخراج کنه
    // - بعد متن رو مپ کنی به فیلدهای فرم
  };

  return (
    <Pressable
      onPress={toggleRecording}
      style={({ pressed }) => [
        sheetStyles.voiceButton,
        pressed && { transform: [{ scale: 0.97 }] },
        recording && sheetStyles.voiceButtonActive,
      ]}
    >
      <View style={sheetStyles.voiceLeft}>
        <View style={sheetStyles.voiceIconWrapper}>
          <Ionicons
            name={recording ? "stop-circle" : "mic-circle-outline"}
            size={26}
            color={DARK}
          />
        </View>
        <View>
          <Text style={sheetStyles.voiceTitle}>
            {recording ? "Listening..." : "Fill with Voice + AI"}
          </Text>
          <Text style={sheetStyles.voiceSubtitle}>
            Just tell us pickup, return & passengers
          </Text>
        </View>
      </View>

      {/* Waveform */}
      <View style={sheetStyles.waveWrapper}>
        {bars.map((_, index) => {
          const h = barAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [4, 18], // ارتفاع سینوسی‌طور
          });
          return (
            <Animated.View
              key={index}
              style={[
                sheetStyles.waveBar,
                {
                  height: h,
                  opacity: recording ? 1 : 0.4,
                },
              ]}
            />
          );
        })}
      </View>
    </Pressable>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  mainButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 999,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  mainButtonPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  mainButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 200,
    height: '100%',
    zIndex: 1,
  },
  mainButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mainButtonText: {
    color: DARK,
    fontSize: 16,
    fontWeight: "800",
  },
  mainButtonRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,23,42,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mainButtonSubText: {
    color: DARK,
    fontSize: 11,
    fontWeight: "700",
  },

  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.8,
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
    backgroundColor: "rgba(2,6,23,0.3)",
  },
  handleArea: {
    paddingVertical: 12,
    alignItems: "center",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.7)",
  },
});

const sheetStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sheetTitle: {
    color: "#f9fafb",
    fontSize: 20,
    fontWeight: "900",
  },
  sheetSubtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
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

  /* Voice button */
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  voiceButtonActive: {
    borderColor: ACCENT,
    backgroundColor: "rgba(254,154,0,0.12)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  voiceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  voiceIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceTitle: {
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: "800",
  },
  voiceSubtitle: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
  },
  waveWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    paddingLeft: 12,
  },
  waveBar: {
    width: 3,
    borderRadius: 999,
    backgroundColor: ACCENT,
  },

  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  half: {
    flex: 1,
  },

  inputGroup: {
    marginBottom: 12,
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
  inputWrapperFocused: {
    borderColor: ACCENT,
    backgroundColor: "rgba(254,154,0,0.08)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  inputIcon: {
    marginLeft: 2,
  },
  input: {
    flex: 1,
    color: "#f9fafb",
    fontSize: 14,
    paddingVertical: 8,
    fontWeight: "500",
  },

  buttonsRow: {
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 18,
    overflow: "hidden",
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
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitText: {
    color: DARK,
    fontSize: 15,
    fontWeight: "800",
  },
});

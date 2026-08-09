import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import GlassView from "@/components/global/GlassView";

const ACCENT = "#fe9a00";
const DARK = "#0f172a";

type LoginRequiredModalProps = {
  visible: boolean;
  title?: string;
  message?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onLogin: () => void;
  onCancel: () => void;
};

export default function LoginRequiredModal({
  visible,
  title = "Login Required",
  message = "Please login or register to continue with your reservation.",
  primaryLabel = "Login / Register",
  secondaryLabel = "Not now",
  onLogin,
  onCancel,
}: LoginRequiredModalProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.94);
      translateY.setValue(18);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 190,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 120,
          friction: 13,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 120,
          friction: 14,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLogin();
  };

  const handleCancel = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Animated.View
          style={[
            styles.cardWrap,
            {
              opacity,
              transform: [{ scale }, { translateY }],
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <GlassView
              intensity={100}
              tint="dark"
              style={styles.card}
              overlayStyle={styles.cardOverlay}
            >
              <LinearGradient
                pointerEvents="none"
                colors={[
                  "rgba(255,255,255,0.08)",
                  "rgba(254,154,0,0.05)",
                  "transparent",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.headerRow}>
                <View style={styles.iconShell}>
                  <Ionicons name="lock-closed" size={20} color={ACCENT} />
                </View>
                <View style={styles.titleBlock}>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.kicker}>Account needed</Text>
                </View>
              </View>

              <Text style={styles.message}>{message}</Text>

              <View style={styles.actions}>
                <Pressable
                  onPress={handleLogin}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <LinearGradient
                    colors={[ACCENT, "#ff8c00"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryText}>{primaryLabel}</Text>
                    <Ionicons name="arrow-forward" size={18} color={DARK} />
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={handleCancel}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryPressed,
                  ]}
                >
                  <Text style={styles.secondaryText}>{secondaryLabel}</Text>
                </Pressable>
              </View>
            </GlassView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.62)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 360,
  },
  card: {
    borderRadius: 22,
    overflow: "hidden",
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardOverlay: {
    borderRadius: 22,
    backgroundColor: "rgba(15,23,42,0.34)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconShell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.28)",
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "900",
  },
  kicker: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  message: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryGradient: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  primaryText: {
    color: DARK,
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  secondaryPressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});

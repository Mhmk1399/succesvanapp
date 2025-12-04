import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const ACCENT = "#fe9a00";
const DARK = "#0f172a";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleCall = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL("tel:+442012345678");
  };

  const handleSupport = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL("mailto:support@successvanhire.com");
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(254,154,0,0.08)", "rgba(15,23,42,0.5)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Your trusted van hire partner</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleCall}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <LinearGradient
              colors={[ACCENT, "#ff8c00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <Ionicons name="call" size={20} color={DARK} />
              <Text style={styles.actionText}>Call Us</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleSupport}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <View style={styles.actionOutline}>
              <Ionicons name="chatbubble-ellipses" size={20} color={ACCENT} />
              <Text style={styles.actionTextOutline}>Support</Text>
            </View>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom Info */}
        <View style={styles.bottomSection}>
          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color="rgba(255,255,255,0.6)"
            />
            <Text style={styles.infoText}>24/7 Available</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color="rgba(255,255,255,0.6)"
            />
            <Text style={styles.infoText}>London Wide</Text>
          </View>
        </View>

        {/* Copyright */}
        <Text style={styles.copyright}>
          © {currentYear} Success Van Hire. All rights reserved.
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    paddingBottom: 120,
  },
  gradient: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 70,
    marginBottom: 8,
  },
  tagline: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionText: {
    color: DARK,
    fontSize: 15,
    fontWeight: "800",
  },
  actionOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "rgba(254,154,0,0.1)",
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderRadius: 16,
  },
  actionTextOutline: {
    color: ACCENT,
    fontSize: 15,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  copyright: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
  },
});

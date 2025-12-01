// components/ReservationHero.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import ReservationForm from "./ReservationForm";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height, width } = Dimensions.get("window");
const ACCENT = "#fe9a00";

export default function ReservationHero() {
  const insets = useSafeAreaInsets();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formSlideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.stagger(150, [
      // Title fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Title slide up
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
      // Form slide up
      Animated.spring(formSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={["#0a0f1e", "#0f172b", "#1e293b"]}
        style={styles.heroContainer}
      >
        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        {/* Content Container */}
        <View style={styles.heroContent}>
          {/* Title Section */}
          <Animated.View
            style={[
              styles.titleSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Logo/Icon */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[ACCENT, "#ff8c00"]}
                style={styles.logoGradient}
              >
                <Ionicons name="car-sport" size={32} color="#fff" />
              </LinearGradient>
            </View>

            {/* Main Title */}
            <Text style={styles.mainTitle}>Success Van Hire</Text>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDot} />
              <View style={styles.dividerLine} />
            </View>

            {/* Subtitle */}
            <Text style={styles.subTitle}>VEHICLE RESERVATION</Text>

            {/* Description */}
            <Text style={styles.description}>
              Affordable van rental services in London. Perfect for relocating,
              deliveries, or any transport needs. Find your ideal vehicle from
              our wide range of reliable vans.
            </Text>

            {/* Features */}
            <View style={styles.features}>
              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name="checkmark-circle" size={18} color={ACCENT} />
                </View>
                <Text style={styles.featureText}>24/7 Available</Text>
              </View>
              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name="shield-checkmark" size={18} color={ACCENT} />
                </View>
                <Text style={styles.featureText}>Fully Insured</Text>
              </View>
              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name="flash" size={18} color={ACCENT} />
                </View>
                <Text style={styles.featureText}>Instant Booking</Text>
              </View>
            </View>
          </Animated.View>

          {/* Form Section */}
          <Animated.View
            style={[
              styles.formSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: formSlideAnim }],
              },
            ]}
          >
            {/* Form Card Header */}
            <View style={styles.formHeader}>
              <View style={styles.formHeaderLeft}>
                <View style={styles.formHeaderIcon}>
                  <Ionicons name="document-text" size={20} color={ACCENT} />
                </View>
                <Text style={styles.formHeaderTitle}>Book Your Van</Text>
              </View>
              <View style={styles.formBadge}>
                <Text style={styles.formBadgeText}>Quick & Easy</Text>
              </View>
            </View>

            {/* Form Content */}
            <View style={styles.formContent}>
              <ReservationForm />
            </View>
          </Animated.View>
        </View>

        {/* Bottom Gradient Overlay */}
        <LinearGradient
          colors={["transparent", "rgba(10,15,30,0.8)"]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#0a0f1e",
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroContainer: {
    minHeight: height - 100,
    paddingVertical: 48,
    position: "relative",
  },

  // Decorative Elements
  decorativeCircle1: {
    position: "absolute",
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: ACCENT,
    opacity: 0.05,
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: ACCENT,
    opacity: 0.05,
  },

  heroContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 40,
  },

  // Title Section
  titleSection: {
    alignItems: "center",
    gap: 20,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoGradient: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
  },
  dividerLine: {
    width: 40,
    height: 2,
    backgroundColor: ACCENT,
    borderRadius: 1,
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ACCENT,
    textAlign: "center",
    letterSpacing: 3,
  },
  description: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 8,
    maxWidth: 500,
  },

  // Features
  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginTop: 12,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(254,154,0,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.2)",
  },
  featureIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },

  // Form Section
  formSection: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.2)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  formHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  formHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(254,154,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  formHeaderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  formBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(254,154,0,0.15)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  formBadgeText: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  formContent: {
    // Form component will have its own padding
  },

  // Bottom Gradient
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
});
// components/home/ReservationHero.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const ACCENT = "#fe9a00";

const VAN_IMAGES = [
  require("@/assets/images/van.png"),
  require("@/assets/images/van.png"),
  require("@/assets/images/van.png"),
];

export default function ReservationHero() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const descFade = useRef(new Animated.Value(0)).current;
  const badgeFade = useRef(new Animated.Value(0)).current;
  const statsScale = useRef(new Animated.Value(0)).current;

  const vanX = useRef(new Animated.Value(width)).current;
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.timing(descFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.timing(badgeFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(700),
      Animated.spring(statsScale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(particle1, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particle1, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particle2, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particle2, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particle3, {
            toValue: 1,
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particle3, {
            toValue: 0,
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(vanX, {
          toValue: width,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(vanX, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(vanX, {
          toValue: -width,
          duration: 800,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const currentVan = VAN_IMAGES[0];

  const particle1Y = particle1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const particle2Y = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const particle3Y = particle3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fe9a00", "#0f172b"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.particle,
          {
            top: 100,
            left: 30,
            opacity: particle1,
            transform: [{ translateY: particle1Y }],
          },
        ]}
      >
        <Ionicons name="star" size={12} color="rgba(254,154,0,0.4)" />
      </Animated.View>
      <Animated.View
        style={[
          styles.particle,
          {
            top: 150,
            right: 40,
            opacity: particle2,
            transform: [{ translateY: particle2Y }],
          },
        ]}
      >
        <Ionicons name="sparkles" size={16} color="rgba(254,154,0,0.5)" />
      </Animated.View>
      <Animated.View
        style={[
          styles.particle,
          {
            top: 200,
            left: width - 60,
            opacity: particle3,
            transform: [{ translateY: particle3Y }],
          },
        ]}
      >
        <Ionicons name="star" size={10} color="rgba(254,154,0,0.3)" />
      </Animated.View>

      <Animated.View
        style={[
          styles.heroInner,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/logo.png")}
            contentFit="contain"
            style={styles.logo}
          />
        </View>

        <Animated.View
          style={[
            styles.trustBadge,
            {
              opacity: badgeFade,
            },
          ]}
        >
          <Ionicons name="shield-checkmark" size={14} color={ACCENT} />
          <Text style={styles.trustText}>Trusted by 10,000+ customers</Text>
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            {
              transform: [{ scale: titleScale }],
            },
          ]}
        >
          Success Van Hire
        </Animated.Text>

        <Animated.Text
          style={[
            styles.description,
            {
              opacity: descFade,
            },
          ]}
        >
          Affordable, reliable & fast van rental services across London. Perfect
          for moving, deliveries and business needs.
        </Animated.Text>

        <View style={styles.vanOuter}>
          <Animated.View
            style={[
              styles.vanWrapper,
              {
                transform: [{ translateX: vanX }],
              },
            ]}
          >
            <Image
              source={currentVan}
              style={styles.vanImage}
              contentFit="contain"
            />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.statsRow,
            {
              transform: [{ scale: statsScale }],
            },
          ]}
        >
          <StatItem number="500+" label="Vans" />
          <View style={styles.statDivider} />
          <StatItem number="10K+" label="Happy Clients" />
          <View style={styles.statDivider} />
          <StatItem number="24/7" label="Support" />
        </Animated.View>

        <View style={styles.featureRow}>
          <Feature icon="checkmark-circle" label="24/7 Service" />
          <View style={styles.featureDivider} />
          <Feature icon="shield-checkmark" label="Fully Insured" />
          <View style={styles.featureDivider} />
          <Feature icon="flash" label="Instant Booking" />
          <View style={styles.featureDivider} />
          <Feature icon="car-sport" label="Modern Fleet" />
        </View>
      </Animated.View>
    </View>
  );
}

function Feature({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={10} color={ACCENT} />
      </View>
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    minHeight: height * 0.6,
  },
  topGlow: {
    position: "absolute",
    top: -120,
    left: -80,
    right: -80,
    height: 220,
    opacity: 0.7,
  },
  bottomGlow: {
    position: "absolute",
    bottom: -140,
    left: -80,
    right: -80,
    height: 260,
    opacity: 0.7,
  },
  heroInner: {
    alignItems: "center",
    gap: 16,
    maxWidth: 600,
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 4,
  },
  logo: {
    width: 150,
    height: 60,
    backgroundColor: "rgba(169, 93, 12, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 1,
    color: "#fff",
    textShadowColor: "rgba(254, 154, 0, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  description: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 24,
    fontSize: 15,
    maxWidth: 520,
    paddingHorizontal: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  vanOuter: {
    height: 130,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginVertical: 4,
  },
  vanWrapper: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
  },
  vanImage: {
    width: 220,
    height: 120,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 36,
    marginBottom: 15,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  featureIconContainer: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ACCENT + "25",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "600",
  },
  featureDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  teaser: {
    marginTop: 18,
    borderRadius: 999,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  teaserGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: ACCENT + "40",
    borderRadius: 999,
  },
  teaserText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  particle: {
    position: "absolute",
    zIndex: 5,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(254,154,0,0.15)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  trustText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "rgba(15,23,42,0.2)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: ACCENT,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});

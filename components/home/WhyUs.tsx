import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const ACCENT = "#fe9a00";
const CARD_WIDTH = 200;

type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
};

const FEATURES: Feature[] = [
  {
    icon: "shield-checkmark",
    title: "Fully Insured",
    description: "Comprehensive coverage included",
    color: "#10b981",
  },
  {
    icon: "time",
    title: "24/7 Available",
    description: "Book anytime, anywhere",
    color: "#3b82f6",
  },
  {
    icon: "flash",
    title: "Instant Booking",
    description: "Get your van in minutes",
    color: ACCENT,
  },
  {
    icon: "pricetag",
    title: "Best Prices",
    description: "No hidden fees guaranteed",
    color: "#8b5cf6",
  },
  {
    icon: "car-sport",
    title: "Modern Fleet",
    description: "Well-maintained vehicles",
    color: "#ec4899",
  },
  {
    icon: "location",
    title: "London Wide",
    description: "Service across all areas",
    color: "#06b6d4",
  },
];

export default function WhyUs() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Your Trusted{"\n"}
          <Text style={styles.titleAccent}>Van Hire Partner</Text>
        </Text>
      </View>

      <View style={styles.marqueeContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.marqueeContent}
        >
          {FEATURES.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.stats}>
        <StatItem number="500+" label="Happy Clients" />
        <View style={styles.statDivider} />
        <StatItem number="1000+" label="Bookings" />
        <View style={styles.statDivider} />
        <StatItem number="24/7" label="Support" />
      </View>
    </View>
  );
}

type FeatureCardProps = {
  feature: Feature;
  index: number;
};

function FeatureCard({ feature, index }: FeatureCardProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(rotate, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-5deg", "0deg"],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ scale }, { rotate: rotateInterpolate }],
        },
      ]}
    >
      <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
        <LinearGradient
          colors={[`${feature.color}20`, `${feature.color}10`, "transparent"]}
          style={styles.cardGradient}
        >
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: `${feature.color}20` },
            ]}
          >
            <View
              style={[
                styles.iconInner,
                { backgroundColor: `${feature.color}30` },
              ]}
            >
              <Ionicons name={feature.icon} size={32} color={feature.color} />
            </View>
          </View>

          <Text style={styles.cardTitle}>{feature.title}</Text>
          <Text style={styles.cardDescription}>{feature.description}</Text>

          <View
            style={[styles.cardAccent, { backgroundColor: feature.color }]}
          />
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

type StatItemProps = {
  number: string;
  label: string;
};

function StatItem({ number, label }: StatItemProps) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      delay: 400,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.statItem, { transform: [{ scale }] }]}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(254,154,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
    marginBottom: 16,
  },
  badgeText: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#f9fafb",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 40,
  },
  titleAccent: {
    color: ACCENT,
  },
  marqueeContainer: {
    position: "relative",
    height: 220,
  },
  marqueeContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  fadeOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: CARD_WIDTH,
    height: 200,
  },
  cardBlur: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardGradient: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  iconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    color: "#f9fafb",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 16,
  },
  cardDescription: {
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 20,
  },
  cardAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.2)",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: ACCENT,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 4,
  },
  statLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(148,163,184,0.3)",
  },
});

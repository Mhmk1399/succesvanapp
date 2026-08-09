import React, { useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import GlassView from "@/components/global/GlassView";
import * as Haptics from "expo-haptics";

const CARD_WIDTH = 156;
const CARD_HEIGHT = 164;
const CARD_SPACING = 10;

// Premium color palette
const COLORS = {
  accent: "#FF9500",
  accentLight: "rgba(255, 149, 0, 0.15)",
  accentGlow: "rgba(255, 149, 0, 0.3)",
  dark: "#0a0a0a",
  card: "rgba(30, 30, 35, 0.6)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  glass: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
  text: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.7)",
  textTertiary: "rgba(255, 255, 255, 0.4)",
};

type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  stat?: string;
  statLabel?: string;
};

const FEATURES: Feature[] = [
  {
    icon: "shield-checkmark",
    title: "Fully Insured",
    description: "Comprehensive coverage on every rental",
    color: "#10b981",
    stat: "100%",
    statLabel: "Covered",
  },
  {
    icon: "time",
    title: "24/7 Available",
    description: "Book anytime, day or night",
    color: "#3b82f6",
    stat: "24/7",
    statLabel: "Support",
  },
  {
    icon: "flash",
    title: "Instant Booking",
    description: "Get your van in just minutes",
    color: "#FF9500",
    stat: "5min",
    statLabel: "Average",
  },
  {
    icon: "pricetag",
    title: "Best Prices",
    description: "No hidden fees, transparent pricing",
    color: "#8b5cf6",
    stat: "30%",
    statLabel: "Cheaper",
  },
  {
    icon: "car-sport",
    title: "Modern Fleet",
    description: "Well-maintained, latest models",
    color: "#ec4899",
    stat: "50+",
    statLabel: "Vehicles",
  },
  {
    icon: "location",
    title: "London Wide",
    description: "Serving all London areas",
    color: "#06b6d4",
    stat: "32",
    statLabel: "Boroughs",
  },
];

export default function WhyUs() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const marqueeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<Animated.FlatList<Feature>>(null);

  // Auto-scroll for marquee effect
  useEffect(() => {
    // Header entrance
    Animated.stagger(200, [
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(statsAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-scroll marquee
    let scrollPosition = 0;
    const totalWidth = FEATURES.length * (CARD_WIDTH + CARD_SPACING);

    const autoScroll = () => {
      scrollPosition += 1;
      if (scrollPosition >= totalWidth / 2) {
        scrollPosition = 0;
      }
      marqueeAnim.setValue(scrollPosition);
    };

    const interval = setInterval(autoScroll, 30);
    return () => clearInterval(interval);
  }, []);

  const renderFeatureCard = useCallback(
    ({ item, index }: { item: Feature; index: number }) => (
      <FeatureCard feature={item} index={index} scrollX={scrollX} />
    ),
    [scrollX]
  );

  const displayedFeatures = FEATURES.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Feature Cards Carousel */}
      <View style={styles.carouselContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={displayedFeatures}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderFeatureCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />

        {/* Fade Overlays */}
        <LinearGradient
          colors={["rgba(8,11,18,1)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.15, y: 0 }}
          style={[styles.fadeOverlay, styles.fadeLeft]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", "rgba(8,11,18,1)"]}
          start={{ x: 0.85, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fadeOverlay, styles.fadeRight]}
          pointerEvents="none"
        />
      </View>

    </View>
  );
}

type FeatureCardProps = {
  feature: Feature;
  index: number;
  scrollX: Animated.Value;
};

function FeatureCard({ feature, index, scrollX }: FeatureCardProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: (index % FEATURES.length) * 100,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Glow pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000 + index * 200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000 + index * 200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const inputRange = [
    (index - 1) * (CARD_WIDTH + CARD_SPACING),
    index * (CARD_WIDTH + CARD_SPACING),
    (index + 1) * (CARD_WIDTH + CARD_SPACING),
  ];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.9, 1, 0.9],
    extrapolate: "clamp",
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.6, 1, 0.6],
    extrapolate: "clamp",
  });

  const rotateY = scrollX.interpolate({
    inputRange,
    outputRange: ["8deg", "0deg", "-8deg"],
    extrapolate: "clamp",
  });

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: Animated.multiply(opacity, scaleAnim),
          transform: [
            {
              scale: Animated.multiply(
                scale,
                Animated.multiply(scaleAnim, pressAnim)
              ),
            },
            { perspective: 1000 },
            { rotateY },
          ],
        },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        style={styles.cardPressable}
      >
        <GlassView intensity={16} tint="dark" style={styles.card}>
          <LinearGradient
            colors={[`${feature.color}15`, `${feature.color}08`, "transparent"]}
            style={styles.cardGradient}
          >
            {/* Animated Glow */}
            <Animated.View
              style={[
                styles.cardGlow,
                {
                  backgroundColor: feature.color,
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 0.25],
                  }),
                },
              ]}
            />

            {/* Icon */}
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconOuter,
                  { backgroundColor: `${feature.color}15` },
                ]}
              >
                <View
                  style={[
                    styles.iconInner,
                    { backgroundColor: `${feature.color}25` },
                  ]}
                >
                  <Ionicons
                    name={feature.icon}
                    size={28}
                    color={feature.color}
                  />
                </View>
              </View>

              {/* Stat Badge */}
              {feature.stat && (
                <View
                  style={[
                    styles.statBadge,
                    { backgroundColor: `${feature.color}20` },
                  ]}
                >
                  <Text
                    style={[styles.statBadgeText, { color: feature.color }]}
                  >
                    {feature.stat}
                  </Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{feature.title}</Text>
              <Text style={styles.cardDescription}>{feature.description}</Text>
            </View>

            {/* Bottom Accent */}
            <View style={styles.cardBottom}>
              <View
                style={[styles.cardAccent, { backgroundColor: feature.color }]}
              />
            </View>
          </LinearGradient>
        </GlassView>
      </Pressable>
    </Animated.View>
  );
}

type TrustBadgeProps = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
};

function TrustBadge({ icon, text }: TrustBadgeProps) {
  return (
    <View style={styles.trustBadge}>
      <Ionicons name={icon} size={14} color={COLORS.accent} />
      <Text style={styles.trustBadgeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    position: "relative",
  },
  backgroundDecor: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  glowOrb1: {
    width: 350,
    height: 200,
    top: -100,
    left: -100,
    backgroundColor: COLORS.accentGlow,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 100,
      },
    }),
  },
  glowOrb2: {
    width: 250,
    height: 250,
    bottom: -50,
    right: -80,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    ...Platform.select({
      ios: {
        shadowColor: "#3b82f6",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 80,
      },
    }),
  },
  header: {
    alignItems: "flex-start",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  badgeWrapper: {
    marginBottom: 16,
    borderRadius: 100,
    overflow: "hidden",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: "hidden",
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "left",
    lineHeight: 23,
    letterSpacing: 0,
    marginBottom: 4,
  },
  titleAccent: {
    color: COLORS.accent,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "left",
    lineHeight: 18,
    maxWidth: 340,
    fontWeight: "700",
  },
  carouselContainer: {
    height: CARD_HEIGHT + 16,
    position: "relative",
  },
  carouselContent: {
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  fadeOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 34,
    zIndex: 10,
  },
  fadeLeft: {
    left: 0,
  },
  fadeRight: {
    right: 0,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: CARD_SPACING / 2,
  },
  cardPressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(15,23,42,0.82)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardGradient: {
    flex: 1,
    padding: 15,
    justifyContent: "space-between",
  },
  cardGlow: {
    position: "absolute",
    top: -50,
    left: -50,
    right: -50,
    height: 180,
    borderRadius: 100,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  iconInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  statBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 9,
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  cardContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 5,
    letterSpacing: 0,
  },
  cardDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  cardAccent: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  learnMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 24,
    overflow: "hidden",
  },
  statsBlur: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: "hidden",
  },
  statsGradient: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.accentLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statLabel: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.glassBorder,
  },
  trustBadges: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  trustBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
});

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
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

const CARD_WIDTH = 180;
const CARD_HEIGHT = 220;
const CARD_SPACING = 14;

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
  const shimmerAnim = useRef(new Animated.Value(0)).current;
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

    // Shimmer effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

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

  // Double the data for infinite scroll effect
  const doubledFeatures = [...FEATURES];

  return (
    <View style={styles.container}>
      {/* Background Decorations */}
      <View style={styles.backgroundDecor}>
        <Animated.View
          style={[
            styles.glowOrb,
            styles.glowOrb1,
            {
              opacity: shimmerAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.4, 0.2],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.glowOrb,
            styles.glowOrb2,
            {
              opacity: shimmerAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.15, 0.3, 0.15],
              }),
            },
          ]}
        />
      </View>

      {/* Header Section */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.title}>
          Your Trusted{"\n"}
          <Text style={styles.titleAccent}>Van Hire Partner</Text>
        </Text>

        <Text style={styles.subtitle}>
          Experience the difference with London's premier van rental service
        </Text>
      </Animated.View>

      {/* Feature Cards Carousel */}
      <View style={styles.carouselContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={doubledFeatures}
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
          colors={["rgba(10,10,10,1)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.15, y: 0 }}
          style={[styles.fadeOverlay, styles.fadeLeft]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", "rgba(10,10,10,1)"]}
          start={{ x: 0.85, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fadeOverlay, styles.fadeRight]}
          pointerEvents="none"
        />
      </View>

      {/* Trust Badges */}
      <Animated.View
        style={[
          styles.trustBadges,
          {
            opacity: statsAnim,
            transform: [
              {
                translateY: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TrustBadge icon="shield-checkmark" text="Verified Business" />
        <TrustBadge icon="card" text="Secure Payments" />
        <TrustBadge icon="thumbs-up" text="Satisfaction Guaranteed" />
      </Animated.View>
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
        <BlurView intensity={30} tint="dark" style={styles.card}>
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
        </BlurView>
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
    paddingVertical: 48,
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
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
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
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 44,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  titleAccent: {
    color: COLORS.accent,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  carouselContainer: {
    height: CARD_HEIGHT + 40,
    position: "relative",
  },
  carouselContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  fadeOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
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
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  cardGlow: {
    position: "absolute",
    top: -50,
    left: -50,
    right: -50,
    height: 100,
    borderRadius: 100,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconOuter: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconInner: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  statBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statBadgeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  cardContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
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
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  trustBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
});

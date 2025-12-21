import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  Linking,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// Premium color palette
const COLORS = {
  accent: "#FF9500",
  accentLight: "rgba(255, 149, 0, 0.15)",
  accentGlow: "rgba(255, 149, 0, 0.3)",
  accentDark: "#E68900",
  dark: "#0a0a0a",
  card: "rgba(30, 30, 35, 0.6)",
  cardActive: "rgba(40, 40, 45, 0.8)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  glass: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
  text: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.7)",
  textTertiary: "rgba(255, 255, 255, 0.4)",
  success: "#34C759",
  divider: "rgba(255, 255, 255, 0.06)",
};

type FAQItem = {
  question: string;
  answer: string;
  icon?: keyof typeof Ionicons.glyphMap;
  category?: string;
};

const FAQ_DATA: FAQItem[] = [
  {
    question: "What documents do I need to hire a van?",
    answer:
      "You'll need a valid UK driving licence, proof of address, and a payment method. International customers may need additional documentation such as an International Driving Permit.",
    icon: "document-text-outline",
    category: "Requirements",
  },
  {
    question: "What's included in the rental price?",
    answer:
      "All rentals include comprehensive insurance, breakdown cover, and unlimited mileage within the M25. Fuel is not included but we provide a full tank which should be returned full.",
    icon: "pricetag-outline",
    category: "Pricing",
  },
  {
    question: "Can I extend my rental period?",
    answer:
      "Yes! Contact us at least 24 hours before your return time. Extensions are subject to availability and will be charged at the standard hourly rate. You can extend via the app or by calling us.",
    icon: "time-outline",
    category: "Booking",
  },
  {
    question: "What if I return the van late?",
    answer:
      "Late returns are charged at £15 per hour for the first 2 hours, then £25 per hour thereafter. Please contact us if you anticipate being late to avoid additional charges and discuss options.",
    icon: "alarm-outline",
    category: "Returns",
  },
  {
    question: "Is there a minimum rental period?",
    answer:
      "Yes, our minimum rental period is 4 hours. We offer flexible hourly, daily, and weekly rates with significant discounts for longer bookings. Weekly rentals save up to 30%.",
    icon: "calendar-outline",
    category: "Booking",
  },
  {
    question: "What happens if the van breaks down?",
    answer:
      "All vans include 24/7 breakdown assistance. Call our emergency number and we'll arrange recovery or a replacement vehicle within 2 hours. Your rental time will be extended at no extra cost.",
    icon: "construct-outline",
    category: "Support",
  },
];

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Header entrance animation
    Animated.spring(headerAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Shimmer loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleToggle = useCallback(
    (index: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setExpandedIndex(expandedIndex === index ? null : index);
    },
    [expandedIndex]
  );

  return (
    <View style={styles.container}>
      {/* Decorative Background Elements */}
      <View style={styles.backgroundDecor}>
        <Animated.View
          style={[
            styles.glowOrb,
            styles.glowOrb1,
            {
              opacity: shimmerAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.6, 0.3],
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
                outputRange: [0.2, 0.4, 0.2],
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
          Frequently Asked{"\n"}
          <Text style={styles.titleAccent}>Questions</Text>
        </Text>

        <Text style={styles.subtitle}>
          Find answers to common questions about our van rental service
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{FAQ_DATA.length}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Support</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>2min</Text>
            <Text style={styles.statLabel}>Response</Text>
          </View>
        </View>
      </Animated.View>

      {/* FAQ List */}
      <View style={styles.list}>
        {FAQ_DATA.map((item, index) => (
          <FAQCard
            key={index}
            item={item}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() => handleToggle(index)}
            totalItems={FAQ_DATA.length}
          />
        ))}
      </View>

      {/* Bottom CTA */}
      <Animated.View
        style={[
          styles.ctaContainer,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <BlurView intensity={30} tint="dark" style={styles.ctaBlur}>
          <View style={styles.ctaContent}>
            <View style={styles.ctaLeft}>
              <View style={styles.ctaIconWrapper}>
                <Ionicons name="chatbubbles" size={16} color={COLORS.accent} />
              </View>
              <View>
                <Text style={styles.ctaTitle}>Still have questions?</Text>
                <Text style={styles.ctaSubtitle}>
                  Our support team is here to help
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Linking.openURL("tel:+442030111198");
              }}
            >
              <Text style={styles.ctaButtonText}>Contact Us</Text>
            </Pressable>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}

type FAQCardProps = {
  item: FAQItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  totalItems: number;
};

function FAQCard({ item, index, isExpanded, onToggle }: FAQCardProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 100,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // Expand/Collapse animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        tension: 120,
        friction: 14,
        useNativeDriver: true,
      }),
      Animated.spring(expandAnim, {
        toValue: isExpanded ? 1 : 0,
        tension: 100,
        friction: 12,
        useNativeDriver: false, // Height animation can't use native driver
      }),
      Animated.timing(glowAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isExpanded]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const answerHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150], // Adjust based on content
  });

  const answerOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255, 255, 255, 0.08)", "rgba(255, 149, 0, 0.3)"],
  });

  const backgroundColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(30, 30, 35, 0.6)", "rgba(40, 40, 45, 0.8)"],
  });

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.98,
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
          opacity: scaleAnim,
          transform: [
            { scale: Animated.multiply(scaleAnim, pressAnim) },
            {
              translateY: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          {
            borderColor,
            backgroundColor,
          },
        ]}
      >
        {/* Card Glow Effect when expanded */}
        {isExpanded && (
          <Animated.View
            style={[
              styles.cardGlow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            ]}
          />
        )}

        <Pressable
          onPress={onToggle}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.cardPressable}
        >
          {/* Question Header */}
          <View style={styles.cardHeader}>
            <View style={styles.questionRow}>
              {/* Number Badge */}
              <View
                style={[
                  styles.numberBadge,
                  isExpanded && styles.numberBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.numberText,
                    isExpanded && styles.numberTextActive,
                  ]}
                >
                  {String(index + 1).padStart(2, "0")}
                </Text>
              </View>

              {/* Question Text */}
              <View style={styles.questionContent}>
                {item.category && (
                  <Text style={styles.categoryText}>{item.category}</Text>
                )}
                <Text
                  style={[styles.question, isExpanded && styles.questionActive]}
                >
                  {item.question}
                </Text>
              </View>
            </View>

            {/* Expand Icon */}
            <Animated.View
              style={[
                styles.expandIconWrapper,
                isExpanded && styles.expandIconWrapperActive,
                { transform: [{ rotate }] },
              ]}
            >
              <Ionicons
                name="chevron-down"
                size={18}
                color={isExpanded ? COLORS.dark : COLORS.accent}
              />
            </Animated.View>
          </View>

          {/* Answer Section */}
          <Animated.View
            style={[
              styles.answerWrapper,
              {
                maxHeight: answerHeight,
                opacity: answerOpacity,
              },
            ]}
          >
            <View style={styles.answerContainer}>
              <View style={styles.answerDivider} />
              <View style={styles.answerContent}>
                <View style={styles.answerIconWrapper}>
                  <Ionicons
                    name={item.icon || "information-circle-outline"}
                    size={20}
                    color={COLORS.accent}
                  />
                </View>
                <Text style={styles.answer}>{item.answer}</Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 20,
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
    width: 300,
    height: 200,
    top: -100,
    right: -100,
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
    width: 200,
    height: 200,
    bottom: 100,
    left: -80,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    ...Platform.select({
      ios: {
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 80,
      },
    }),
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  headerBadge: {
    marginBottom: 16,
    borderRadius: 100,
    overflow: "hidden",
  },
  badgeBlur: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: "hidden",
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 44,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: COLORS.accent,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.divider,
  },
  list: {
    gap: 12,
  },
  cardWrapper: {
    position: "relative",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardGlow: {
    position: "absolute",
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    backgroundColor: COLORS.accentGlow,
    borderRadius: 100,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 50,
      },
    }),
  },
  cardPressable: {
    padding: 0,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    gap: 14,
  },
  questionRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  numberBadgeActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  numberText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  numberTextActive: {
    color: COLORS.dark,
  },
  questionContent: {
    flex: 1,
    paddingTop: 2,
  },
  categoryText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  question: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  questionActive: {
    color: COLORS.text,
  },
  expandIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  expandIconWrapperActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  answerWrapper: {
    overflow: "hidden",
  },
  answerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  answerDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 16,
    marginLeft: 54,
  },
  answerContent: {
    flexDirection: "row",
    gap: 12,
  },
  answerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  answer: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
  helpfulRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginLeft: 54,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  helpfulText: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: "500",
  },
  helpfulButtons: {
    flexDirection: "row",
    gap: 8,
  },
  helpfulButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  helpfulButtonPressed: {
    backgroundColor: COLORS.accentLight,
  },
  helpfulButtonText: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: "600",
  },
  ctaContainer: {
    marginTop: 32,
    borderRadius: 24,
    overflow: "hidden",
  },
  ctaBlur: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: "hidden",
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    gap: 16,
  },
  ctaLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  ctaIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 14,
    backgroundColor: COLORS.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  ctaSubtitle: {
    color: COLORS.textTertiary,
    fontSize: 13,
    marginTop: 2,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  ctaButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
  },
  ctaButtonText: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: "700",
  },
});

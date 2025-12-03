import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const ACCENT = "#fe9a00";

type FAQItem = {
  question: string;
  answer: string;
};

const FAQ_DATA: FAQItem[] = [
  {
    question: "What documents do I need to hire a van?",
    answer:
      "You'll need a valid UK driving licence, proof of address, and a payment method. International customers may need additional documentation.",
  },
  {
    question: "What's included in the rental price?",
    answer:
      "All rentals include comprehensive insurance, breakdown cover, and unlimited mileage within the M25. Fuel is not included.",
  },
  {
    question: "Can I extend my rental period?",
    answer:
      "Yes! Contact us at least 24 hours before your return time. Extensions are subject to availability and will be charged at the hourly rate.",
  },
  {
    question: "What if I return the van late?",
    answer:
      "Late returns are charged at £15 per hour. Please contact us if you anticipate being late to avoid additional charges.",
  },
  {
    question: "Is there a minimum rental period?",
    answer:
      "Yes, our minimum rental period is 4 hours. We offer flexible hourly, daily, and weekly rates.",
  },
  {
    question: "What happens if the van breaks down?",
    answer:
      "All vans include 24/7 breakdown assistance. Call our emergency number and we'll arrange recovery or a replacement vehicle.",
  },
];

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Frequently Asked{"\n"}
          <Text style={styles.titleAccent}>Questions</Text>
        </Text>
        <Text style={styles.subtitle}>Everything you need to know</Text>
      </View>

      <View style={styles.list}>
        {FAQ_DATA.map((item, index) => (
          <FAQCard
            key={index}
            item={item}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </View>
    </View>
  );
}

type FAQCardProps = {
  item: FAQItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
};

function FAQCard({ item, index, isExpanded, onToggle }: FAQCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // انیمیشن ورود کارت‌ها
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 80,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  // چرخیدن آیکون فلش
  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      tension: 150,
      friction: 18,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // انیمیشن باز/بسته شدن با LayoutAnimation
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        220,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );

    onToggle();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.cardHeader,
          isExpanded && styles.cardHeaderExpanded,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.questionRow}>
          <View style={styles.iconWrapper}>
            <Ionicons name="help-circle-outline" size={20} color={ACCENT} />
          </View>
          <Text style={styles.question}>{item.question}</Text>
        </View>

        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={20} color={ACCENT} />
        </Animated.View>
      </Pressable>

      {isExpanded && (
        <View style={styles.answerWrapper}>
          <View style={styles.answerContainer}>
            <Text style={styles.answer}>{item.answer}</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    color: "#f9fafb",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 8,
  },
  titleAccent: {
    color: ACCENT,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.2)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
    minHeight: 60,
  },
  cardHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.1)",
  },
  cardPressed: {
    backgroundColor: "rgba(254,154,0,0.08)",
  },
  questionRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(254,154,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  question: {
    flex: 1,
    color: "#f9fafb",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  answerWrapper: {
    overflow: "hidden",
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: "rgba(254,154,0,0.02)",
  },
  answer: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 22,
    paddingLeft: 48,
  },
});

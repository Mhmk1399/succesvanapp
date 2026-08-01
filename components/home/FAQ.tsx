import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import GlassView from "@/components/global/GlassView";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const ACCENT = "#fe9a00";
const DARK = "#0f172a";

const COLORS = {
  accent: ACCENT,
  accentSoft: "rgba(254,154,0,0.14)",
  panel: "rgba(8,12,22,0.62)",
  panelSoft: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.11)",
  borderActive: "rgba(254,154,0,0.34)",
  text: "#f8fafc",
  textMuted: "rgba(248,250,252,0.64)",
  textFaint: "rgba(248,250,252,0.42)",
};

type FAQItem = {
  question: string;
  answer: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
};

const FAQ_DATA: FAQItem[] = [
  {
    question: "What documents do I need?",
    answer:
      "Bring a valid UK driving licence, proof of address, and a payment method. International customers may need extra documentation.",
    icon: "document-text-outline",
    category: "Documents",
  },
  {
    question: "What is included in the price?",
    answer:
      "Rental includes insurance, breakdown cover, and flexible hire options. Fuel is not included, so the van should be returned with the agreed fuel level.",
    icon: "pricetag-outline",
    category: "Pricing",
  },
  {
    question: "Can I extend my rental?",
    answer:
      "Yes. Contact us before your return time and we will check availability. Extra time is charged using the current rental rate.",
    icon: "time-outline",
    category: "Booking",
  },
  {
    question: "What if I return late?",
    answer:
      "Late returns can add extra charges. If you expect a delay, contact support as early as possible so we can help you avoid issues.",
    icon: "alarm-outline",
    category: "Returns",
  },
  {
    question: "Is there a minimum rental period?",
    answer:
      "Yes. The booking flow will validate the minimum rental time before showing available vans.",
    icon: "calendar-outline",
    category: "Rules",
  },
  {
    question: "What happens if the van breaks down?",
    answer:
      "Our support team will arrange breakdown assistance or advise on the next step. Contact us immediately if anything goes wrong.",
    icon: "construct-outline",
    category: "Support",
  },
];

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      tension: 52,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const handleToggle = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedIndex((current) => (current === index ? null : index));
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        },
      ]}
    >
      <GlassView intensity={12} tint="dark" style={styles.shell}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="help-buoy-outline" size={19} color={ACCENT} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Help center</Text>
            <Text style={styles.subtitle}>Quick answers before you book</Text>
          </View>
        </View>

        <View style={styles.topicRow}>
          <TopicPill icon="flash-outline" label="Fast" />
          <TopicPill icon="shield-checkmark-outline" label="Covered" />
          <TopicPill icon="call-outline" label="Support" />
        </View>

        <View style={styles.list}>
          {FAQ_DATA.map((item, index) => (
            <FAQRow
              key={item.question}
              item={item}
              isExpanded={expandedIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Linking.openURL("tel:+442030111198");
          }}
          style={({ pressed }) => [
            styles.supportAction,
            pressed && styles.supportActionPressed,
          ]}
        >
          <View style={styles.supportLeft}>
            <View style={styles.supportIcon}>
              <Ionicons name="headset-outline" size={17} color={COLORS.text} />
            </View>
            <View style={styles.supportTextWrap}>
              <Text style={styles.supportTitle}>Need more help?</Text>
              <Text style={styles.supportSubtitle}>Call our rental team</Text>
            </View>
          </View>
          <View style={styles.supportCta}>
            <Ionicons name="call" size={15} color={DARK} />
          </View>
        </Pressable>
      </GlassView>
    </Animated.View>
  );
}

function TopicPill({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.topicPill}>
      <Ionicons name={icon} size={13} color={ACCENT} />
      <Text style={styles.topicText}>{label}</Text>
    </View>
  );
}

function FAQRow({
  item,
  isExpanded,
  onToggle,
}: {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const expand = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(expand, {
      toValue: isExpanded ? 1 : 0,
      tension: 110,
      friction: 14,
      useNativeDriver: false,
    }).start();
  }, [expand, isExpanded]);

  const answerHeight = expand.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 118],
  });

  const answerOpacity = expand.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
  });

  const rotate = expand.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const handlePressIn = () => {
    Animated.spring(press, {
      toValue: 0.985,
      tension: 160,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(press, {
      toValue: 1,
      tension: 160,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: press }] }}>
      <Pressable
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.rowCard, isExpanded && styles.rowCardActive]}
      >
        <View style={styles.rowHeader}>
          <View style={[styles.rowIcon, isExpanded && styles.rowIconActive]}>
            <Ionicons
              name={item.icon}
              size={17}
              color={isExpanded ? DARK : ACCENT}
            />
          </View>

          <View style={styles.rowCopy}>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.question} numberOfLines={2}>
              {item.question}
            </Text>
          </View>

          <Animated.View
            style={[
              styles.plusButton,
              isExpanded && styles.plusButtonActive,
              { transform: [{ rotate }] },
            ]}
          >
            <Ionicons
              name="add"
              size={18}
              color={isExpanded ? DARK : COLORS.textMuted}
            />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.answerWrap,
            { maxHeight: answerHeight, opacity: answerOpacity },
          ]}
        >
          <View style={styles.answerDivider} />
          <Text style={styles.answer}>{item.answer}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  shell: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
  },
  header: {
    minHeight: 62,
    paddingHorizontal: 14,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.borderActive,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  topicRow: {
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  topicPill: {
    flex: 1,
    minHeight: 30,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.panelSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topicText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  list: {
    gap: 7,
    paddingHorizontal: 8,
  },
  rowCard: {
    borderRadius: 16,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  rowCardActive: {
    backgroundColor: "rgba(254,154,0,0.075)",
    borderColor: COLORS.borderActive,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentSoft,
  },
  rowIconActive: {
    backgroundColor: ACCENT,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  category: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  question: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },
  plusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  plusButtonActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  answerWrap: {
    overflow: "hidden",
  },
  answerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.09)",
    marginTop: 12,
    marginBottom: 10,
    marginLeft: 42,
  },
  answer: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "600",
    paddingLeft: 42,
    paddingRight: 4,
    paddingBottom: 2,
  },
  supportAction: {
    minHeight: 56,
    margin: 8,
    marginTop: 12,
    borderRadius: 17,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  supportActionPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  supportLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  supportIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  supportTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  supportTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },
  supportSubtitle: {
    color: COLORS.textFaint,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  supportCta: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },
});

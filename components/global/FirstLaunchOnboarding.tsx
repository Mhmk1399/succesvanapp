import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#ff9f1c";

type Props = {
  onFinish: () => void;
};

type Slide = {
  title: string;
  description: string;
  image: number;
};

const SLIDES: Slide[] = [
  {
    title: "Take control with flexible self-drive vans",
    description:
      "Modern, reliable vehicles ready for moving, deliveries and business needs.",
    image: require("@/assets/images/screen1.png"),
  },
  {
    title: "From a day to months",
    description:
      "Daily, weekly or monthly hire on your schedule, with simple booking from your phone.",
    image: require("@/assets/images/screen3.png"),
  },
  {
    title: "Save more across the UK",
    description:
      "Great value long-term rates and UK-wide service for customers who need more time.",
    image: require("@/assets/images/screen2.png"),
  },
];

export default function FirstLaunchOnboarding({ onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1 / SLIDES.length)).current;

  const activeSlide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  useEffect(() => {
    imageScale.setValue(1.04);
    Animated.parallel([
      Animated.spring(progressAnim, {
        toValue: (index + 1) / SLIDES.length,
        tension: 90,
        friction: 14,
        useNativeDriver: false,
      }),
      Animated.timing(imageScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [imageScale, index, progressAnim]);

  const animateToNext = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -18,
        duration: 170,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIndex(nextIndex);
      slideAnim.setValue(22);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 90,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isLast) {
      onFinish();
      return;
    }

    animateToNext(index + 1);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: fadeAnim,
            transform: [{ scale: imageScale }],
          },
        ]}
      >
        <Image
          source={activeSlide.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
        />
      </Animated.View>

      <LinearGradient
        colors={[
          "rgba(3,7,18,0.76)",
          "rgba(3,7,18,0.42)",
          "rgba(3,7,18,0.08)",
          "rgba(3,7,18,0.46)",
          "rgba(3,7,18,0.86)",
        ]}
        locations={[0, 0.22, 0.5, 0.74, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 18) + 18,
            paddingBottom: Math.max(insets.bottom, 18) + 18,
          },
        ]}
      >
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <Animated.View
          style={[
            styles.copyBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>{activeSlide.title}</Text>
          <Text style={styles.description}>{activeSlide.description}</Text>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((slide, slideIndex) => (
              <View
                key={slide.title}
                style={[
                  styles.dot,
                  slideIndex === index && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={["#ffbf5b", "#ff9500"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {isLast ? "Start booking" : "Next"}
              </Text>
              <Ionicons
                name={isLast ? "checkmark" : "arrow-forward"}
                size={20}
                color="#111827"
              />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#030712",
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "space-between",
  },
  progressTrack: {
    position: "absolute",
    top: 8,
    left: 22,
    right: 22,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  copyBlock: {
    alignItems: "center",
    paddingTop: 62,
  },
  title: {
    color: "#ffffff",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    textAlign: "center",
    maxWidth: 350,
  },
  description: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 14,
    maxWidth: 342,
  },
  footer: {
    gap: 18,
  },
  dots: {
    height: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  dotActive: {
    width: 25,
    backgroundColor: ACCENT,
  },
  button: {
    borderRadius: 25,
    overflow: "hidden",
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  buttonGradient: {
    minHeight: 64,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
  },
});

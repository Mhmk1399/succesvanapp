import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BRAND_LOGO_URI } from "@/constants/branding";

const ACCENT = "#ff9f0a";
const NAVY = "#081523";

const VAN_IMAGES = [
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/louton.png",
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/14seater.png",
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/shortee.png",
];

type Props = {
  onFinish: () => void;
};

type Slide = {
  eyebrow: string;
  titleTop: string;
  titleAccent: string;
  titleBottom: string;
  description: string;
  image: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "London van booking",
    titleTop: "Fast &",
    titleAccent: "Reliable",
    titleBottom: "Van Hire",
    description:
      "Vans across London for moves, deliveries and business trips. Book in under 1 minute.",
    image: VAN_IMAGES[0],
  },
  {
    eyebrow: "Choose your perfect size",
    titleTop: "Room for",
    titleAccent: "Every",
    titleBottom: "Journey",
    description:
      "From compact vans to 14 seaters, pick the right vehicle for your route and schedule.",
    image: VAN_IMAGES[1],
  },
  {
    eyebrow: "Ready when you are",
    titleTop: "Simple",
    titleAccent: "Flexible",
    titleBottom: "Booking",
    description:
      "Daily, weekly and longer hire options with clear pricing and support across London.",
    image: VAN_IMAGES[2],
  },
];

export default function FirstLaunchOnboarding({ onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);

  const activeSlide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const compactHeight = height < 720;
  const panelWidth = Math.min(width - 26, 390);
  const panelHeight = Math.min(
    Math.max(height - Math.max(insets.top + insets.bottom, 20) - 24, 620),
    780,
  );
  const vanHeight = compactHeight ? 235 : 300;
  useEffect(() => {
    void Image.prefetch(
      SLIDES.map((slide) => slide.image),
      "memory-disk",
    ).catch(() => undefined);
  }, []);
  useEffect(() => {
    imageScale.setValue(1.045);
    Animated.timing(imageScale, {
      toValue: 1,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [imageScale, index]);

  const animateToSlide = (nextIndex: number) => {
    if (isTransitioning.current) return;

    isTransitioning.current = true;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -18,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        isTransitioning.current = false;
        return;
      }

      // ابتدا مقادیر انیمیشن را برای اسلاید جدید آماده می‌کنیم
      fadeAnim.setValue(0);
      slideAnim.setValue(22);

      // سپس محتوای اسلاید عوض می‌شود
      setIndex(nextIndex);

      // صبر می‌کنیم React اسلاید جدید را رندر کند
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 90,
            friction: 12,
            useNativeDriver: true,
          }),
        ]).start(() => {
          isTransitioning.current = false;
        });
      });
    });
  };

  const handleNext = () => {
    if (isTransitioning.current) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isLast) {
      onFinish();
      return;
    }

    animateToSlide(index + 1);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={["#ffe6b4", "#ffd085", "#fff3d3"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.panel,
          {
            minHeight: panelHeight,
          },
        ]}
      >
        <LinearGradient
          colors={[NAVY, "#07101d", "#0b1724", "#7d500f", "#d88313"]}
          locations={[0, 0.38, 0.62, 0.86, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.orbitLarge} pointerEvents="none" />
        <View style={styles.orbitSmall} pointerEvents="none" />
        <View style={styles.swoosh} pointerEvents="none" />
        <Ionicons
          name="star"
          size={10}
          color="rgba(255,159,10,0.48)"
          style={styles.starTop}
        />
        <Ionicons
          name="star"
          size={13}
          color="rgba(255,159,10,0.45)"
          style={styles.starMid}
        />
        <View style={styles.sparkDot} />

        <View
          style={[
            styles.panelContent,
            {
              paddingTop: compactHeight ? 24 : 38,
              paddingBottom: compactHeight ? 18 : 24,
            },
          ]}
        >
          <View style={styles.brand}>
            <Image
              source={{ uri: BRAND_LOGO_URI }}
              style={styles.logo}
              contentFit="contain"
            />
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
            <Text style={styles.eyebrow}>{activeSlide.eyebrow}</Text>
            <Text style={[styles.title, compactHeight && styles.titleCompact]}>
              {activeSlide.titleTop}
              {"\n"}
              <Text style={styles.titleAccent}>{activeSlide.titleAccent}</Text>
              {"\n"}
              {activeSlide.titleBottom}
            </Text>
            <View style={styles.titleRule} />
            <Text
              style={[
                styles.description,
                compactHeight && styles.descriptionCompact,
              ]}
            >
              {activeSlide.description}
            </Text>
          </Animated.View>

          <View style={styles.visualArea}>
            <Animated.View
              style={[
                styles.vanWrap,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }, { scale: imageScale }],
                },
              ]}
            >
              <Image
                key={activeSlide.image}
                source={{ uri: activeSlide.image }}
                style={[styles.vanImage, { height: vanHeight }]}
                contentFit="contain"
                transition={0}
                cachePolicy="memory-disk"
              />
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {SLIDES.map((slide, slideIndex) => (
                <View
                  key={slide.titleBottom}
                  style={[styles.dot, slideIndex === index && styles.dotActive]}
                />
              ))}
            </View>

            <Pressable
              onPress={handleNext}
              onPressIn={() => {
                Animated.spring(buttonScale, {
                  toValue: 0.98,
                  useNativeDriver: true,
                }).start();
              }}
              onPressOut={() => {
                Animated.spring(buttonScale, {
                  toValue: 1,
                  friction: 5,
                  tension: 120,
                  useNativeDriver: true,
                }).start();
              }}
              style={styles.buttonHit}
            >
              <Animated.View
                style={[styles.button, { transform: [{ scale: buttonScale }] }]}
              >
                <LinearGradient
                  colors={["#ffbd45", "#ff9700"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {isLast ? "Start Booking" : "Get Started"}
                  </Text>
                  <View style={styles.buttonIcon}>
                    <Ionicons
                      name={isLast ? "checkmark" : "arrow-forward"}
                      size={23}
                      color="#ffffff"
                    />
                  </View>
                </LinearGradient>
              </Animated.View>
            </Pressable>

            <View style={styles.trustRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={17}
                color="rgba(255,255,255,0.68)"
              />
              <Text style={styles.trustText}>
                Trusted by thousands in London
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffd790",
  },
  panel: {
    flex: 1,
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: NAVY,
    ...Platform.select({
      ios: {
        shadowColor: "#271604",
        shadowOpacity: 0.28,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 14 },
      },
      android: {
        elevation: 14,
      },
    }),
  },
  panelContent: {
    flex: 1,
    paddingHorizontal: 34,
  },
  orbitLarge: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 54,
    borderColor: "rgba(255,159,10,0.12)",
    top: 98,
    right: -122,
  },
  orbitSmall: {
    position: "absolute",
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "rgba(7,20,35,0.88)",
    top: 184,
    right: -32,
  },
  swoosh: {
    position: "absolute",
    width: 460,
    height: 310,
    borderRadius: 230,
    backgroundColor: "rgba(255,167,23,0.38)",
    left: -118,
    bottom: -112,
    transform: [{ rotate: "-17deg" }],
  },
  starTop: {
    position: "absolute",
    top: 66,
    left: 36,
  },
  starMid: {
    position: "absolute",
    top: 232,
    right: 76,
  },
  sparkDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ff2f3d",
    top: 306,
    right: 118,
  },
  brand: {
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 64,
  },
  brandText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
    marginTop: -4,
    letterSpacing: 0,
  },
  copyBlock: {
    alignItems: "flex-start",
    marginTop: 32,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 42,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: 0,
  },
  titleCompact: {
    fontSize: 37,
    lineHeight: 43,
  },
  titleAccent: {
    color: ACCENT,
  },
  titleRule: {
    width: 43,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
    marginTop: 18,
    marginBottom: 18,
  },
  description: {
    width: "82%",
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
  descriptionCompact: {
    fontSize: 14,
    lineHeight: 21,
  },
  visualArea: {
    flex: 1,
    justifyContent: "flex-end",
    minHeight: 220,
    marginHorizontal: -34,
  },
  vanWrap: {
    justifyContent: "flex-end",
    marginBottom: -10,
  },
  vanShadow: {
    position: "absolute",
    alignSelf: "center",
    width: "78%",
    height: 32,
    borderRadius: 80,
    bottom: 24,
    backgroundColor: "rgba(0,0,0,0.26)",
    transform: [{ scaleX: 1.05 }],
  },
  vanImage: {
    width: "108%",
    alignSelf: "center",
  },
  footer: {
    paddingTop: 8,
  },
  dots: {
    height: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  dotActive: {
    backgroundColor: "#ffad19",
  },
  buttonHit: {
    borderRadius: 30,
  },
  button: {
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: "#ff9700",
        shadowOpacity: 0.4,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 7,
      },
    }),
  },
  buttonGradient: {
    minHeight: 61,
    borderRadius: 30,
    paddingLeft: 22,
    paddingRight: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    flex: 1,
    color: "#07111f",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  buttonIcon: {
    width: 51,
    height: 51,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071523",
  },
  trustRow: {
    minHeight: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 12,
  },
  trustText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 13,
    fontWeight: "600",
  },
});

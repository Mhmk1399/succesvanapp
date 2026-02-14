// components/home/ReservationHero.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const ACCENT = "#fe9a00";

const VAN_IMAGES = [
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/louton.png",
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/14seater.png",
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/shortee.png",
];

// ─────────────────────────────────────────────────────────────────
// Van Carousel Component - Smooth infinite loop with drive animation
// ─────────────────────────────────────────────────────────────────
interface VanCarouselProps {
  images: string[];
  imageWidth: number;
  aspectRatio: number;
}

function VanCarousel({ images, imageWidth, aspectRatio }: VanCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation values for smooth transitions
  const driveAnim = useRef(new Animated.Value(width + 100)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  const DISPLAY_DURATION = 3500; // How long van stays visible
  const DRIVE_IN_DURATION = 800;
  const DRIVE_OUT_DURATION = 700;

  // Floating animation while van is displayed
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatAnimation.start();
    return () => floatAnimation.stop();
  }, []);

  // Main carousel animation cycle
  const animateCycle = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Reset position to off-screen right
    driveAnim.setValue(width + 100);
    scaleAnim.setValue(0.85);
    shadowAnim.setValue(0);

    // Phase 1: Drive in from right with spring effect
    Animated.parallel([
      Animated.spring(driveAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: DRIVE_IN_DURATION,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: DRIVE_IN_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Wait while displaying
      setTimeout(() => {
        // Phase 3: Drive out to left
        Animated.parallel([
          Animated.timing(driveAnim, {
            toValue: -width - 100,
            duration: DRIVE_OUT_DURATION,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: DRIVE_OUT_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(shadowAnim, {
            toValue: 0,
            duration: DRIVE_OUT_DURATION / 2,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Update to next image
          setCurrentIndex((prev) => (prev + 1) % images.length);
          setIsAnimating(false);
        });
      }, DISPLAY_DURATION);
    });
  }, [isAnimating, images.length]);

  // Start animation cycle on mount and after each cycle
  useEffect(() => {
    animateCycle();
  }, [currentIndex]);

  // Initial animation on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      animateCycle();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.carouselContainer}>
      {/* Glow effect under the van */}

      {/* Van Image */}
      <Animated.View
        style={[
          styles.vanWrapper,
          {
            transform: [
              { translateX: driveAnim },
              { translateY: floatAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Image
          source={{ uri: images[currentIndex] }}
          style={[
            styles.vanImage,
            { width: imageWidth, aspectRatio: aspectRatio },
          ]}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Hero Component
// ─────────────────────────────────────────────────────────────────
export default function ReservationHero() {
  // Hero entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const descFade = useRef(new Animated.Value(0)).current;
  const badgeFade = useRef(new Animated.Value(0)).current;
  const badgeSlide = useRef(new Animated.Value(-20)).current;
  const statsScale = useRef(new Animated.Value(0.8)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const featuresFade = useRef(new Animated.Value(0)).current;

  // Floating particles
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;

  // Van image dimensions
  const VAN_IMAGE_ASPECT = 220 / 120;
  const vanImageWidth = Math.min(380, width * 0.9);
  const vanOuterHeight = vanImageWidth / VAN_IMAGE_ASPECT + 50;

  useEffect(() => {
    // Staggered entrance animations
    const entranceAnimations = [
      // Badge animation
      Animated.parallel([
        Animated.timing(badgeFade, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.spring(badgeSlide, {
          toValue: 0,
          friction: 8,
          tension: 50,
          delay: 200,
          useNativeDriver: true,
        }),
      ]),
      // Title animation
      Animated.parallel([
        Animated.spring(titleScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Description
      Animated.timing(descFade, {
        toValue: 1,
        duration: 500,
        delay: 400,
        useNativeDriver: true,
      }),
      // Stats
      Animated.parallel([
        Animated.spring(statsScale, {
          toValue: 1,
          friction: 8,
          tension: 60,
          delay: 600,
          useNativeDriver: true,
        }),
        Animated.timing(statsOpacity, {
          toValue: 1,
          duration: 400,
          delay: 600,
          useNativeDriver: true,
        }),
      ]),
      // Features
      Animated.timing(featuresFade, {
        toValue: 1,
        duration: 400,
        delay: 800,
        useNativeDriver: true,
      }),
    ];

    // Main fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      ...entranceAnimations,
    ]).start();

    // Floating particles animation
    const createParticleAnimation = (
      animValue: Animated.Value,
      duration: number
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    createParticleAnimation(particle1, 3000).start();
    createParticleAnimation(particle2, 4000).start();
    createParticleAnimation(particle3, 3500).start();
    createParticleAnimation(particle4, 2800).start();
  }, []);

  // Particle interpolations
  const particle1Style = {
    opacity: particle1.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.7, 0.3],
    }),
    transform: [
      {
        translateY: particle1.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -25],
        }),
      },
      {
        rotate: particle1.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };

  const particle2Style = {
    opacity: particle2.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.2, 0.6, 0.2],
    }),
    transform: [
      {
        translateY: particle2.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -35],
        }),
      },
    ],
  };

  const particle3Style = {
    opacity: particle3.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.4, 0.8, 0.4],
    }),
    transform: [
      {
        translateY: particle3.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -20],
        }),
      },
      {
        scale: particle3.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.3, 1],
        }),
      },
    ],
  };

  const particle4Style = {
    opacity: particle4.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.5, 0.3],
    }),
    transform: [
      {
        translateY: particle4.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -30],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#fe9a00", "#d97706", "#0f172b", "#0f172b"]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Background Elements */}
      <View style={styles.bgPattern}>
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
      </View>

      {/* Floating Particles */}
      <Animated.View
        style={[styles.particle, { top: 80, left: 25 }, particle1Style]}
      >
        <Ionicons name="star" size={14} color={ACCENT} />
      </Animated.View>
      <Animated.View
        style={[styles.particle, { top: 130, right: 35 }, particle2Style]}
      >
        <Ionicons name="sparkles" size={18} color="rgba(254,154,0,0.6)" />
      </Animated.View>
      <Animated.View
        style={[
          styles.particle,
          { top: 200, left: width * 0.7 },
          particle3Style,
        ]}
      >
        <Ionicons name="star" size={12} color="rgba(255,255,255,0.5)" />
      </Animated.View>
      <Animated.View
        style={[styles.particle, { top: 160, left: 60 }, particle4Style]}
      >
        <Ionicons name="ellipse" size={8} color="rgba(254,154,0,0.4)" />
      </Animated.View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.heroInner,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoGlow} />
          <Image
            source={
              "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/new-c.png"
            }
            contentFit="contain"
            style={styles.logo}
          />
        </View>

        {/* Title */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ scale: titleScale }],
          }}
        >
          <Text style={styles.title}>Success Van Hire</Text>
          <View style={styles.titleUnderline} />
        </Animated.View>

        {/* Description */}
        <Animated.Text style={[styles.description, { opacity: descFade }]}>
          Affordable, reliable & fast van rental services across London. Perfect
          for moving, deliveries and business needs.
        </Animated.Text>

        {/* Van Carousel */}
        <View style={[styles.vanOuter, { height: vanOuterHeight }]}>
          <VanCarousel
            images={VAN_IMAGES}
            imageWidth={vanImageWidth}
            aspectRatio={VAN_IMAGE_ASPECT}
          />
        </View>

        {/* Stats Row */}
        <Animated.View
          style={[
            styles.statsRow,
            {
              opacity: statsOpacity,
              transform: [{ scale: statsScale }],
            },
          ]}
        >
          <StatItem number="+50" label="Vans Available" icon="car" />
          <View style={styles.statDivider} />
          <StatItem number="+10K" label="Happy Clients" icon="people" />
          <View style={styles.statDivider} />
          <StatItem number="24/7" label="Support" icon="headset" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Stat Item Component
// ─────────────────────────────────────────────────────────────────
function StatItem({
  number,
  label,
  icon,
}: {
  number: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={16} color={ACCENT} />
      </View>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 35,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    minHeight: height * 0.72,
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(254,154,0,0.08)",
  },
  bgCircle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  bgCircle2: {
    width: 200,
    height: 200,
    bottom: 50,
    left: -80,
  },
  bgCircle3: {
    width: 150,
    height: 150,
    top: "40%",
    right: -50,
  },
  particle: {
    position: "absolute",
    zIndex: 5,
  },
  heroInner: {
    alignItems: "center",
    gap: 14,
    maxWidth: 600,
    zIndex: 10,
    width: "100%",
  },
  logoContainer: {
    marginBottom: 8,
    position: "relative",
  },
  logoGlow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
    }),
  },
  logo: {
    width: 150,
    height: 80,
    borderRadius: 16,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(254,154,0,0.2)",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(254,154,0,0.4)",
    position: "relative",
    overflow: "hidden",
  },
  badgeIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    borderRadius: 999,
  },
  trustText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
    color: "#fff",
    textShadowRadius: 8,
  },
  titleUnderline: {
    height: 4,
    width: 80,
    backgroundColor: ACCENT,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
    }),
  },
  description: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 22,
    fontSize: 14,
    maxWidth: 480,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  vanOuter: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  carouselContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  vanWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  vanImage: {},
  vanGlow: {
    position: "absolute",
    bottom: 20,
    width: "70%",
    height: 30,
    backgroundColor: ACCENT,
    borderRadius: 100,
    opacity: 0.3,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 25,
      },
    }),
  },
  roadLine: {
    position: "absolute",
    bottom: 15,
    width: "90%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 1,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    width: 24,
    backgroundColor: ACCENT,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
      },
    }),
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "rgba(15,23,42,0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  statItem: {
    alignItems: "center",
    minWidth: 80,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(254,154,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statNumber: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 45,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  featureIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(254,154,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "600",
  },
});

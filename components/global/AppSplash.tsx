import {
  View,
  StyleSheet,
  Animated,
  Text,
  Dimensions,
  Easing,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import GlassView from "@/components/global/GlassView";
import { BRAND_LOGO_URI } from "@/constants/branding";

const { width, height } = Dimensions.get("window");
const ACCENT = "#fe9a00";
 const GOLD = "#ffd700";
const WARM = "#ff8c00";

type Props = {
  onFinish: () => void;
};

export default function AppSplash({ onFinish }: Props) {
  /* ═══════════ ANIMATED VALUES ═══════════ */

  // Master
  const masterOpacity = useRef(new Animated.Value(1)).current;

  // Ambient light rays
  const ray1Rotate = useRef(new Animated.Value(0)).current;
  const ray2Rotate = useRef(new Animated.Value(0)).current;
  const raysOpacity = useRef(new Animated.Value(0)).current;

  // Orbs (background bokeh)
  const orb1Scale = useRef(new Animated.Value(0.4)).current;
  const orb1Opacity = useRef(new Animated.Value(0)).current;
  const orb1TranslateY = useRef(new Animated.Value(20)).current;
  const orb2Scale = useRef(new Animated.Value(0.4)).current;
  const orb2Opacity = useRef(new Animated.Value(0)).current;
  const orb2TranslateX = useRef(new Animated.Value(-20)).current;
  const orb3Scale = useRef(new Animated.Value(0.3)).current;
  const orb3Opacity = useRef(new Animated.Value(0)).current;
  const orbPulse1 = useRef(new Animated.Value(1)).current;
  const orbPulse2 = useRef(new Animated.Value(1)).current;

  // Glass card
  const glassScale = useRef(new Animated.Value(0.8)).current;
  const glassOpacity = useRef(new Animated.Value(0)).current;
  const glassTranslateY = useRef(new Animated.Value(60)).current;

  // Logo
  const logoScale = useRef(new Animated.Value(0.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(30)).current;

  // Logo glow rings
  const ring1Scale = useRef(new Animated.Value(0.6)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;

  // Shimmer
  const shimmerX = useRef(new Animated.Value(-width * 0.6)).current;

  // Title
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const titleScale = useRef(new Animated.Value(0.95)).current;

  // Divider line
  const dividerScale = useRef(new Animated.Value(0)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;

  // Subtitle
  const subOpacity = useRef(new Animated.Value(0)).current;
  const subTranslateY = useRef(new Animated.Value(12)).current;

  // Tagline
  const tagOpacity = useRef(new Animated.Value(0)).current;

  // Loading bar
  const loadProgress = useRef(new Animated.Value(0)).current;
  const loadOpacity = useRef(new Animated.Value(0)).current;
  const loadGlow = useRef(new Animated.Value(0.4)).current;

  // Particles
  const [particles] = useState(() => Array.from({ length: 6 }, () => ({
    y: new Animated.Value(height * 0.5 + Math.random() * height * 0.4),
    x: new Animated.Value(Math.random() * width),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0),
  })));

  // Stars
  const [stars] = useState(() => Array.from({ length: 8 }, () => ({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0),
  })));

  // Bottom dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  /* ═══════════ ANIMATION SEQUENCE ═══════════ */

  useEffect(() => {
    // ── Phase 0: Ambient rays spin ──
    Animated.parallel([
      Animated.timing(raysOpacity, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(ray1Rotate, {
          toValue: 1,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.timing(ray2Rotate, {
          toValue: 1,
          duration: 28000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    ]).start();

    // ── Phase 0b: Stars twinkle ──
    stars.forEach((star, i) => {
      const delay = 200 + i * 180;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(star.opacity, {
              toValue: 0.6 + Math.random() * 0.4,
              duration: 800 + Math.random() * 600,
              useNativeDriver: true,
            }),
            Animated.spring(star.scale, {
              toValue: 1,
              tension: 50,
              friction: 5,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(500 + Math.random() * 1000),
          Animated.parallel([
            Animated.timing(star.opacity, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(star.scale, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(Math.random() * 2000),
        ]),
      ).start();
    });

    // ── Phase 1: Orbs bloom ──
    Animated.stagger(150, [
      Animated.parallel([
        Animated.spring(orb1Scale, {
          toValue: 1,
          tension: 18,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(orb1Opacity, {
          toValue: 0.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(orb1TranslateY, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(orb2Scale, {
          toValue: 1,
          tension: 18,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(orb2Opacity, {
          toValue: 0.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(orb2TranslateX, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(orb3Scale, {
          toValue: 1,
          tension: 18,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(orb3Opacity, {
          toValue: 0.05,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Orb breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse1, {
          toValue: 1.12,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbPulse1, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse2, {
          toValue: 1.1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbPulse2, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // ── Phase 2: Glass card ──
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(glassScale, {
          toValue: 1,
          tension: 45,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(glassOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(glassTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // ── Phase 3: Logo ──
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.3)),
          useNativeDriver: true,
        }),
      ]).start();
    }, 350);

    // ── Phase 3b: Glow rings ──
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(ring1Scale, {
          toValue: 1,
          tension: 25,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(ring1Opacity, {
          toValue: 0.5,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(ring2Scale, {
          toValue: 1,
          tension: 22,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(ring2Opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();

      // Ring pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringPulse, {
            toValue: 1.08,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(ringPulse, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }, 500);

    // ── Phase 3c: Shimmer ──
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerX, {
            toValue: width * 0.6,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shimmerX, {
            toValue: -width * 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(2500),
        ]),
      ).start();
    }, 800);

    // ── Phase 4: Title ──
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 700);

    // ── Phase 5: Divider ──
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(dividerScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(dividerOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 950);

    // ── Phase 6: Subtitle ──
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(subOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(subTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1100);

    // ── Phase 7: Loading bar ──
    setTimeout(() => {
      Animated.timing(loadOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      Animated.timing(loadProgress, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadGlow, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(loadGlow, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }, 1250);

    // ── Phase 7b: Bottom tag ──
    setTimeout(() => {
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1400);

    // ── Phase 8: Floating particles ──
    particles.forEach((p, i) => {
      const delay = 600 + i * 300;
      const dur = 3000 + Math.random() * 2000;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(p.y, {
              toValue: -50,
              duration: dur,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.parallel([
                Animated.timing(p.opacity, {
                  toValue: 0.7,
                  duration: dur * 0.25,
                  useNativeDriver: true,
                }),
                Animated.spring(p.scale, {
                  toValue: 1,
                  tension: 40,
                  friction: 6,
                  useNativeDriver: true,
                }),
              ]),
              Animated.parallel([
                Animated.timing(p.opacity, {
                  toValue: 0,
                  duration: dur * 0.75,
                  useNativeDriver: true,
                }),
                Animated.timing(p.scale, {
                  toValue: 0.3,
                  duration: dur * 0.75,
                  useNativeDriver: true,
                }),
              ]),
            ]),
          ]),
          Animated.parallel([
            Animated.timing(p.y, {
              toValue: height * 0.5 + Math.random() * height * 0.4,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(p.scale, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();
    });

    // ── Phase 9: Loading dots ──
    const dotBounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 350,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(500),
        ]),
      );
    setTimeout(() => {
      dotBounce(dot1, 0).start();
      dotBounce(dot2, 120).start();
      dotBounce(dot3, 240).start();
    }, 1300);

    // ── EXIT ──
    const exitTimeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(glassTranslateY, {
          toValue: -30,
          duration: 500,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(glassScale, {
          toValue: 0.95,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(glassOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(masterOpacity, {
          toValue: 0,
          duration: 700,
          delay: 150,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(onFinish);
    }, 3500);

    return () => clearTimeout(exitTimeout);
  }, [onFinish]);

  /* ═══════════ INTERPOLATIONS ═══════════ */

  const ray1Spin = ray1Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const ray2Spin = ray2Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });

  /* ═══════════ STAR POSITIONS ═══════════ */
  const starPositions = [
    { top: "8%", left: "12%" },
    { top: "15%", right: "18%" },
    { top: "25%", left: "8%" },
    { top: "35%", right: "10%" },
    { top: "55%", left: "15%" },
    { top: "65%", right: "12%" },
    { top: "78%", left: "22%" },
    { top: "85%", right: "20%" },
  ];

  return (
    <Animated.View style={[styles.container, { opacity: masterOpacity }]}>
      {/* ── Deep luxury gradient ── */}
      <LinearGradient
        colors={["#020617", "#0a0f2e", "#0f172a", "#080c20", "#020617"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Ambient light rays ── */}
      <Animated.View
        style={[
          styles.rayContainer,
          {
            opacity: raysOpacity,
            transform: [{ rotate: ray1Spin }],
          },
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(254,154,0,0.03)", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.ray}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.rayContainer,
          {
            opacity: raysOpacity,
            transform: [{ rotate: ray2Spin }],
          },
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,215,0,0.02)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.ray}
        />
      </Animated.View>

      {/* ── Stars ── */}
      {stars.map((star, i) => (
        <Animated.View
          key={`star-${i}`}
          style={[
            styles.star,
            starPositions[i] as any,
            {
              opacity: star.opacity,
              transform: [{ scale: star.scale }],
            },
          ]}
        />
      ))}

      {/* ── Background orbs ── */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          {
            opacity: orb1Opacity,
            transform: [
              { scale: Animated.multiply(orb1Scale, orbPulse1) },
              { translateY: orb1TranslateY },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[ACCENT, "rgba(254,154,0,0)"]}
          style={styles.orbGradient}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.orb,
          styles.orb2,
          {
            opacity: orb2Opacity,
            transform: [
              { scale: Animated.multiply(orb2Scale, orbPulse2) },
              { translateX: orb2TranslateX },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[WARM, "rgba(255,140,0,0)"]}
          style={styles.orbGradient}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.orb,
          styles.orb3,
          {
            opacity: orb3Opacity,
            transform: [{ scale: Animated.multiply(orb3Scale, orbPulse1) }],
          },
        ]}
      >
        <LinearGradient
          colors={[GOLD, "rgba(255,215,0,0)"]}
          style={styles.orbGradient}
        />
      </Animated.View>

      {/* ── Floating particles ── */}
      {particles.map((p, i) => (
        <Animated.View
          key={`particle-${i}`}
          style={[
            styles.particle,
            {
              left: 10 + i * width * 0.15,
              opacity: p.opacity,
              transform: [{ translateY: p.y }, { scale: p.scale }],
            },
          ]}
        >
          <View
            style={[
              styles.particleDot,
              i % 3 === 0 && styles.particleDotLg,
              i % 3 === 1 && styles.particleDotMd,
            ]}
          />
        </Animated.View>
      ))}

      {/* ══════ GLASS CARD ══════ */}
      <Animated.View
        style={[
          styles.glassCardOuter,
          {
            opacity: glassOpacity,
            transform: [{ scale: glassScale }, { translateY: glassTranslateY }],
          },
        ]}
      >
        {/* Outer glow */}
        <View style={styles.glassGlowOuter} />

        <GlassView
          intensity={Platform.OS === "ios" ? 40 : 20}
          tint="dark"
          style={styles.glassCard}
        >
          {/* Glass inner overlay */}
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.08)",
              "rgba(255,255,255,0.03)",
              "rgba(255,255,255,0.01)",
              "rgba(255,255,255,0.04)",
            ]}
            locations={[0, 0.3, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassOverlay}
          />

          {/* Top edge highlight */}
          <LinearGradient
            colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0)"]}
            style={styles.glassTopEdge}
          />

          {/* ── Glow Rings ── */}
          <Animated.View
            style={[
              styles.ring,
              styles.ring1,
              {
                opacity: ring1Opacity,
                transform: [
                  { scale: Animated.multiply(ring1Scale, ringPulse) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              styles.ring2,
              {
                opacity: ring2Opacity,
                transform: [
                  { scale: Animated.multiply(ring2Scale, ringPulse) },
                ],
              },
            ]}
          />

          {/* ── Logo ── */}
          <Animated.View
            style={[
              styles.logoWrap,
              {
                opacity: logoOpacity,
                transform: [
                  { scale: logoScale },
                  { translateY: logoTranslateY },
                ],
              },
            ]}
          >
            <View style={styles.logoShadow} />
            <View style={styles.logoBorder}>
              <LinearGradient
                colors={[
                  "rgba(254,154,0,0.3)",
                  "rgba(254,154,0,0.1)",
                  "rgba(254,154,0,0.25)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBorderGradient}
              />
              <View style={styles.logoInner}>
                <Image
                  source={{ uri: BRAND_LOGO_URI }}
                  style={styles.logoImage}
                  contentFit="contain"
                  transition={200}
                />

                {/* Shimmer */}
                <Animated.View
                  style={[
                    styles.shimmer,
                    { transform: [{ translateX: shimmerX }] },
                  ]}
                >
                  <LinearGradient
                    colors={[
                      "transparent",
                      "rgba(255,255,255,0.06)",
                      "rgba(255,255,255,0.14)",
                      "rgba(255,255,255,0.06)",
                      "transparent",
                    ]}
                    start={{ x: 0, y: 0.3 }}
                    end={{ x: 1, y: 0.7 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
              </View>
            </View>
          </Animated.View>

          {/* ── Title ── */}
          <Animated.View
            style={[
              styles.titleWrap,
              {
                opacity: titleOpacity,
                transform: [
                  { translateY: titleTranslateY },
                  { scale: titleScale },
                ],
              },
            ]}
          >
            <Text style={styles.title}>Success Van Hire</Text>
          </Animated.View>

          {/* ── Divider ── */}
          <Animated.View
            style={[
              styles.divider,
              {
                opacity: dividerOpacity,
                transform: [{ scaleX: dividerScale }],
              },
            ]}
          >
            <LinearGradient
              colors={["transparent", ACCENT, GOLD, ACCENT, "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.dividerGradient}
            />
          </Animated.View>

          {/* ── Subtitle ── */}
          <Animated.View
            style={{
              opacity: subOpacity,
              transform: [{ translateY: subTranslateY }],
            }}
          >
            <Text style={styles.subtitle}>YOUR MOVING SOLUTION</Text>
          </Animated.View>

          {/* ── Loading Bar ── */}
          <Animated.View style={[styles.loadBarWrap, { opacity: loadOpacity }]}>
            <View style={styles.loadBarTrack}>
              <Animated.View
                style={[
                  styles.loadBarFill,
                  {
                    width: loadProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={[ACCENT, GOLD, ACCENT]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Animated.View
                  style={[styles.loadBarGlow, { opacity: loadGlow }]}
                />
              </Animated.View>
            </View>
          </Animated.View>
        </GlassView>
      </Animated.View>

      {/* ── Bottom dots ── */}
      <View style={styles.dotsWrap}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={`dot-${i}`}
            style={[
              styles.dot,
              {
                opacity: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 1],
                }),
                transform: [
                  {
                    translateY: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -6],
                    }),
                  },
                  {
                    scale: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1.15],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* ── Bottom tag ── */}
      <Animated.View style={[styles.bottomTag, { opacity: tagOpacity }]}>
        <View style={styles.bottomTagLine} />
        <Text style={styles.bottomTagText}>POWERED BY AI</Text>
        <View style={styles.bottomTagLine} />
      </Animated.View>
    </Animated.View>
  );
}

/* ═══════════ STYLES ═══════════ */

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  /* Rays */
  rayContainer: {
    position: "absolute",
    width: width * 2,
    height: height * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ray: {
    width: "100%",
    height: "100%",
  },

  /* Stars */
  star: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
      },
    }),
  },

  /* Orbs */
  orb: {
    position: "absolute",
    borderRadius: 999,
    overflow: "hidden",
  },
  orb1: {
    width: 380,
    height: 380,
    top: -120,
    right: -100,
  },
  orb2: {
    width: 300,
    height: 300,
    bottom: -80,
    left: -80,
  },
  orb3: {
    width: 220,
    height: 220,
    top: "38%",
    left: -50,
  },
  orbGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },

  /* Particles */
  particle: {
    position: "absolute",
  },
  particleDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: ACCENT,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
    }),
  },
  particleDotLg: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: GOLD,
  },
  particleDotMd: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fff",
  },

  /* Glass Card */
  glassCardOuter: {
    width: width * 0.85,
    maxWidth: 380,
    alignItems: "center",
  },
  glassGlowOuter: {
    position: "absolute",
    width: "110%",
    height: "110%",
    borderRadius: 36,
    backgroundColor: "rgba(254,154,0,0.04)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 40,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  glassCard: {
    width: "100%",
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor:
      Platform.OS === "android" ? "rgba(15,23,42,0.85)" : undefined,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  glassTopEdge: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
  },

  /* Rings */
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  ring1: {
    width: 200,
    height: 200,
    top: -20,
    borderColor: "rgba(254,154,0,0.08)",
  },
  ring2: {
    width: 260,
    height: 260,
    top: -50,
    borderColor: "rgba(255,215,0,0.05)",
  },

  /* Logo */
  logoWrap: {
    marginBottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  logoShadow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 40,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.35,
        shadowRadius: 32,
        backgroundColor: "rgba(254,154,0,0.1)",
      },
      android: {
        elevation: 20,
        backgroundColor: "rgba(254,154,0,0.08)",
      },
    }),
  },
  logoBorder: {
    width: 130,
    height: 130,
    borderRadius: 36,
    padding: 2,
    overflow: "hidden",
  },
  logoBorderGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
  },
  logoInner: {
    flex: 1,
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "#0f172a",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 100,
  },

  /* Title */
  titleWrap: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
    textAlign: "center",
    ...Platform.select({
      ios: {
        textShadowColor: "rgba(254,154,0,0.2)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 12,
      },
    }),
  },

  /* Divider */
  divider: {
    width: 56,
    height: 2,
    marginBottom: 14,
    overflow: "hidden",
    borderRadius: 1,
  },
  dividerGradient: {
    width: "100%",
    height: "100%",
  },

  /* Subtitle */
  subtitle: {
    fontSize: 11,
    color: "rgba(203,213,225,0.6)",
    fontWeight: "700",
    letterSpacing: 5,
    textAlign: "center",
    marginBottom: 28,
  },

  /* Loading Bar */
  loadBarWrap: {
    width: "80%",
    alignItems: "center",
  },
  loadBarTrack: {
    width: "100%",
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  loadBarFill: {
    height: "100%",
    borderRadius: 1.5,
    overflow: "hidden",
  },
  loadBarGlow: {
    position: "absolute",
    right: 0,
    top: -4,
    bottom: -4,
    width: 20,
    borderRadius: 10,
    backgroundColor: ACCENT,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
    }),
  },

  /* Bottom dots */
  dotsWrap: {
    position: "absolute",
    bottom: 80,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  /* Bottom tag */
  bottomTag: {
    position: "absolute",
    bottom: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bottomTagLine: {
    width: 16,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(148,163,184,0.25)",
  },
  bottomTagText: {
    fontSize: 9,
    color: "rgba(148,163,184,0.4)",
    fontWeight: "700",
    letterSpacing: 3,
  },
});

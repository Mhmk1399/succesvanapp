import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route: "/" | "/vans" | "/dashboard";
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: "home-outline", activeIcon: "home", route: "/" },
  {
    label: "Reserve",
    icon: "add-circle-sharp",
    activeIcon: "add-circle",
    route: "/vans",
  },
  {
    label: "Profile",
    icon: "person-outline",
    activeIcon: "person",
    route: "/dashboard",
  },
];

const ACCENT = "#fe9800ff";
const ITEM_WIDTH = 50;
const ITEM_HEIGHT = 40;
const GAP = 6;

export default function DynamicIsland() {
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = NAV_ITEMS.findIndex((item) => item.route === pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("authToken");
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, [pathname]);

  // Main animations
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Indicator animations
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorScale = useRef(new Animated.Value(1)).current;
  const indicatorOpacity = useRef(new Animated.Value(1)).current;

  // Per-item animations
  const itemAnims = useRef(
    NAV_ITEMS.map((_, i) => ({
      scale: new Animated.Value(1),
      iconScale: new Animated.Value(i === activeIndex ? 1.15 : 0.8),
      iconRotate: new Animated.Value(0),
      iconTranslateY: new Animated.Value(0),
      glowOpacity: new Animated.Value(i === activeIndex ? 1 : 0),
      glowScale: new Animated.Value(1),
      pressScale: new Animated.Value(1),
    }))
  ).current;

  const prevIndexRef = useRef(activeIndex);

  // Calculate indicator position - centered properly
  const getIndicatorPosition = (index: number) => {
    const padding = 8; // Inner padding
    return padding + index * (ITEM_WIDTH + GAP);
  };

  // Entrance animation
  useEffect(() => {
    Animated.spring(entranceAnim, {
      toValue: 1,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start(() => {
      // Start continuous animations
      startContinuousAnimations();
    });

    // Set initial indicator position
    if (activeIndex >= 0) {
      indicatorX.setValue(getIndicatorPosition(activeIndex));
    }
  }, []);

  const startContinuousAnimations = () => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle pulse for active indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Glow pulse for active item
    if (activeIndex >= 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(itemAnims[activeIndex].glowScale, {
            toValue: 1.1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(itemAnims[activeIndex].glowScale, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  };

  // Handle route changes
  useEffect(() => {
    const prevIndex = prevIndexRef.current;
    prevIndexRef.current = activeIndex;

    if (prevIndex !== activeIndex && prevIndex >= 0 && activeIndex >= 0) {
      const direction = activeIndex > prevIndex ? 1 : -1;

      // Enhanced haptic pattern
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Indicator slide with overshoot
      Animated.sequence([
        // Move to position with slight overshoot
        Animated.timing(indicatorX, {
          toValue: getIndicatorPosition(activeIndex) + direction * 8,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        // Settle to final position
        Animated.spring(indicatorX, {
          toValue: getIndicatorPosition(activeIndex),
          tension: 200,
          friction: 15,
          useNativeDriver: true,
        }),
      ]).start();

      // Indicator squeeze effect
      Animated.sequence([
        Animated.timing(indicatorScale, {
          toValue: 1.12,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(indicatorScale, {
          toValue: 1,
          tension: 200,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();

      // Brief opacity flash
      Animated.sequence([
        Animated.timing(indicatorOpacity, {
          toValue: 0.7,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(indicatorOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();

      // Deactivate previous item
      Animated.parallel([
        // Scale down icon
        Animated.spring(itemAnims[prevIndex].iconScale, {
          toValue: 1,
          tension: 200,
          friction: 12,
          useNativeDriver: true,
        }),
        // Fade out glow
        Animated.timing(itemAnims[prevIndex].glowOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Activate current item
      Animated.parallel([
        // Icon bounce up
        Animated.sequence([
          Animated.timing(itemAnims[activeIndex].iconTranslateY, {
            toValue: -8,
            duration: 150,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(itemAnims[activeIndex].iconTranslateY, {
            toValue: 0,
            tension: 400,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Icon scale pop
        Animated.sequence([
          Animated.timing(itemAnims[activeIndex].iconScale, {
            toValue: 1.35,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(itemAnims[activeIndex].iconScale, {
            toValue: 1.15,
            tension: 200,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Icon wiggle
        Animated.sequence([
          Animated.timing(itemAnims[activeIndex].iconRotate, {
            toValue: direction * 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(itemAnims[activeIndex].iconRotate, {
            toValue: 0,
            tension: 400,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Fade in glow
        Animated.timing(itemAnims[activeIndex].glowOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeIndex]);

  const handlePressIn = useCallback((index: number) => {
    Haptics.selectionAsync();
    Animated.parallel([
      Animated.spring(itemAnims[index].pressScale, {
        toValue: 0.85,
        tension: 400,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(itemAnims[index].scale, {
        toValue: 0.9,
        tension: 400,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressOut = useCallback((index: number) => {
    Animated.parallel([
      Animated.spring(itemAnims[index].pressScale, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(itemAnims[index].scale, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = useCallback(
    async (route: string, index: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Quick tap animation
      Animated.sequence([
        Animated.timing(itemAnims[index].scale, {
          toValue: 0.8,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.spring(itemAnims[index].scale, {
          toValue: 1,
          tension: 400,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Check auth for dashboard route
      if (route === "/dashboard") {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          router.push("/register" as any);
          return;
        }
      }

      router.push(route as any);
    },
    [router]
  );

  const renderNavItem = (item: NavItem, index: number) => {
    const isActive = activeIndex === index;

    // Change icon for Profile/Login based on auth status
    let displayIcon = item.icon;
    let displayActiveIcon = item.activeIcon;
    if (item.route === "/dashboard" && !isAuthenticated) {
      displayIcon = "log-in-outline";
      displayActiveIcon = "log-in";
    }

    const iconRotation = itemAnims[index].iconRotate.interpolate({
      inputRange: [-10, 0, 10],
      outputRange: ["-10deg", "0deg", "10deg"],
    });

    return (
      <Animated.View
        key={item.route}
        style={[
          styles.itemWrapper,
          {
            transform: [{ scale: itemAnims[index].scale }],
          },
        ]}
      >
        <Pressable
          onPress={() => handlePress(item.route, index)}
          onPressIn={() => handlePressIn(index)}
          onPressOut={() => handlePressOut(index)}
          style={styles.item}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: isActive }}
        >
          {/* Icon glow effect */}

          {/* Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [
                  {
                    scale: Animated.multiply(
                      itemAnims[index].iconScale,
                      itemAnims[index].pressScale
                    ),
                  },
                  { translateY: itemAnims[index].iconTranslateY },
                  { rotate: iconRotation },
                ],
              },
            ]}
          >
            <Ionicons
              name={isActive ? displayActiveIcon : displayIcon}
              size={isActive ? 24 : 22}
              color={isActive ? ACCENT : "rgba(255,255,255,0.3)"}
            />
          </Animated.View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: entranceAnim,
        },
      ]}
    >
      <View style={styles.islandWrapper}>
        <BlurView intensity={85} tint="dark" style={styles.island}>
          {/* Glass highlight */}
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.15)",
              "rgba(255,255,255,0.05)",
              "transparent",
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.7 }}
            style={styles.glassHighlight}
          />

          <View style={styles.inner}>
            {/* Active indicator background */}
            <Animated.View
              style={[
                styles.indicator,
                {
                  opacity: indicatorOpacity,
                  transform: [
                    { translateX: indicatorX },
                    { scale: Animated.multiply(indicatorScale, pulseAnim) },
                  ],
                },
              ]}
            ></Animated.View>

            {/* Nav Items */}
            {NAV_ITEMS.map((item, index) => renderNavItem(item, index))}
          </View>

          {/* Inner border */}
          <View style={styles.innerBorder} />
        </BlurView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },

  islandWrapper: {
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(254,154,0,0.3)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  island: {
    borderRadius: 28,
    overflow: "hidden",
  },
  glassHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 35,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    pointerEvents: "none",
  },
  inner: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: GAP,
    position: "relative",
    alignItems: "center",
  },
  indicator: {
    position: "absolute",
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
  },
  indicatorGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  indicatorBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  itemWrapper: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  item: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  iconGlow: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
      },
    }),
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
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

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route: "/" | "/vans" | "/bookings";
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: "home-outline", activeIcon: "home", route: "/" },
  {
    label: "Reserve",
    icon: "add-circle-outline",
    activeIcon: "add-circle",
    route: "/bookings",
  },
  {
    label: "Profile",
    icon: "person-outline",
    activeIcon: "person",
    route: "/vans",
  },
];

const ACCENT = "#fe9a00";
const ITEM_WIDTH = 70;

export default function DynamicIsland() {
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = NAV_ITEMS.findIndex((item) => item.route === pathname);

  // Animations - ALL using useNativeDriver: true
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Indicator animation
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorScale = useRef(new Animated.Value(1)).current;

  // Per-item animations
  const itemAnims = useRef(
    NAV_ITEMS.map((_, i) => ({
      scale: new Animated.Value(1),
      iconScale: new Animated.Value(i === activeIndex ? 1.1 : 1),
      iconTranslateY: new Animated.Value(0),
      labelOpacity: new Animated.Value(i === activeIndex ? 1 : 0),
      labelTranslateY: new Animated.Value(i === activeIndex ? 0 : 5),
      pressScale: new Animated.Value(1),
    }))
  ).current;

  const prevIndexRef = useRef(activeIndex);

  // Calculate indicator position
  const getIndicatorPosition = (index: number) => {
    return index * (ITEM_WIDTH + 4);
  };

  // Entrance animation
  useEffect(() => {
    Animated.spring(entranceAnim, {
      toValue: 1,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start(() => {
      // Start floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Set initial indicator position
    if (activeIndex >= 0) {
      indicatorX.setValue(getIndicatorPosition(activeIndex));
    }
  }, []);

  // Handle route changes
  useEffect(() => {
    const prevIndex = prevIndexRef.current;
    prevIndexRef.current = activeIndex;

    if (prevIndex !== activeIndex && prevIndex >= 0 && activeIndex >= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Animate indicator position
      Animated.spring(indicatorX, {
        toValue: getIndicatorPosition(activeIndex),
        tension: 150,
        friction: 15,
        useNativeDriver: true, // ✅ Native driver
      }).start();

      // Elastic scale effect for indicator
      Animated.sequence([
        Animated.timing(indicatorScale, {
          toValue: 1.08,
          duration: 100,
          useNativeDriver: true, // ✅ Native driver
        }),
        Animated.spring(indicatorScale, {
          toValue: 1,
          tension: 200,
          friction: 12,
          useNativeDriver: true, // ✅ Native driver
        }),
      ]).start();

      // Collapse previous item
      Animated.parallel([
        Animated.spring(itemAnims[prevIndex].iconScale, {
          toValue: 1,
          tension: 200,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(itemAnims[prevIndex].labelOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(itemAnims[prevIndex].labelTranslateY, {
          toValue: 5,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Expand current item
      Animated.parallel([
        // Icon bounce
        Animated.sequence([
          Animated.timing(itemAnims[activeIndex].iconTranslateY, {
            toValue: -6,
            duration: 120,
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
        // Icon scale
        Animated.sequence([
          Animated.timing(itemAnims[activeIndex].iconScale, {
            toValue: 1.25,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(itemAnims[activeIndex].iconScale, {
            toValue: 1.1,
            tension: 200,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Label fade in
        Animated.sequence([
          Animated.delay(80),
          Animated.parallel([
            Animated.timing(itemAnims[activeIndex].labelOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(itemAnims[activeIndex].labelTranslateY, {
              toValue: 0,
              tension: 200,
              friction: 12,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }
  }, [activeIndex]);

  const handlePressIn = useCallback((index: number) => {
    Haptics.selectionAsync();
    Animated.spring(itemAnims[index].pressScale, {
      toValue: 0.9,
      tension: 400,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressOut = useCallback((index: number) => {
    Animated.spring(itemAnims[index].pressScale, {
      toValue: 1,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = useCallback(
    (route: string, index: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Animated.sequence([
        Animated.timing(itemAnims[index].scale, {
          toValue: 0.85,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.spring(itemAnims[index].scale, {
          toValue: 1,
          tension: 400,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      router.push(route as any);
    },
    [router]
  );

  const renderNavItem = (item: NavItem, index: number) => {
    const isActive = activeIndex === index;

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
          <Animated.View
            style={[
              styles.itemContent,
              {
                transform: [{ scale: itemAnims[index].pressScale }],
              },
            ]}
          >
            {/* Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [
                    { scale: itemAnims[index].iconScale },
                    { translateY: itemAnims[index].iconTranslateY },
                  ],
                },
              ]}
            >
              <Ionicons
                name={isActive ? item.activeIcon : item.icon}
                size={22}
                color={isActive ? ACCENT : "rgba(255,255,255,0.5)"}
              />
            </Animated.View>

            {/* Label (only visible when active) */}
            <Animated.View
              style={[
                styles.labelContainer,
                {
                  opacity: itemAnims[index].labelOpacity,
                  transform: [{ translateY: itemAnims[index].labelTranslateY }],
                },
              ]}
            >
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    );
  };

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: entranceAnim,
          transform: [
            {
              translateY: Animated.add(
                entranceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [60, 0],
                }),
                floatY
              ),
            },
          ],
        },
      ]}
    >
      {/* Ambient glow */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            opacity: entranceAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.4],
            }),
          },
        ]}
      />

      <View style={styles.islandWrapper}>
        <BlurView intensity={80} tint="dark" style={styles.island}>
          {/* Glass highlight */}
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.12)",
              "rgba(255,255,255,0.04)",
              "transparent",
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            style={styles.glassHighlight}
          />

          <View style={styles.inner}>
            {/* Active indicator background - Fixed width, uses scaleX for effect */}
            <Animated.View
              style={[
                styles.indicator,
                {
                  transform: [
                    { translateX: indicatorX },
                    { scaleX: indicatorScale },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={["rgba(254,154,0,0.25)", "rgba(254,154,0,0.1)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.indicatorGradient}
              />
              <View style={styles.indicatorBorder} />
            </Animated.View>

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
    zIndex: 100,
  },
  ambientGlow: {
    position: "absolute",
    width: 200,
    height: 50,
    backgroundColor: ACCENT,
    borderRadius: 25,
    top: 10,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 25,
      },
    }),
  },
  islandWrapper: {
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  island: {
    borderRadius: 26,
    overflow: "hidden",
  },
  glassHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    pointerEvents: "none",
  },
  inner: {
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 8,
    gap: 4,
    position: "relative",
    alignItems: "center",
  },
  indicator: {
    position: "absolute",
    left: 6,
    width: ITEM_WIDTH,
    height: 52,
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
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  itemWrapper: {
    width: ITEM_WIDTH,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  item: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

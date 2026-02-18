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
import { useRouter, usePathname, Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";

/* ═══════════════════════  ICONS  ═══════════════════════ */

const VanIcon = ({ size = 26, color = "#fff", filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512">
    <Path
      d="m465.532 242.313-28.08-13.505-37.568-67.507c-7.415-13.323-20.945-21.277-36.193-21.277h-215.023c-22.84 0-41.421 18.581-41.421 41.42v147.86c0 4.418 3.582 8 8 8h25.785c3.757 19.716 21.114 34.671 41.908 34.671 20.793 0 38.151-14.955 41.908-34.671h140.051c3.757 19.716 21.114 34.671 41.908 34.671s38.152-14.955 41.909-34.671h32.284c4.418 0 8-3.582 8-8v-49.663c0-16.305-8.773-30.26-23.468-37.328zm-47.443-15.395h-36.313l-13.51-9.322c-1.336-.922-2.921-1.416-4.544-1.416h-32.93v-26.638h66.497zm-235.149 129.058c-14.706 0-26.671-11.965-26.671-26.671s11.965-26.671 26.671-26.671 26.671 11.965 26.671 26.671-11.965 26.671-26.671 26.671zm223.867 0c-14.706 0-26.671-11.965-26.671-26.671s11.965-26.671 26.671-26.671c14.707 0 26.672 11.965 26.672 26.671s-11.965 26.671-26.672 26.671zm66.193-34.671h-24.285c-3.757-19.716-21.115-34.671-41.909-34.671s-38.151 14.955-41.908 34.671h-140.05c-3.757-19.716-21.114-34.671-41.908-34.671s-38.151 14.955-41.908 34.671h-17.785v-139.86c0-14.017 11.403-25.42 25.421-25.42h215.022c9.498 0 17.594 4.76 22.213 13.059l2.481 4.459h-65.593c-4.418 0-8 3.582-8 8v42.638c0 4.418 3.582 8 8 8h38.438l13.51 9.322c1.336.922 2.921 1.416 4.544 1.416h50.59l28.725 13.815c9.019 4.337 14.402 12.9 14.402 22.908zm-190.991-86.387c0 4.418-3.582 8-8 8h-132.75c-4.418 0-8-3.582-8-8s3.582-8 8-8h132.75c4.418 0 8 3.582 8 8zm-191.118-81.277c0 4.418-3.582 8-8 8h-51.891c-4.418 0-8-3.582-8-8s3.582-8 8-8h51.891c4.418 0 8 3.582 8 8zm0 69.869c0 4.418-3.582 8-8 8h-38.764c-4.418 0-8-3.582-8-8s3.582-8 8-8h38.764c4.418 0 8 3.582 8 8zm0 69.869c0 4.418-3.582 8-8 8h-26.78c-4.418 0-8-3.582-8-8s3.582-8 8-8h26.779c4.419 0 8.001 3.582 8.001 8z"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={filled ? 0 : 8}
    />
  </Svg>
);

const HomeIcon = ({ size = 26, color = "#fff", filled = false }) => (
  <Svg width={size} height={size} viewBox="0 1 511 511.999">
    <Path
      d="m498.699219 222.695312c-.015625-.011718-.027344-.027343-.039063-.039062l-208.855468-208.847656c-8.902344-8.90625-20.738282-13.808594-33.328126-13.808594-12.589843 0-24.425781 4.902344-33.332031 13.808594l-208.746093 208.742187c-.070313.070313-.144532.144531-.210938.214844-18.28125 18.386719-18.25 48.21875.089844 66.558594 8.378906 8.382812 19.441406 13.234375 31.273437 13.746093.484375.046876.96875.070313 1.457031.070313h8.320313v153.695313c0 30.417968 24.75 55.164062 55.167969 55.164062h81.710937c8.285157 0 15-6.71875 15-15v-120.5c0-13.878906 11.292969-25.167969 25.171875-25.167969h48.195313c13.878906 0 25.167969 11.289063 25.167969 25.167969v120.5c0 8.28125 6.714843 15 15 15h81.710937c30.421875 0 55.167969-24.746094 55.167969-55.164062v-153.695313h7.71875c12.585937 0 24.421875-4.902344 33.332031-13.8125 18.359375-18.367187 18.367187-48.253906.027344-66.632813zm-21.242188 45.421876c-3.238281 3.238281-7.542969 5.023437-12.117187 5.023437h-22.71875c-8.285156 0-15 6.714844-15 15v168.695313c0 13.875-11.289063 25.164062-25.167969 25.164062h-66.710937v-105.5c0-30.417969-24.746094-55.167969-55.167969-55.167969h-48.195313c-30.421875 0-55.171875 24.75-55.171875 55.167969v105.5h-66.710937c-13.875 0-25.167969-11.289062-25.167969-25.164062v-168.695313c0-8.285156-6.714844-15-15-15h-22.328125c-.234375-.015625-.464844-.027344-.703125-.03125-4.46875-.078125-8.660156-1.851563-11.800781-4.996094-6.679688-6.679687-6.679688-17.550781 0-24.234375.003906 0 .003906-.003906.007812-.007812l.011719-.011719 208.847656-208.839844c3.234375-3.238281 7.535157-5.019531 12.113281-5.019531 4.574219 0 8.875 1.78125 12.113282 5.019531l208.800781 208.796875c.03125.03125.066406.0625.097656.09375 6.644531 6.691406 6.632813 17.539063-.03125 24.207032zm0 0"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={filled ? 0 : 12}
    />
  </Svg>
);

const ProfileIcon = ({ size = 26, color = "#fff", filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="m11.4 93.3c-.1 0-.1 0-.2 0-1.3-.1-2.2-1.2-2.1-2.4 1.3-19.1 19.3-34 40.9-34s39.6 14.9 40.9 33.9c.1 1.3-.9 2.3-2.1 2.4-1.3.1-2.3-.9-2.4-2.1-1.2-16.7-17.2-29.7-36.4-29.7-19.3 0-35.3 13.1-36.4 29.8-.1 1.2-1.1 2.1-2.2 2.1z"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={filled ? 0 : 1}
    />
    <Path
      d="m50 52.3c-12.6 0-22.8-10.2-22.8-22.8s10.2-22.8 22.8-22.8 22.8 10.2 22.8 22.8-10.2 22.8-22.8 22.8zm0-41c-10 0-18.2 8.2-18.2 18.2s8.2 18.2 18.2 18.2 18.2-8.2 18.2-18.2-8.2-18.2-18.2-18.2z"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={filled ? 0 : 1}
    />
  </Svg>
);

const LoginIcon = ({ size = 26, color = "#fff", filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 8.4666667 8.4666667">
    <Path
      d="m2.9102882-.0000016c-.441363 0-.792717.35755-.792717.79270997v2.11718993c0 .3607801.5291671.3607801.5291671 0v-2.11718993c0-.15114998.1196279-.26354998.2635499-.26354998h4.76405c.1511551 0 .2635498.12273.2635498.26354998v6.88123993c0 .1428901-.1123947.2635501-.2635498.2635501h-4.76405c-.1511559 0-.2635499-.12066-.2635499-.2635501v-2.11719c0-.3502898-.5291671-.35545-.5291671 0v2.11719c0 .4403299.357556.79272.792717.79272h4.76405c.435161 0 .792716-.3523901.792716-.79272v-6.88123993c0-.43515997-.352388-.79270997-.792716-.79270997zm1.136881 3.0995498.869198.8692002h-4.65242994c-.352433 0-.352433.5291601 0 .5291601h4.65397994l-.870748.8691999c-.2501141.2501098.1250569.62529.375171.3751699l1.3223999-1.3224c.1029031-.1028999.1029031-.2701999 0-.3731l-1.3223999-1.3224c-.265198-.2415599-.6109431.11845-.375171.3751699z"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={filled ? 0 : 0.5}
    />
  </Svg>
);

/* ═══════════════════════  CONSTANTS  ═══════════════════════ */

const ACCENT = "#fe9a00";
const ACCENT_DIM = "rgba(254,154,0,0.5)";
const INACTIVE_COLOR = "rgba(255,255,255,0.35)";
const ITEM_W = 56;
const ITEM_H = 44;
const GAP = 4;
const INNER_PAD_H = 6;
const ISLAND_RADIUS = 32;

type NavItem = {
  label: string;
  icon: string;
  activeIcon: string;
  route: "/" | "/vans" | "/dashboard" | "/register";
};

const NAV_ITEMS: NavItem[] = [
  { label: "Reserve", icon: "van", activeIcon: "van-filled", route: "/vans" },
  { label: "Home", icon: "home-outline", activeIcon: "home", route: "/" },
  {
    label: "Profile",
    icon: "person-outline",
    activeIcon: "person",
    route: "/dashboard",
  },
];

/* ═══════════════════════  COMPONENT  ═══════════════════════ */

export default function DynamicIsland() {
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = NAV_ITEMS.findIndex((item) => item.route === pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("authToken");
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, [pathname]);

  /* ── animation refs ── */
  const entranceY = useRef(new Animated.Value(80)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorScale = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  const itemAnims = useRef(
    NAV_ITEMS.map((_, i) => ({
      scale: new Animated.Value(1),
      iconScale: new Animated.Value(i === activeIndex ? 1 : 0.9),
      labelOpacity: new Animated.Value(i === activeIndex ? 1 : 0),
      labelTranslateY: new Animated.Value(i === activeIndex ? 0 : 6),
      glowOpacity: new Animated.Value(i === activeIndex ? 0.6 : 0),
      rippleScale: new Animated.Value(0),
      rippleOpacity: new Animated.Value(0),
    })),
  ).current;

  const prevIndexRef = useRef(activeIndex);

  const getIndicatorX = (index: number) => INNER_PAD_H + index * (ITEM_W + GAP);

  /* ── entrance ── */
  useEffect(() => {
    if (activeIndex >= 0) {
      indicatorX.setValue(getIndicatorX(activeIndex));
      indicatorScale.setValue(0);
    }

    Animated.parallel([
      Animated.spring(entranceY, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Indicator pop-in
      Animated.spring(indicatorScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Continuous float
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, {
            toValue: -2.5,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatY, {
            toValue: 2.5,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 0.8,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 0.4,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
  }, []);

  /* ── route change ── */
  useEffect(() => {
    const prev = prevIndexRef.current;
    prevIndexRef.current = activeIndex;
    if (prev === activeIndex || activeIndex < 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Slide indicator
    Animated.spring(indicatorX, {
      toValue: getIndicatorX(activeIndex),
      tension: 180,
      friction: 14,
      useNativeDriver: true,
    }).start();

    // Deactivate prev
    if (prev >= 0) {
      Animated.parallel([
        Animated.spring(itemAnims[prev].iconScale, {
          toValue: 0.9,
          tension: 200,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(itemAnims[prev].labelOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(itemAnims[prev].labelTranslateY, {
          toValue: 6,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(itemAnims[prev].glowOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Activate current – ripple + scale
    const cur = itemAnims[activeIndex];

    // Ripple
    cur.rippleScale.setValue(0);
    cur.rippleOpacity.setValue(0.5);
    Animated.parallel([
      Animated.timing(cur.rippleScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cur.rippleOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Icon & label
    Animated.parallel([
      Animated.spring(cur.iconScale, {
        toValue: 1,
        tension: 250,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(cur.labelOpacity, {
        toValue: 1,
        duration: 250,
        delay: 80,
        useNativeDriver: true,
      }),
      Animated.spring(cur.labelTranslateY, {
        toValue: 0,
        tension: 200,
        friction: 10,
        delay: 80,
        useNativeDriver: true,
      }),
      Animated.timing(cur.glowOpacity, {
        toValue: 0.6,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex]);

  /* ── press handlers ── */
  const handlePressIn = useCallback((index: number) => {
    Animated.spring(itemAnims[index].scale, {
      toValue: 0.88,
      tension: 400,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressOut = useCallback((index: number) => {
    Animated.spring(itemAnims[index].scale, {
      toValue: 1,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = useCallback(
    async (
      route: "/" | "/vans" | "/dashboard" | "/register",
      index: number,
    ) => {
      if (route === "/dashboard") {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          router.push("/register" as Href);
          return;
        }
      }
      router.push(route as Href);
    },
    [router],
  );

  /* ── render icon ── */
  const renderIcon = (item: NavItem, isActive: boolean, showLogin: boolean) => {
    const size = isActive ? 22 : 21;
    const color = isActive ? ACCENT : INACTIVE_COLOR;

    if (item.icon === "van")
      return (
        <VanIcon size={isActive ? 28 : 30} color={color} filled={isActive} />
      );
    if (item.icon === "home-outline")
      return <HomeIcon size={size} color={color} filled={isActive} />;
    if (showLogin)
      return <LoginIcon size={size} color={color} filled={isActive} />;
    if (item.icon === "person-outline")
      return (
        <ProfileIcon
          size={isActive ? 22 : 23}
          color={isActive ? ACCENT : "rgba(255,255,255,0.8)"}
          filled={isActive}
        />
      );
    return (
      <Ionicons
        name={(isActive ? item.activeIcon : item.icon) as any}
        size={size}
        color={color}
      />
    );
  };

  /* ── render item ── */
  const renderNavItem = (item: NavItem, index: number) => {
    const isActive = activeIndex === index;
    const showLogin = item.route === "/dashboard" && !isAuthenticated;
    const isLoginActive = showLogin && pathname === "/register";
    const finalActive = isActive || isLoginActive;
    const anim = itemAnims[index];

    return (
      <Animated.View
        key={item.route}
        style={[styles.itemWrap, { transform: [{ scale: anim.scale }] }]}
      >
        <Pressable
          onPress={() => handlePress(item.route, index)}
          onPressIn={() => handlePressIn(index)}
          onPressOut={() => handlePressOut(index)}
          style={styles.itemPressable}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: finalActive }}
          android_ripple={null}
        >
          {/* Ripple ring */}
          <Animated.View
            style={[
              styles.ripple,
              {
                opacity: anim.rippleOpacity,
                transform: [{ scale: anim.rippleScale }],
              },
            ]}
          />

          {/* Icon glow */}
          <Animated.View
            style={[
              styles.iconGlow,
              {
                opacity: Animated.multiply(anim.glowOpacity, glowPulse),
              },
            ]}
          />

          {/* Icon */}
          <Animated.View
            style={[styles.iconBox, { transform: [{ scale: anim.iconScale }] }]}
          >
            {renderIcon(item, finalActive, showLogin)}
          </Animated.View>

          {/* Label (active only) */}
          <Animated.Text
            style={[
              styles.label,
              {
                opacity: anim.labelOpacity,
                transform: [{ translateY: anim.labelTranslateY }],
              },
            ]}
            numberOfLines={1}
          >
            {showLogin ? "Login" : item.label}
          </Animated.Text>
        </Pressable>
      </Animated.View>
    );
  };

  /* ═══════════  RENDER  ═══════════ */

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: entranceOpacity,
          transform: [{ translateY: Animated.add(entranceY, floatY) }],
        },
      ]}
    >
      {/* Outer ambient glow */}
      <View style={styles.ambientGlow} />

      <View style={styles.islandOuter}>
        {/* Glass border gradient */}
        <LinearGradient
          colors={[
            "rgba(254,154,0,0.35)",
            "rgba(254,154,0,0.12)",
            "rgba(255,255,255,0.06)",
            "rgba(254,154,0,0.12)",
            "rgba(254,154,0,0.35)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.borderGradient}
        />

        <BlurView
          intensity={Platform.OS === "ios" ? 70 : 30}
          tint="dark"
          style={styles.island}
        >
          {/* Android glass effect fallback - BlurView doesn't work properly on Android */}
          {Platform.OS === "android" && (
            <LinearGradient
              colors={[
                "rgba(30,40,70,0.85)",
                "rgba(15,25,50,0.92)",
                "rgba(10,18,40,0.95)",
                "rgba(15,25,50,0.92)",
                "rgba(30,40,70,0.85)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: ISLAND_RADIUS - 1 }]}
            />
          )}

          <View style={styles.inner}>
            {/* Active indicator pill */}
            <Animated.View
              style={[
                styles.indicator,
                {
                  transform: [
                    { translateX: indicatorX },
                    { scale: indicatorScale },
                  ],
                },
              ]}
            >
              {/* Indicator bottom accent line */}
              <LinearGradient
                colors={["transparent", ACCENT, "transparent"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.indicatorAccent}
              />
            </Animated.View>

            {/* Items */}
            {NAV_ITEMS.map(renderNavItem)}
          </View>

          {/* Inner border */}
          <View style={styles.innerBorderOverlay} />
        </BlurView>
      </View>
    </Animated.View>
  );
}

/* ═══════════════════════  STYLES  ═══════════════════════ */

const ISLAND_W =
  NAV_ITEMS.length * ITEM_W + (NAV_ITEMS.length - 1) * GAP + INNER_PAD_H * 2;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 28 : 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },

  /* Ambient glow under the bar */
  ambientGlow: {
    position: "absolute",
    bottom: -1,
    width: ISLAND_W * 0.6,
    height: 20,
    borderRadius: 20,
    backgroundColor: ACCENT,
    opacity: 0.7,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
    }),
  },

  /* Outer frame (gradient border) */
  islandOuter: {
    borderRadius: ISLAND_RADIUS,
    padding: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 18,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  borderGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ISLAND_RADIUS,
  },

  /* Glass body */
  island: {
    borderRadius: ISLAND_RADIUS - 1,
    overflow: "hidden",
  },
  specular: {
    position: "absolute",
    top: 0,
    left: 8,
    right: 8,
    height: 28,
    borderTopLeftRadius: ISLAND_RADIUS - 1,
    borderTopRightRadius: ISLAND_RADIUS - 1,
  },

  /* Inner border overlay */
  innerBorderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ISLAND_RADIUS - 1,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    pointerEvents: "none",
  },

  /* Items row */
  inner: {
    flexDirection: "row",
    paddingHorizontal: INNER_PAD_H,
    paddingTop: 8,
    paddingBottom: 6,
    gap: GAP,
    position: "relative",
    alignItems: "center",
  },

  /* Sliding indicator */
  indicator: {
    position: "absolute",
    width: ITEM_W,
    height: ITEM_H + 8,
    top: 4,
    left: 0,
    borderRadius: 22,
    overflow: "hidden",
  },
  indicatorFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  indicatorEdge: {
    position: "absolute",
    top: 0,
    left: 8,
    right: 8,
    height: 0.5,
    backgroundColor: "rgba(254,154,0,0.3)",
  },
  indicatorAccent: {
    position: "absolute",
    bottom: 0,
    left: 10,
    right: 10,
    height: 1.5,
    borderRadius: 1,
  },

  /* Item */
  itemWrap: {
    width: ITEM_W,
    height: ITEM_H + 8,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  itemPressable: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  /* Ripple effect */
  ripple: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: ACCENT,
  },

  /* Icon glow */
  iconGlow: {
    position: "absolute",
    width: 1,
    height: 1,
    borderRadius: 16,
    backgroundColor: ACCENT,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
      },
    }),
    opacity: 0.15,
  },

  /* Icon container */
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
  },

  /* Label */
  label: {
    fontSize: 8,
    fontWeight: "700",
    color: ACCENT,
    letterSpacing: 0.5,
    marginTop: 1,
    textTransform: "uppercase",
  },
});

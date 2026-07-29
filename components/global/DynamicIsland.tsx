import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from "react-native";
import GlassView from "@/components/global/GlassView";
import { useRouter, usePathname, Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ═══════════════════  ICONS  ═══════════════════ */

const VanIcon = ({ size = 24, color = "#fff", filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512">
    <Path
      d="m465.532 242.313-28.08-13.505-37.568-67.507c-7.415-13.323-20.945-21.277-36.193-21.277h-215.023c-22.84 0-41.421 18.581-41.421 41.42v147.86c0 4.418 3.582 8 8 8h25.785c3.757 19.716 21.114 34.671 41.908 34.671 20.793 0 38.151-14.955 41.908-34.671h140.051c3.757 19.716 21.114 34.671 41.908 34.671s38.152-14.955 41.909-34.671h32.284c4.418 0 8-3.582 8-8v-49.663c0-16.305-8.773-30.26-23.468-37.328zm-47.443-15.395h-36.313l-13.51-9.322c-1.336-.922-2.921-1.416-4.544-1.416h-32.93v-26.638h66.497zm-235.149 129.058c-14.706 0-26.671-11.965-26.671-26.671s11.965-26.671 26.671-26.671 26.671 11.965 26.671 26.671-11.965 26.671-26.671 26.671zm223.867 0c-14.706 0-26.671-11.965-26.671-26.671s11.965-26.671 26.671-26.671c14.707 0 26.672 11.965 26.672 26.671s-11.965 26.671-26.672 26.671zm66.193-34.671h-24.285c-3.757-19.716-21.115-34.671-41.909-34.671s-38.151 14.955-41.908 34.671h-140.05c-3.757-19.716-21.114-34.671-41.908-34.671s-38.151 14.955-41.908 34.671h-17.785v-139.86c0-14.017 11.403-25.42 25.421-25.42h215.022c9.498 0 17.594 4.76 22.213 13.059l2.481 4.459h-65.593c-4.418 0-8 3.582-8 8v42.638c0 4.418 3.582 8 8 8h38.438l13.51 9.322c1.336.922 2.921 1.416 4.544 1.416h50.59l28.725 13.815c9.019 4.337 14.402 12.9 14.402 22.908zm-190.991-86.387c0 4.418-3.582 8-8 8h-132.75c-4.418 0-8-3.582-8-8s3.582-8 8-8h132.75c4.418 0 8 3.582 8 8zm-191.118-81.277c0 4.418-3.582 8-8 8h-51.891c-4.418 0-8-3.582-8-8s3.582-8 8-8h51.891c4.418 0 8 3.582 8 8zm0 69.869c0 4.418-3.582 8-8 8h-38.764c-4.418 0-8-3.582-8-8s3.582-8 8-8h38.764c4.418 0 8 3.582 8 8zm0 69.869c0 4.418-3.582 8-8 8h-26.78c-4.418 0-8-3.582-8-8s3.582-8 8-8h26.779c4.419 0 8.001 3.582 8.001 8z"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={filled ? 0 : 8}
    />
  </Svg>
);

const HomeIcon = ({ size = 24, color = "#fff", filled = false }) => (
  <Svg width={size} height={size} viewBox="0 1 511 511.999">
    <Path
      d="m498.699219 222.695312c-.015625-.011718-.027344-.027343-.039063-.039062l-208.855468-208.847656c-8.902344-8.90625-20.738282-13.808594-33.328126-13.808594-12.589843 0-24.425781 4.902344-33.332031 13.808594l-208.746093 208.742187c-.070313.070313-.144532.144531-.210938.214844-18.28125 18.386719-18.25 48.21875.089844 66.558594 8.378906 8.382812 19.441406 13.234375 31.273437 13.746093.484375.046876.96875.070313 1.457031.070313h8.320313v153.695313c0 30.417968 24.75 55.164062 55.167969 55.164062h81.710937c8.285157 0 15-6.71875 15-15v-120.5c0-13.878906 11.292969-25.167969 25.171875-25.167969h48.195313c13.878906 0 25.167969 11.289063 25.167969 25.167969v120.5c0 8.28125 6.714843 15 15 15h81.710937c30.421875 0 55.167969-24.746094 55.167969-55.164062v-153.695313h7.71875c12.585937 0 24.421875-4.902344 33.332031-13.8125 18.359375-18.367187 18.367187-48.253906.027344-66.632813zm-21.242188 45.421876c-3.238281 3.238281-7.542969 5.023437-12.117187 5.023437h-22.71875c-8.285156 0-15 6.714844-15 15v168.695313c0 13.875-11.289063 25.164062-25.167969 25.164062h-66.710937v-105.5c0-30.417969-24.746094-55.167969-55.167969-55.167969h-48.195313c-30.421875 0-55.171875 24.75-55.171875 55.167969v105.5h-66.710937c-13.875 0-25.167969-11.289062-25.167969-25.164062v-168.695313c0-8.285156-6.714844-15-15-15h-22.328125c-.234375-.015625-.464844-.027344-.703125-.03125-4.46875-.078125-8.660156-1.851563-11.800781-4.996094-6.679688-6.679687-6.679688-17.550781 0-24.234375.003906 0 .003906-.003906.007812-.007812l.011719-.011719 208.847656-208.839844c3.234375-3.238281 7.535157-5.019531 12.113281-5.019531 4.574219 0 8.875 1.78125 12.113282 5.019531l208.800781 208.796875c.03125.03125.066406.0625.097656.09375 6.644531 6.691406 6.632813 17.539063-.03125 24.207032zm0 0"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={filled ? 0 : 12}
    />
  </Svg>
);

const ProfileIcon = ({ size = 24, color = "#fff", filled = false }) => (
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

const LoginIcon = ({ size = 24, color = "#fff", filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 8.4666667 8.4666667">
    <Path
      d="m2.9102882-.0000016c-.441363 0-.792717.35755-.792717.79270997v2.11718993c0 .3607801.5291671.3607801.5291671 0v-2.11718993c0-.15114998.1196279-.26354998.2635499-.26354998h4.76405c.1511551 0 .2635498.12273.2635498.26354998v6.88123993c0 .1428901-.1123947.2635501-.2635498.2635501h-4.76405c-.1511559 0-.2635499-.12066-.2635499-.2635501v-2.11719c0-.3502898-.5291671-.35545-.5291671 0v2.11719c0 .4403299.357556.79272.792717.79272h4.76405c.435161 0 .792716-.3523901.792716-.79272v-6.88123993c0-.43515997-.352388-.79270997-.792716-.79270997zm1.136881 3.0995498.869198.8692002h-4.65242994c-.352433 0-.352433.5291601 0 .5291601h4.65397994l-.870748.8691999c-.2501141.2501098.1250569.62529.375171.3751699l1.3223999-1.3224c.1029031-.1028999.1029031-.2701999 0-.3731l-1.3223999-1.3224c-.265198-.2415599-.6109431.11845-.375171.3751699z"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={filled ? 0 : 0.5}
    />
  </Svg>
);

/* ═══════════════════  CONSTANTS  ═══════════════════ */

const ACCENT = "#fe9a00";
const ACTIVE_ICON = "#111827";
const INACTIVE = "rgba(255,255,255,0.58)";
const ITEM_SIZE = 52;
const GAP = 6;
const PAD = 5;
const RADIUS = 30;

type NavItem = {
  label: string;
  icon: string;
  activeIcon: string;
  route: "/" | "/vans" | "/dashboard" | "/register";
};

const NAV_ITEMS: NavItem[] = [
  { label: "Vans", icon: "van", activeIcon: "van-filled", route: "/vans" },
  { label: "Home", icon: "home-outline", activeIcon: "home", route: "/" },
  {
    label: "Profile",
    icon: "person-outline",
    activeIcon: "person",
    route: "/dashboard",
  },
];

const ISLAND_W =
  NAV_ITEMS.length * ITEM_SIZE + (NAV_ITEMS.length - 1) * GAP + PAD * 2;

/* ═══════════════════  COMPONENT  ═══════════════════ */

export default function DynamicIsland() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const activeIndex =
    pathname === "/register"
      ? 2
      : NAV_ITEMS.findIndex((item) =>
          item.route === "/"
            ? pathname === "/"
            : pathname.startsWith(item.route),
        );

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("authToken");
      setIsAuthenticated(!!token);
    })();
  }, [pathname]);

  const entranceY = useRef(new Animated.Value(60)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorScale = useRef(new Animated.Value(0)).current;

  const itemAnims = useRef(
    NAV_ITEMS.map((_, i) => ({
      scale: new Animated.Value(1),
      iconY: new Animated.Value(i === activeIndex ? -1 : 0),
      iconScale: new Animated.Value(i === activeIndex ? 1.02 : 1),
    })),
  ).current;

  const prevIndex = useRef(activeIndex);

  const getX = (i: number) => PAD + i * (ITEM_SIZE + GAP);

  /* entrance */
  useEffect(() => {
    if (activeIndex >= 0) {
      indicatorX.setValue(getX(activeIndex));
    }

    Animated.parallel([
      Animated.spring(entranceY, {
        toValue: 0,
        tension: 55,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.spring(indicatorScale, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  /* tab change */
  useEffect(() => {
    const prev = prevIndex.current;
    prevIndex.current = activeIndex;
    if (prev === activeIndex || activeIndex < 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // slide indicator
    Animated.spring(indicatorX, {
      toValue: getX(activeIndex),
      tension: 200,
      friction: 16,
      useNativeDriver: true,
    }).start();

    // deactivate prev
    if (prev >= 0) {
      const p = itemAnims[prev];
      Animated.parallel([
        Animated.spring(p.iconY, {
          toValue: 0,
          tension: 180,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(p.iconScale, {
          toValue: 1,
          tension: 180,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // activate current
    const c = itemAnims[activeIndex];
    Animated.parallel([
      Animated.spring(c.iconY, {
        toValue: -1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(c.iconScale, {
        toValue: 1.02,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex]);

  /* press handlers */
  const onPressIn = useCallback(
    (i: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(itemAnims[i].scale, {
        toValue: 0.92,
        tension: 400,
        friction: 10,
        useNativeDriver: true,
      }).start();
    },
    [itemAnims],
  );

  const onPressOut = useCallback(
    (i: number) => {
      Animated.spring(itemAnims[i].scale, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }).start();
    },
    [itemAnims],
  );

  const onPress = useCallback(
    async (route: NavItem["route"]) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  /* icon render */
  const getIcon = (item: NavItem, active: boolean, login: boolean) => {
    const color = active ? ACTIVE_ICON : INACTIVE;
    const s = active ? 21 : 20;
    if (item.icon === "van")
      return <VanIcon size={s + 4} color={color} filled={active} />;
    if (item.icon === "home-outline")
      return <HomeIcon size={s} color={color} filled={active} />;
    if (login) return <LoginIcon size={s} color={color} filled={active} />;
    return <ProfileIcon size={s} color={color} filled={active} />;
  };

  /* render */
  return (
    <Animated.View
      style={[
        st.container,
        { bottom: Math.max(insets.bottom + 10, Platform.OS === "ios" ? 22 : 16) },
        {
          opacity: entranceOpacity,
          transform: [{ translateY: entranceY }],
        },
      ]}
    >
      {/* ambient shadow */}
      <View style={st.ambient} />

      <View style={st.outer}>
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.16)",
            "rgba(254,154,0,0.22)",
            "rgba(255,255,255,0.08)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <GlassView
          intensity={Platform.OS === "ios" ? 72 : 78}
          tint="dark"
          overlayStyle={st.glassOverlay}
          style={st.glass}
        >
          <View style={st.row}>
            {/* indicator */}
            <Animated.View
              style={[
                st.indicator,
                {
                  transform: [
                    { translateX: indicatorX },
                    { scale: indicatorScale },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={["#ffb84d", "#fe9a00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {/* nav items */}
            {NAV_ITEMS.map((item, i) => {
              const isActive = activeIndex === i;
              const showLogin = item.route === "/dashboard" && !isAuthenticated;
              const loginActive = showLogin && pathname === "/register";
              const active = isActive || loginActive;
              const a = itemAnims[i];

              return (
                <Animated.View
                  key={item.route}
                  style={[st.item, { transform: [{ scale: a.scale }] }]}
                >
                  <Pressable
                    onPress={() => onPress(item.route)}
                    onPressIn={() => onPressIn(i)}
                    onPressOut={() => onPressOut(i)}
                    style={st.pressable}
                    accessibilityRole="button"
                    accessibilityLabel={showLogin ? "Login" : item.label}
                    accessibilityState={{ selected: active }}
                  >
                    <Animated.View
                      style={{
                        transform: [
                          { translateY: a.iconY },
                          { scale: a.iconScale },
                        ],
                      }}
                    >
                      {getIcon(item, active, showLogin)}
                    </Animated.View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* subtle inner border */}
          <View style={st.innerBorder} pointerEvents="none" />
        </GlassView>
      </View>
    </Animated.View>
  );
}

/* ═══════════════════  STYLES  ═══════════════════ */

const st = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  ambient: {
    position: "absolute",
    bottom: -5,
    width: ISLAND_W * 0.54,
    height: 14,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    opacity: 0.34,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
      },
    }),
  },
  outer: {
    borderRadius: RADIUS,
    padding: StyleSheet.hairlineWidth,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
      },
      android: { elevation: 10 },
    }),
  },
  glass: {
    borderRadius: RADIUS - 1,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
  },
  glassOverlay: {
    borderRadius: RADIUS - 1,
    backgroundColor:
      Platform.OS === "android" ? "rgba(8,13,28,0.62)" : "rgba(8,13,28,0.28)",
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS - 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: PAD,
    paddingVertical: PAD,
    gap: GAP,
  },
  indicator: {
    position: "absolute",
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    top: PAD,
    left: 0,
    borderRadius: ITEM_SIZE / 2,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.28)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 9,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  pressable: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

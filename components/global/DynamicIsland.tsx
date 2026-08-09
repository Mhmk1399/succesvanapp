import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { useRouter, usePathname, Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, {
  Path,
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
  LinearGradient as SvgLinearGradient,
  Rect,
  Circle,
  G,
} from "react-native-svg";
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

/* ═══════════════════  CONSTANTS  ═══════════════════ */

const ACCENT = "#fe9a00";
const ACCENT_LIGHT = "#ffc257";
const ACCENT_DEEP = "#c96c00";
const ACTIVE_ICON = "#1a1206";
const INACTIVE = "rgba(210,213,222,0.75)";
const INACTIVE_LABEL = "rgba(200,205,215,0.55)";

const ITEM_WIDTH = 80;
const ITEM_HEIGHT = 70;
const ACTIVE_SIZE = 70; // قطر دایره نارنجی
const ACTIVE_RADIUS = ACTIVE_SIZE / 2;
const BUMP_GAP = 6; // فاصله حاشیه جزیره از دایره فعال
const BUMP_R = ACTIVE_RADIUS + BUMP_GAP; // شعاع برآمدگی دور دایره
const GAP = 2;
const PAD_H = 30; // فضای کافی برای برآمدگی آیتم اول و آخر
const PAD_V = 10;
const RADIUS = 34;
const ACTIVE_LIFT = 16; // چقدر دایره از بالای نوار بیرون می‌زند
const SVG_EXTRA_TOP = 40; // فضای بالای SVG برای برآمدگی

type NavItem = {
  label: string;
  icon: string;
  activeIcon: string;
  route: "/" | "/vans" | "/dashboard" | "/register";
};

const NAV_ITEMS: NavItem[] = [
  { label: "Bookings", icon: "van", activeIcon: "van-filled", route: "/vans" },
  { label: "Home", icon: "home-outline", activeIcon: "home", route: "/" },
  {
    label: "Account",
    icon: "person-outline",
    activeIcon: "person",
    route: "/dashboard",
  },
];

const ISLAND_W =
  NAV_ITEMS.length * ITEM_WIDTH + (NAV_ITEMS.length - 1) * GAP + PAD_H * 2;
const ISLAND_H = ITEM_HEIGHT + PAD_V * 2;

/* ═══════════════════
   شکل نوار با برآمدگی دایره‌ای واقعی
   حاشیه جزیره با همان مرکز دایره فعال حرکت می‌کند
   ═══════════════════ */
const buildBarPath = (
  w: number,
  h: number,
  r: number,
  bumpCx: number, // مرکز افقی برآمدگی، دقیقاً برابر مرکز دایره فعال
  bumpR: number, // شعاع بیرونی برآمدگی
  topY: number,
) => {
  // مرکز عمودی برآمدگی با مرکز دایره نارنجی یکی است.
  const bumpCenterY = topY - ACTIVE_LIFT + ACTIVE_RADIUS;

  // محل برخورد دایره بیرونی برآمدگی با خط بالای نوار.
  const dy = topY - bumpCenterY;
  const halfChord = Math.sqrt(Math.max(0, bumpR * bumpR - dy * dy));
  const startX = bumpCx - halfChord;
  const endX = bumpCx + halfChord;

  return `
    M ${r} ${topY}
    L ${startX} ${topY}
    A ${bumpR} ${bumpR} 0 0 1 ${endX} ${topY}
    L ${w - r} ${topY}
    Q ${w} ${topY}, ${w} ${topY + r}
    L ${w} ${h - r + topY}
    Q ${w} ${h + topY}, ${w - r} ${h + topY}
    L ${r} ${h + topY}
    Q 0 ${h + topY}, 0 ${h - r + topY}
    L 0 ${topY + r}
    Q 0 ${topY}, ${r} ${topY}
    Z
  `;
};

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
  const indicatorScale = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.85)).current;

  // مرکز آیکون فعال (یک Animated.Value مرکزی برای سینک همه چیز)
  const activeCenterX = useRef(
    new Animated.Value(
      activeIndex >= 0
        ? PAD_H + activeIndex * (ITEM_WIDTH + GAP) + ITEM_WIDTH / 2
        : ISLAND_W / 2,
    ),
  ).current;
  const activeCenterXVisual = useRef(
    new Animated.Value(
      activeIndex >= 0
        ? PAD_H + activeIndex * (ITEM_WIDTH + GAP) + ITEM_WIDTH / 2
        : ISLAND_W / 2,
    ),
  ).current;

  // برای مسیر SVG نیاز به مقدار عددی مرکز برآمدگی داریم (چون AnimatedPath.d از rn-svg رو باگ داره روی بعضی نسخه‌ها)
  // پس با listener سینک می‌کنیم
  const [bumpCx, setBumpCx] = useState<number>(
    activeIndex >= 0
      ? PAD_H + activeIndex * (ITEM_WIDTH + GAP) + ITEM_WIDTH / 2
      : ISLAND_W / 2,
  );

  const itemAnims = useRef(
    NAV_ITEMS.map(() => ({
      scale: new Animated.Value(1),
    })),
  ).current;

  const prevIndex = useRef(activeIndex);

  const getItemCenter = (i: number) =>
    PAD_H + i * (ITEM_WIDTH + GAP) + ITEM_WIDTH / 2;

  /* مرکز برآمدگی و دایره فعال با یک Animated.Value سینک هستند */
  useEffect(() => {
    const id = activeCenterX.addListener(({ value }) => {
      setBumpCx(value);
    });
    return () => activeCenterX.removeListener(id);
  }, []);

  /* entrance */
  useEffect(() => {
    if (activeIndex >= 0) {
      activeCenterX.setValue(getItemCenter(activeIndex));
      activeCenterXVisual.setValue(getItemCenter(activeIndex));
      setBumpCx(getItemCenter(activeIndex));
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

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.75,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    glowLoop.start();

    return () => {
      glowLoop.stop();
    };
  }, []);

  /* tab change */
  useEffect(() => {
    const prev = prevIndex.current;
    prevIndex.current = activeIndex;
    if (prev === activeIndex || activeIndex < 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const nextCenter = getItemCenter(activeIndex);

    // activeCenterX feeds SVG/listeners, activeCenterXVisual feeds native transforms.
    Animated.parallel([
      Animated.spring(activeCenterX, {
        toValue: nextCenter,
        tension: 130,
        friction: 14,
        useNativeDriver: false,
      }),
      Animated.spring(activeCenterXVisual, {
        toValue: nextCenter,
        tension: 130,
        friction: 14,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex]);

  /* press */
  const onPressIn = useCallback(
    (i: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(itemAnims[i].scale, {
        toValue: 0.9,
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

  /* icon */
  const getIcon = (item: NavItem, active: boolean) => {
    const color = active ? ACTIVE_ICON : INACTIVE;
    const s = active ? 28 : 22;
    if (item.icon === "van")
      return <VanIcon size={s + 4} color={color} filled={active} />;
    if (item.icon === "home-outline")
      return <HomeIcon size={s} color={color} filled={active} />;
    return <ProfileIcon size={s} color={color} filled={active} />;
  };

  // ابعاد SVG
  const SVG_W = ISLAND_W;
  const SVG_H = ISLAND_H + SVG_EXTRA_TOP;
  const BAR_TOP_Y = SVG_EXTRA_TOP; // Y نوار در SVG
  const ACTIVE_CENTER_Y = BAR_TOP_Y - ACTIVE_LIFT + ACTIVE_RADIUS;

  const barPath = buildBarPath(
    SVG_W,
    ISLAND_H,
    RADIUS,
    bumpCx,
    BUMP_R,
    BAR_TOP_Y,
  );

  // موقعیت دایره فعال (translateX): مرکز - شعاع
  const circleTranslateX = Animated.subtract(
    activeCenterXVisual,
    new Animated.Value(ACTIVE_SIZE / 2),
  );

  // موقعیت گلو (translateX): مرکز - نصف عرض glow
  const GLOW_SIZE = 180;
  const glowTranslateX = Animated.subtract(
    activeCenterXVisual,
    new Animated.Value(GLOW_SIZE / 2),
  );

  return (
    <Animated.View
      style={[
        st.container,
        {
          bottom: Math.max(insets.bottom + 12, Platform.OS === "ios" ? 22 : 18),
        },
        {
          opacity: entranceOpacity,
          transform: [{ translateY: entranceY }],
        },
      ]}
    >
      <View style={[st.wrapper, { width: ISLAND_W, height: SVG_H + 8 }]}>
        {/* ═══ گلو محیطی پشت دایره (پشت‌زمینه) ═══ */}
        {activeIndex >= 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              st.bgGlow,
              {
                width: GLOW_SIZE,
                height: GLOW_SIZE,
                top: BAR_TOP_Y - ACTIVE_LIFT - GLOW_SIZE / 2 + ACTIVE_SIZE / 2,
                opacity: glowPulse,
                transform: [{ translateX: glowTranslateX }],
              },
            ]}
          >
            <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
              <Defs>
                <SvgRadialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={ACCENT} stopOpacity="0.75" />
                  <Stop offset="35%" stopColor={ACCENT} stopOpacity="0.28" />
                  <Stop offset="70%" stopColor={ACCENT} stopOpacity="0.06" />
                  <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
                </SvgRadialGradient>
              </Defs>
              <Rect
                x="0"
                y="0"
                width={GLOW_SIZE}
                height={GLOW_SIZE}
                fill="url(#bgGlow)"
              />
            </Svg>
          </Animated.View>
        )}

        {/* ═══ نوار اصلی با برآمدگی متصل به آیکون فعال ═══ */}
        <View style={[st.barSvgContainer, { width: SVG_W, height: SVG_H }]}>
          <Svg width={SVG_W} height={SVG_H} style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgLinearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="rgba(38,38,46,0.96)" />
                <Stop offset="100%" stopColor="rgba(14,14,20,0.98)" />
              </SvgLinearGradient>
              <SvgLinearGradient id="barStroke" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                <Stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
                <Stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
              </SvgLinearGradient>
              {/* گرادیانت داخلی برای درخشش اطراف برآمدگی */}
              <SvgRadialGradient
                id="bumpGlow"
                cx={`${(bumpCx / SVG_W) * 100}%`}
                cy={`${(ACTIVE_CENTER_Y / SVG_H) * 100}%`}
                r="18%"
              >
                <Stop offset="0%" stopColor={ACCENT} stopOpacity="0.35" />
                <Stop offset="60%" stopColor={ACCENT} stopOpacity="0.06" />
                <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </SvgRadialGradient>
            </Defs>

            {/* بدنه اصلی نوار */}
            <Path
              d={barPath}
              fill="#151515"
              stroke="#373333"
              strokeWidth={0.8}
            />

            {/* لایه درخشش نارنجی داخل نوار (پشت آیکون‌ها) */}
            <Path d={barPath} fill="url(#bumpGlow)" />
          </Svg>

          {/* محتوای نوار (آیکون‌ها) */}
          <View
            style={[
              st.contentRow,
              {
                top: BAR_TOP_Y,
                height: ISLAND_H,
              },
            ]}
          >
            {NAV_ITEMS.map((item, i) => {
              const isActive = activeIndex === i;
              const showLogin = item.route === "/dashboard" && !isAuthenticated;
              const loginActive = showLogin && pathname === "/register";
              const active = isActive || loginActive;
              const a = itemAnims[i];
              const label = item.label;

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
                    accessibilityLabel={label}
                    accessibilityState={{ selected: active }}
                  >
                    <View style={st.iconSlot}>
                      {!active && getIcon(item, false)}
                    </View>
                    <Text
                      style={[st.label, active && st.labelActive]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* ═══ دایره نارنجی فعال، شناور بالای نوار ═══ */}
        {activeIndex >= 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              st.floatingActive,
              {
                top: BAR_TOP_Y - ACTIVE_LIFT,
                transform: [
                  { translateX: circleTranslateX },
                  { scale: indicatorScale },
                ],
              },
            ]}
          >
            {/* هاله رینگ نازک دور دایره */}
            <View style={st.ringHalo} pointerEvents="none">
              <Svg width={ACTIVE_SIZE + 30} height={ACTIVE_SIZE + 30}>
                <Defs>
                  <SvgRadialGradient id="ringG" cx="50%" cy="50%" r="50%">
                    <Stop offset="60%" stopColor={ACCENT} stopOpacity="0" />
                    <Stop offset="72%" stopColor={ACCENT} stopOpacity="0.28" />
                    <Stop offset="85%" stopColor={ACCENT} stopOpacity="0.14" />
                    <Stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
                  </SvgRadialGradient>
                </Defs>
                <Circle
                  cx={(ACTIVE_SIZE + 30) / 2}
                  cy={(ACTIVE_SIZE + 30) / 2}
                  r={(ACTIVE_SIZE + 30) / 2}
                  fill="url(#ringG)"
                />
              </Svg>
            </View>

            {/* گرادیانت اصلی دایره */}
            <LinearGradient
              colors={[ACCENT_LIGHT, ACCENT, ACCENT_DEEP]}
              start={{ x: 0.3, y: 0.05 }}
              end={{ x: 0.7, y: 1 }}
              style={st.circleGradient}
            >
              {/* highlight شیشه‌ای بالا */}
              <View style={st.glossTop} pointerEvents="none" />
              {/* آیکون */}
              {getIcon(NAV_ITEMS[activeIndex], true)}
              {/* ته‌رنگ تیره پایین */}
              <View style={st.glossBottom} pointerEvents="none" />
            </LinearGradient>


          </Animated.View>
        )}
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
  wrapper: {
    position: "relative",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },

  /* ── GLOW پس‌زمینه ── */
  bgGlow: {
    position: "absolute",
    left: 0,
  },

  /* ── کانتینر SVG نوار ── */
  barSvgContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.5,
        shadowRadius: 28,
      },
      android: { elevation: 14 },
    }),
  },

  /* ── ردیف آیکون‌ها ── */
  contentRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: PAD_H,
    paddingVertical: PAD_V,
    gap: GAP,
  },

  item: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  pressable: {
    flex: 1,
    width: "100%",
    paddingTop: 12,
    paddingBottom: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconSlot: {
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: INACTIVE_LABEL,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  labelActive: {
    color: ACCENT,
    fontWeight: "700",
  },

  /* ── دایره نارنجی شناور ── */
  floatingActive: {
    position: "absolute",
    left: 0,
    width: ACTIVE_SIZE,
    height: ACTIVE_SIZE,
    borderRadius: ACTIVE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.7,
        shadowRadius: 20,
      },
      android: { elevation: 20 },
    }),
  },
  ringHalo: {
    position: "absolute",
    top: -15,
    left: -15,
    width: ACTIVE_SIZE + 30,
    height: ACTIVE_SIZE + 30,
  },
  circleGradient: {
    width: "100%",
    height: "100%",
    borderRadius: ACTIVE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,225,160,0.6)",
    overflow: "hidden",
  },
  glossTop: {
    position: "absolute",
    top: 3,
    left: "18%",
    right: "18%",
    height: ACTIVE_SIZE * 0.42,
    borderRadius: ACTIVE_SIZE,
    backgroundColor: "rgba(255,255,255,0.28)",
    opacity: 0.9,
  },
  glossBottom: {
    position: "absolute",
    bottom: -ACTIVE_SIZE * 0.4,
    left: 0,
    right: 0,
    height: ACTIVE_SIZE * 0.7,
    borderRadius: ACTIVE_SIZE,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  notifDot: {
    position: "absolute",
    top: 3,
    right: 5,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "rgba(15,15,20,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifDotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#ff3b30",
  },
});

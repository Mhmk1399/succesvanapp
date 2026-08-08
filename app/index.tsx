import React, { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Easing,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import ReservationForm from "@/components/global/ReservationForm";

const ACCENT = "#fe9a00";
const ACCENT_LIGHT = "#ffd38a";
const ACCENT_SOFT = "#ffb83d";
const DARK = "#07111f";

const AUTOPLAY_MS = 3500;
 const BRAND_LOGO_URI =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/newww.png";

type VanSlide = {
  uri: string;
  name: string;
  tag: string;
};

// Replace only these URIs when you send the final slider images.
const VAN_IMAGES: VanSlide[] = [
  {
    uri: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/shortee.png",
    name: "Short wheel",
    tag: "City delivery",
  },
  {
    uri: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/14seater.png",
    name: "14 seater",
    tag: "Group travel",
  },
  {
    uri: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/louton.png",
    name: "Luton van",
    tag: "Home moves",
  },
];

const AnimatedSvgRect = Animated.createAnimatedComponent(
  Rect,
) as React.ComponentType<any>;

type SoftGlowProps = {
  color: string;
  opacity?: number;
  centerX?: string;
  centerY?: string;
  radius?: string;
  style?: React.ComponentProps<typeof View>["style"];
};

function SoftGlow({
  color,
  opacity = 0.16,
  centerX = "50%",
  centerY = "50%",
  radius = "58%",
  style,
}: SoftGlowProps) {
  const gradientId = useRef(
    `soft-glow-${color.replace(/[^a-zA-Z0-9]/g, "")}`,
  ).current;

  return (
    <View
      pointerEvents="none"
      style={[styles.softGlow, style ?? StyleSheet.absoluteFillObject]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <SvgRadialGradient
            id={gradientId}
            cx={centerX}
            cy={centerY}
            r={radius}
          >
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="35%" stopColor={color} stopOpacity={opacity * 0.58} />
            <Stop offset="68%" stopColor={color} stopOpacity={opacity * 0.18} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </SvgRadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  const compact = height < 720;
  const tiny = height < 660;
  const contentWidth = Math.min(width - 28, 372);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;
  const ambient = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 55,
        friction: 11,
        useNativeDriver: true,
      }),
    ]);

    const ambientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambient, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ambient, {
          toValue: 0,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    entrance.start();
    ambientLoop.start();

    return () => {
      entrance.stop();
      ambientLoop.stop();
    };
  }, [ambient, fadeIn, slideUp]);

  const leftGlowX = ambient.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });
  const rightGlowX = ambient.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });
  const topGlowScale = ambient.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#070b12", "#060912", "#080d16"]}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.leftGlow, { transform: [{ translateX: leftGlowX }] }]}
      >
        <SoftGlow
          color="#477dff"
          opacity={0.4}
          centerX="42%"
          centerY="50%"
          radius="72%"
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.rightGlow, { transform: [{ translateX: rightGlowX }] }]}
      >
        <SoftGlow
          color={ACCENT}
          opacity={0.2}
          centerX="58%"
          centerY="50%"
          radius="74%"
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.topGlow, { transform: [{ scale: topGlowScale }] }]}
      >
        <SoftGlow
          color={ACCENT}
          opacity={0.1}
          centerX="50%"
          centerY="36%"
          radius="70%"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          {
            width: contentWidth,
            paddingTop: Math.max(insets.top, 40) + (tiny ? 2 : 8),
            paddingBottom: Math.max(insets.bottom, 50) + (compact ? 100 : 112),
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        <HomeTopBar
          compact={compact}
          onFleetPress={() => router.push("/vans")}
          onProfilePress={() => router.push("/dashboard")}
        />

        <HeroSlider compact={compact} tiny={tiny} width={contentWidth} />

        <View style={[styles.tileRow, tiny && styles.tileRowTiny]}>
          <InfoTile
            compact={compact}
            icon="time-outline"
            value={"Same-Day\nBooking"}
            label="Quick & easy"
          />
          <InfoTile
            compact={compact}
            icon="shield-checkmark-outline"
            value={"Trusted in\nLondon"}
            label="Local experts"
          />
          <InfoTile
            compact={compact}
            icon="card-outline"
            value={"Clear &\nUpfront Pricing"}
            label="No hidden fees"
          />
        </View>

        <View style={styles.reserveWrap}>
          <PrecisionGlowBorder>
            <ReservationForm />
          </PrecisionGlowBorder>
        </View>
      </Animated.View>
    </View>
  );
}

type HeroSliderProps = {
  compact: boolean;
  tiny: boolean;
  width: number;
};

function HeroSlider({ compact, tiny, width }: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<VanSlide>>(null);
  const autoplayTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserInteracting = useRef(false);
  const scrollX = useRef(new Animated.Value(0)).current;

  const clearAutoplay = useCallback(() => {
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    clearAutoplay();

    autoplayTimer.current = setInterval(() => {
      if (isUserInteracting.current) return;

      setActiveIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % VAN_IMAGES.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, AUTOPLAY_MS);
  }, [clearAutoplay]);

  const scheduleAutoplay = useCallback(
    (delay = 700) => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);

      resumeTimer.current = setTimeout(() => {
        isUserInteracting.current = false;
        startAutoplay();
      }, delay);
    },
    [startAutoplay],
  );

  useEffect(() => {
    startAutoplay();

    return () => {
      clearAutoplay();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [clearAutoplay, startAutoplay]);

  useEffect(() => {
    flatListRef.current?.scrollToOffset({
      offset: activeIndex * width,
      animated: false,
    });
  }, [width]);

  const onDragStart = useCallback(() => {
    isUserInteracting.current = true;
    clearAutoplay();
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, [clearAutoplay]);

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const rawIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      const nextIndex = Math.min(VAN_IMAGES.length - 1, Math.max(0, rawIndex));

      setActiveIndex(nextIndex);
      scheduleAutoplay();
    },
    [scheduleAutoplay, width],
  );

  const goToIndex = useCallback(
    (index: number) => {
      isUserInteracting.current = true;
      clearAutoplay();
      setActiveIndex(index);

      flatListRef.current?.scrollToIndex({ index, animated: true });
      scheduleAutoplay();
    },
    [clearAutoplay, scheduleAutoplay],
  );

  return (
    <View style={styles.sliderSection}>
      <Animated.FlatList<VanSlide>
        ref={flatListRef}
        data={VAN_IMAGES}
        keyExtractor={(item) => item.uri}
        horizontal
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        initialNumToRender={VAN_IMAGES.length}
        maxToRenderPerBatch={VAN_IMAGES.length}
        windowSize={VAN_IMAGES.length}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        onScrollBeginDrag={onDragStart}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollToIndexFailed={({ index }) => {
          flatListRef.current?.scrollToOffset({
            offset: index * width,
            animated: true,
          });
        }}
        renderItem={({ item, index }) => (
          <HeroCard
            data={item}
            index={index}
            width={width}
            compact={compact}
            tiny={tiny}
            active={index === activeIndex}
            scrollX={scrollX}
          />
        )}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View style={styles.dotsRow} accessibilityRole="tablist">
        {VAN_IMAGES.map((item, index) => (
          <SliderDot
            key={item.uri}
            active={activeIndex === index}
            label={`Show ${item.name}`}
            onPress={() => goToIndex(index)}
          />
        ))}
      </View>
    </View>
  );
}

type SliderDotProps = {
  active: boolean;
  label: string;
  onPress: () => void;
};

function SliderDot({ active, label, onPress }: SliderDotProps) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: active ? 1 : 0,
      tension: 170,
      friction: 16,
      useNativeDriver: false,
    }).start();
  }, [active, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [7, 24],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.42, 1],
  });

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={[styles.dot, { width, opacity }]}>
        {active && <View style={styles.dotHighlight} />}
      </Animated.View>
    </Pressable>
  );
}

type HeroCardProps = {
  data: VanSlide;
  index: number;
  width: number;
  compact: boolean;
  tiny: boolean;
  active: boolean;
  scrollX: Animated.Value;
};

function HeroCard({
  data,
  index,
  width,
  compact,
  tiny,
  active,
  scrollX,
}: HeroCardProps) {
  const cardHeight = tiny ? 218 : compact ? 246 : 274;
  const vanAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-1)).current;
  const livePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;

    vanAnim.setValue(0);
    const animation = Animated.spring(vanAnim, {
      toValue: 1,
      tension: 50,
      friction: 10,
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [active, vanAnim]);

  useEffect(() => {
    if (!active) {
      shineAnim.stopAnimation();
      shineAnim.setValue(-1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(650),
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 1250,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(shineAnim, {
          toValue: -1,
          duration: 1,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [active, shineAnim]);

  useEffect(() => {
    if (!active) {
      livePulse.stopAnimation();
      livePulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [active, livePulse]);

  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const cardScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.95, 1, 0.95],
    extrapolate: "clamp",
  });
  const cardTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [8, 0, 8],
    extrapolate: "clamp",
  });
  const cardOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.72, 1, 0.72],
    extrapolate: "clamp",
  });

  const vanTranslate = vanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [44, 0],
  });
  const vanLift = vanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });
  const vanScale = vanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });
  const vanOpacity = vanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const shineTranslate = shineAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-190, width + 190],
  });
  const liveScale = livePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });
  const liveOpacity = livePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  return (
    <Animated.View
      style={[
        styles.heroSlide,
        {
          width,
          opacity: cardOpacity,
          transform: [{ translateY: cardTranslateY }, { scale: cardScale }],
        },
      ]}
    >
      <View
        style={[
          styles.heroCard,
          { height: cardHeight, width: "100%" },
          compact && styles.heroCardCompact,
          tiny && styles.heroCardTiny,
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(17,29,45,0.92)",
            "rgba(9,18,31,0.94)",
            "rgba(7,16,27,0.96)",
            "rgba(13,24,38,0.92)",
          ]}
          locations={[0, 0.4, 0.72, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.heroTopEdge} pointerEvents="none" />
        <View style={styles.heroArcOne} pointerEvents="none" />
        <View style={styles.heroArcTwo} pointerEvents="none" />
        <SoftGlow
          color={ACCENT}
          opacity={0.9}
          centerX="56%"
          centerY="84%"
          radius="76%"
          style={styles.heroFloor}
        />
        <SoftGlow
          color={ACCENT}
          opacity={0.9}
          centerX="58%"
          centerY="55%"
          radius="72%"
          style={styles.heroLight}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.heroShine,
            {
              transform: [{ translateX: shineTranslate }, { rotate: "18deg" }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.02)",
              "rgba(255,218,150,0.13)",
              "rgba(255,255,255,0.02)",
              "rgba(255,255,255,0)",
            ]}
            locations={[0, 0.25, 0.5, 0.75, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.livePill}>
          <View style={styles.liveDotWrap}>
            <Animated.View
              style={[
                styles.liveDotPulse,
                { opacity: liveOpacity, transform: [{ scale: liveScale }] },
              ]}
            />
            <View style={styles.liveDot} />
          </View>
          <Text style={styles.liveText}>Ready today in London</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={[styles.title, compact && styles.titleCompact]}>
            Book a Van{"\n"}
            <Text style={styles.titleAccent}>in Minutes</Text>
          </Text>
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
            Reliable vans for moves,{"\n"}
            deliveries and business trips{"\n"}— ready in{" "}
            <Text style={styles.subtitleAccent}>under 60 minutes.</Text>
          </Text>
        </View>

        <View style={styles.trustBadge}>
          <LinearGradient
            colors={["rgba(255,184,61,0.14)", "rgba(8,14,24,0.78)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.trustIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color={ACCENT}
            />
          </View>
          <View>
            <Text style={styles.trustTitle}>{data.tag.toUpperCase()}</Text>
            <Text style={styles.trustMeta}>{data.name}</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.vanStage,
            tiny && styles.vanStageTiny,
            {
              opacity: vanOpacity,
              transform: [
                { translateX: vanTranslate },
                { translateY: vanLift },
                { scale: vanScale },
              ],
            },
          ]}
        >
          <View style={styles.vanShadow} />
          <Image
            source={{ uri: data.uri }}
            style={[styles.vanImage, tiny && styles.vanImageTiny]}
            contentFit="contain"
            transition={280}
            cachePolicy="memory-disk"
            accessibilityLabel={data.name}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

type PrecisionGlowBorderProps = {
  children: React.ReactNode;
  radius?: number;
};

function PrecisionGlowBorder({
  children,
  radius = 20,
}: PrecisionGlowBorderProps) {
  const travel = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const travelLoop = Animated.loop(
      Animated.timing(travel, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );

    travel.setValue(0);
    travelLoop.start();
    pulseLoop.start();

    return () => {
      travelLoop.stop();
      pulseLoop.stop();
    };
  }, [pulse, travel]);

  // OUTSET only enlarges the SVG canvas. The actual path remains locked to
  // the exact outside edge of the orange CTA, with no visual gap.
  const OUTSET = 6;
  const TRACK_INSET = 1.35;
  const TRACK_WIDTH = 2.7;

  const rectWidth = Math.max(0, size.width - TRACK_INSET * 2);
  const rectHeight = Math.max(0, size.height - TRACK_INSET * 2);
  const rectRadius = Math.max(
    0,
    Math.min(radius - TRACK_INSET, rectWidth / 2, rectHeight / 2),
  );

  const perimeter = Math.max(
    1,
    2 * (rectWidth + rectHeight - 4 * rectRadius) + 2 * Math.PI * rectRadius,
  );

  const mainSparkLength = Math.min(124, Math.max(70, perimeter * 0.17));
  const coreSparkLength = Math.min(28, Math.max(16, perimeter * 0.04));

  const mainDashOffset = travel.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -perimeter],
  });
  const coreDashOffset = travel.interpolate({
    inputRange: [0, 1],
    outputRange: [-perimeter * 0.08, -perimeter * 1.08],
  });
  const auraOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.24],
  });
  const sparkOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });

  const borderReady = size.width > 0 && size.height > 0;
  const trackX = OUTSET + TRACK_INSET;
  const trackY = OUTSET + TRACK_INSET;

  return (
    <View
      style={[styles.glowBorderWrap, { borderRadius: radius }]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((current) => {
          if (
            Math.abs(current.width - width) < 0.5 &&
            Math.abs(current.height - height) < 0.5
          ) {
            return current;
          }
          return { width, height };
        });
      }}
    >
      <View style={[styles.glowInner, { borderRadius: radius }]}>
        {children}
      </View>

      {borderReady && (
        <Svg
          pointerEvents="none"
          width={size.width + OUTSET * 2}
          height={size.height + OUTSET * 2}
          style={[styles.glowSvg, { left: -OUTSET, top: -OUTSET }]}
        >
          <Defs>
            <SvgLinearGradient id="precisionGlow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#ffffff" stopOpacity="1" />
              <Stop offset="0.18" stopColor="#fff2cf" stopOpacity="1" />
              <Stop offset="0.48" stopColor={ACCENT_LIGHT} stopOpacity="1" />
              <Stop offset="0.76" stopColor={ACCENT} stopOpacity="1" />
              <Stop offset="1" stopColor="#ff6a00" stopOpacity="0.96" />
            </SvgLinearGradient>
          </Defs>

          {/* quiet baseline, exactly touching the CTA border */}
          <Rect
            x={trackX}
            y={trackY}
            width={rectWidth}
            height={rectHeight}
            rx={rectRadius}
            ry={rectRadius}
            fill="none"
            stroke="rgba(255,236,196,0.26)"
            strokeWidth={1}
          />

          {/* tightly attached orange aura */}
          <AnimatedSvgRect
            x={trackX}
            y={trackY}
            width={rectWidth}
            height={rectHeight}
            rx={rectRadius}
            ry={rectRadius}
            fill="none"
            stroke={ACCENT}
            strokeOpacity={auraOpacity}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={[
              mainSparkLength,
              Math.max(1, perimeter - mainSparkLength),
            ]}
            strokeDashoffset={mainDashOffset}
          />

          {/* main moving light */}
          <AnimatedSvgRect
            x={trackX}
            y={trackY}
            width={rectWidth}
            height={rectHeight}
            rx={rectRadius}
            ry={rectRadius}
            fill="none"
            stroke="url(#precisionGlow)"
            strokeOpacity={sparkOpacity}
            strokeWidth={TRACK_WIDTH}
            strokeLinecap="round"
            strokeDasharray={[
              mainSparkLength,
              Math.max(1, perimeter - mainSparkLength),
            ]}
            strokeDashoffset={mainDashOffset}
          />

          {/* compact white core creates the electric sparkle */}
          <AnimatedSvgRect
            x={trackX}
            y={trackY}
            width={rectWidth}
            height={rectHeight}
            rx={rectRadius}
            ry={rectRadius}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={0.98}
            strokeWidth={1.35}
            strokeLinecap="round"
            strokeDasharray={[
              coreSparkLength,
              Math.max(1, perimeter - coreSparkLength),
            ]}
            strokeDashoffset={coreDashOffset}
          />
        </Svg>
      )}
    </View>
  );
}

type HomeTopBarProps = {
  compact: boolean;
  onFleetPress: () => void;
  onProfilePress: () => void;
};

function HomeTopBar({
  compact,
  onFleetPress,
  onProfilePress,
}: HomeTopBarProps) {
  return (
    <View style={[styles.topBar, compact && styles.topBarCompact]}>
      <LinearGradient
        colors={["rgba(17,27,42,0.98)", "rgba(8,15,25,0.99)"]}
        locations={[0, 1]}  
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SoftGlow
        color={ACCENT}
        opacity={0.2}
        centerX="18%"
        centerY="28%"
        radius="72%"
        style={styles.topBarOrangeGlow}
      />

      <View pointerEvents="none" style={styles.topBarHighlight} />
      <View pointerEvents="none" style={styles.topBarBottomShade} />

      <View style={styles.brandBlock}>
        <View style={styles.appIconOuter}>
          <LinearGradient
            colors={["#ffffff", "#fff8e8", "#ffc55a", "#f08a00"]}
            locations={[0, 0.52, 0.82, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.appIcon}>
            <Image
              source={{ uri: BRAND_LOGO_URI }}
              style={styles.appIconImage}
              contentFit="contain"
              transition={250}
              cachePolicy="memory-disk"
              accessibilityLabel="Success Van Hire logo"
            />
          </View>
        </View>

        <View style={styles.brandCopy}>
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitle} numberOfLines={1}>
              Success Van Hire
            </Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={8} color={DARK} />
            </View>
          </View>

          <View style={styles.brandStatusRow}>
            <View style={styles.brandStatusDot} />
            <Text style={styles.brandMeta} numberOfLines={1}>
              Fleet available in London
            </Text>
            <View style={styles.brandStatusDivider} />
            <Text style={styles.brandLive}>Live</Text>
          </View>
        </View>
      </View>

      <View style={styles.headerActions}>
        <HeaderButton
          icon="car-sport-outline"
          label="View fleet"
          displayLabel="Fleet"
          onPress={onFleetPress}
        />
        <HeaderButton
          featured
          icon="person-outline"
          label="Open account"
          displayLabel="Account"
          onPress={onProfilePress}
        />
      </View>
    </View>
  );
}

type HeaderButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  displayLabel: string;
  onPress: () => void;
  featured?: boolean;
};

function HeaderButton({
  icon,
  label,
  displayLabel,
  onPress,
  featured,
}: HeaderButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = useCallback(
    (toValue: number) => {
      Animated.spring(scale, {
        toValue,
        tension: 340,
        friction: 18,
        useNativeDriver: true,
      }).start();
    },
    [scale],
  );

  return (
    <Animated.View
      style={[styles.headerActionItem, { transform: [{ scale }] }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.91)}
        onPressOut={() => animateTo(1)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.headerActionPressable}
      >
        <View
          style={[styles.headerButton, featured && styles.headerButtonFeatured]}
        >
          {featured && (
            <LinearGradient
              colors={["#ffc95f", "#ffad25", "#f08a00"]}
              locations={[0, 0.5, 1]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}

          <View pointerEvents="none" style={styles.headerButtonGloss} />
          <Ionicons
            name={icon}
            size={featured ? 19 : 18}
            color={featured ? DARK : "#f8fafc"}
          />
        </View>

        <Text
          style={[
            styles.headerButtonLabel,
            featured && styles.headerButtonLabelFeatured,
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

type InfoTileProps = {
  compact: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
};

function InfoTile({ compact, icon, value, label }: InfoTileProps) {
  return (
    <View style={[styles.infoTile, compact && styles.infoTileCompact]}>
      <LinearGradient
        colors={["rgba(20,33,51,0.91)", "rgba(7,14,24,0.94)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.infoTileHighlight} />

      <View style={[styles.infoIcon, compact && styles.infoIconCompact]}>
        <LinearGradient
          colors={["rgba(255,195,93,0.17)", "rgba(254,154,0,0.05)"]}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name={icon} size={compact ? 18 : 20} color={ACCENT} />
      </View>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.infoLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  softGlow: {
    position: "absolute",
    overflow: "hidden",
  },
  screen: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#05070c",
  },
  leftGlow: {
    position: "absolute",
    width: 310,
    height: 260,
    borderRadius: 160,
    left: -190,
    top: 82,
  },
  rightGlow: {
    position: "absolute",
    width: 350,
    height: 320,
    borderRadius: 180,
    right: -215,
    bottom: 28,
  },
  topGlow: {
    position: "absolute",
    width: 390,
    height: 270,
    borderRadius: 200,
    top: -132,
    alignSelf: "center",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },

  topBar: {
    minHeight: 86,
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,181,59,0.22)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.34,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 8 },
    }),
  },
  topBarCompact: {
    minHeight: 68,
    paddingVertical: 5,
  },
  topBarOrangeGlow: {
    position: "absolute",
    width: 170,
    height: 120,
    borderRadius: 90,
    left: -56,
    top: -62,
  },
  topBarHighlight: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,224,165,0.45)",
  },
  topBarBottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  brandBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingRight: 4,
  },
  appIconOuter: {
    width: 44,
    height: 44,
    borderRadius: 13,
    padding: 1.2,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.22,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 4 },
    }),
  },
  appIcon: {
    flex: 1,
    borderRadius: 11.8,
    overflow: "hidden",
    padding: 2.5,
    backgroundColor: "#ffffff",
  },
  appIconImage: {
    width: "100%",
    height: "100%",
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 1,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brandTitle: {
    flexShrink: 1,
    color: "#ffffff",
    fontSize: 13.5,
    lineHeight: 16,
    fontWeight: "900",
    letterSpacing: -0.25,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT_SOFT,
    borderWidth: 1,
    borderColor: "rgba(255,229,178,0.7)",
  },
  brandStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  brandStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#2fd87c",
    shadowColor: "#2fd87c",
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  brandMeta: {
    flexShrink: 1,
    color: "rgba(230,237,247,0.62)",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "700",
    letterSpacing: -0.05,
  },
  brandStatusDivider: {
    width: 1,
    height: 9,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 1,
  },
  brandLive: {
    color: "#31dd82",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 2,
  },
  headerActionItem: {
    width: 39,
  },
  headerActionPressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  headerButtonFeatured: {
    borderColor: "rgba(255,216,143,0.72)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 5 },
    }),
  },
  headerButtonGloss: {
    position: "absolute",
    top: 2,
    left: 7,
    right: 7,
    height: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  headerButtonLabel: {
    color: "rgba(239,244,251,0.72)",
    fontSize: 7.5,
    lineHeight: 9,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },
  headerButtonLabelFeatured: {
    color: "rgba(255,255,255,0.82)",
  },

  sliderSection: {
    marginTop: 14,
    marginBottom: 10,
  },
  heroSlide: {
    alignItems: "center",
  },
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "rgba(123,158,193,0.18)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.32,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 },
      },
      android: { elevation: 10 },
    }),
  },
  heroCardCompact: {},
  heroCardTiny: { borderRadius: 18 },
  heroTopEdge: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  heroArcOne: {
    position: "absolute",
    width: 236,
    height: 236,
    borderRadius: 118,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.16)",
    right: -106,
    top: 42,
  },
  heroArcTwo: {
    position: "absolute",
    width: 178,
    height: 178,
    borderRadius: 89,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.1)",
    right: -63,
    top: 84,
  },
  heroFloor: {
    position: "absolute",
    left: -54,
    right: -54,
    bottom: -50,
    height: 128,
    transform: [{ rotate: "-4deg" }],
  },
  heroLight: {
    position: "absolute",
    width: 220,
    height: 150,
    borderRadius: 112,
    right: -72,
    bottom: 10,
  },
  heroShine: {
    position: "absolute",
    zIndex: 3,
    top: -90,
    bottom: -90,
    width: 84,
  },
  livePill: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 6,
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.075)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  liveDotWrap: {
    width: 8,
    height: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  liveDotPulse: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    borderWidth: 1,
    borderColor: "rgba(187,255,211,0.72)",
  },
  liveText: {
    color: "rgba(248,250,252,0.84)",
    fontSize: 9,
    fontWeight: "800",
  },
  heroCopy: {
    position: "absolute",
    zIndex: 5,
    left: 14,
    top: 54,
    width: 174,
  },
  title: {
    color: "#ffffff",
    fontSize: 31,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  titleCompact: { fontSize: 28, lineHeight: 29 },
  titleRule: {
    width: 34,
    height: 3,
    borderRadius: 2,
    backgroundColor: ACCENT,
    marginTop: 9,
    marginBottom: 7,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.65,
        shadowRadius: 7,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 3 },
    }),
  },
  subtitle: {
    color: "rgba(232,238,247,0.72)",
    fontSize: 9.5,
    lineHeight: 14.5,
    fontWeight: "600",
    marginTop: 8,
  },
  subtitleCompact: { fontSize: 9, lineHeight: 13.5 },
  titleAccent: { color: ACCENT },
  subtitleAccent: { color: ACCENT_SOFT, fontWeight: "800" },
  trustBadge: {
    position: "absolute",
    zIndex: 7,
    left: 12,
    bottom: 13,
    minHeight: 38,
    paddingHorizontal: 8,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,184,61,0.3)",
  },
  trustIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.18)",
  },
  trustTitle: {
    color: ACCENT_SOFT,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  trustMeta: {
    color: "#f8fafc",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 1,
  },
  vanStage: {
    position: "absolute",
    zIndex: 5,
    right: -22,
    bottom: 2,
    width: 252,
    height: 177,
    justifyContent: "flex-end",
  },
  vanStageTiny: {
    width: 222,
    height: 150,
    right: -22,
    bottom: 8,
  },
  vanShadow: {
    position: "absolute",
    width: "74%",
     borderRadius: 60,
    right: 20,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  vanImage: { width: "100%", height: 168 },
  vanImageTiny: { height: 142 },

  dotsRow: {
    flexDirection: "row",
    gap: 7,
    alignSelf: "center",
    alignItems: "center",
    marginTop: 9,
    minHeight: 9,
  },
  dot: {
    height: 7,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: ACCENT,
  },
  dotHighlight: {
    position: "absolute",
    top: 0,
    left: 2,
    right: 2,
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.7)",
  },

  tileRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: -6,
  },
  tileRowTiny: { gap: 8, marginBottom: 9 },
  infoTile: {
    flex: 1,
    height: 102,
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingTop: 8,
    paddingBottom: 7,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(111,147,184,0.18)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 3 },
    }),
  },
  infoTileCompact: {
    height: 92,
    borderRadius: 13,
    paddingTop: 7,
    paddingBottom: 6,
  },
  infoTileHighlight: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.11)",
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.18)",
    marginBottom: 7,
  },
  infoIconCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 6,
  },
  infoValue: {
    minHeight: 28,
    color: "#f8fafc",
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: "900",
    letterSpacing: -0.15,
    textAlign: "center",
  },
  infoLabel: {
    color: "rgba(213,222,234,0.48)",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },

  reserveWrap: {
    marginHorizontal: 0,
  },
  glowBorderWrap: {
    position: "relative",
    overflow: "visible",
    backgroundColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 8 },
    }),
  },
  glowInner: {
    position: "relative",
    zIndex: 2,
    overflow: "hidden",
  },
  glowSvg: {
    position: "absolute",
    zIndex: 4,
  },
});

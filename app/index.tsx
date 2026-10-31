import React, { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
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
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import ReservationForm from "@/components/global/ReservationForm";
import { BRAND_LOGO_URI } from "@/constants/branding";

const ACCENT = "#fe9a00";
const ACCENT_SOFT = "#ffb83d";
const DARK = "#07111f";

const AUTOPLAY_MS = 3500;

type VanSlide = {
  uri: string;
  name: string;
  tag: string;
  title: string;
  accent: string;
  description: string;
  kind: "brand" | "vehicle";
};

const VAN_IMAGES: VanSlide[] = [
  {
    uri: BRAND_LOGO_URI,
    name: "Success Van Hire",
    tag: "Van hire in London",
    title: "",
    accent: "",
    description: "successvanhire.co.uk",
    kind: "brand",
  },
  {
    uri: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/14seater.png",
    name: "14 seater",
    tag: "Group travel",
    title: "Group",
    accent: "travel",
    description: "Travel together comfortably, with space for family, friends and luggage.",
    kind: "vehicle",
  },
  {
    uri: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/louton.png",
    name: "Luton van",
    tag: "Home moves",
    title: "Moving ",
    accent: "made easy",
    description: "Make moving simpler with extra space for furniture, boxes and deliveries.",
    kind: "vehicle",
  },
];

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

    entrance.start();
    return () => entrance.stop();
  }, [fadeIn, slideUp]);

  useFocusEffect(useCallback(() => {
    const ambientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambient, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(ambient, {
          toValue: 0,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );

    ambientLoop.start();
    return () => ambientLoop.stop();
  }, [ambient]));

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
  const activeIndexRef = useRef(0);
  const flatListRef = useRef<FlatList<VanSlide>>(null);
  const autoplayTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserInteracting = useRef(false);
  const isFocused = useRef(false);
  const scrollX = useRef(new Animated.Value(0)).current;

  const clearAutoplay = useCallback(() => {
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    clearAutoplay();
    if (!isFocused.current) return;

    autoplayTimer.current = setInterval(() => {
      if (isUserInteracting.current) return;

      const nextIndex = (activeIndexRef.current + 1) % VAN_IMAGES.length;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
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

  useFocusEffect(useCallback(() => {
    isFocused.current = true;
    startAutoplay();

    return () => {
      isFocused.current = false;
      clearAutoplay();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      isUserInteracting.current = false;
    };
  }, [clearAutoplay, startAutoplay]));

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

  const onScrollSettled = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const rawIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      const nextIndex = Math.min(VAN_IMAGES.length - 1, Math.max(0, rawIndex));

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      scheduleAutoplay();
    },
    [scheduleAutoplay, width],
  );

  const goToIndex = useCallback(
    (index: number) => {
      isUserInteracting.current = true;
      clearAutoplay();
      activeIndexRef.current = index;
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
        onScrollEndDrag={onScrollSettled}
        onMomentumScrollEnd={onScrollSettled}
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
  const livePulse = useRef(new Animated.Value(0)).current;

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

  const vanTranslate = scrollX.interpolate({
    inputRange,
    outputRange: [18, 0, -18],
    extrapolate: "clamp",
  });
  const vanLift = scrollX.interpolate({
    inputRange,
    outputRange: [4, 0, 4],
    extrapolate: "clamp",
  });
  const vanScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.97, 1, 0.97],
    extrapolate: "clamp",
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

        {data.kind === "brand" ? (
          <Animated.View
            style={[
              styles.brandSlideContent,
              { transform: [{ translateY: vanLift }, { scale: vanScale }] },
            ]}
          >
            <Text style={styles.brandSlideEyebrow}>LONDON VAN HIRE</Text>
            <Image
              source={{ uri: data.uri }}
              style={styles.brandSlideLogo}
              contentFit="contain"
              cachePolicy="memory-disk"
              accessibilityLabel="Success Van Hire logo"
            />
            <Text style={styles.brandSlideName}>{data.name}</Text>
            <Text style={styles.brandSlideDescription}>{data.description}</Text>
          </Animated.View>
        ) : <>
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
          <Text style={styles.liveText}>Van hire in London</Text>
        </View>

        <View style={[styles.heroCopy, { width: width * 0.43 }]}>
          <Text style={[styles.title, compact && styles.titleCompact]}>
            {data.title}  
            <Text style={styles.titleAccent}>{data.accent}</Text>
          </Text>
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
            {data.description}
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
              width: width * 0.54,
              right: 0,
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
            transition={0}
            cachePolicy="memory-disk"
            accessibilityLabel={data.name}
          />
        </Animated.View>
        </>}
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
  radius = 24,
}: PrecisionGlowBorderProps) {
  return (
    <LinearGradient
      colors={["#fff4cc", "#ffc45e", "#f28a00", "#ffcf70"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.glowBorderWrap, { borderRadius: radius }]}
    >
      <View style={[styles.glowInner, { borderRadius: radius - 2 }]}>
        {children}
      </View>
    </LinearGradient>
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
      <View pointerEvents="none" style={styles.centerBrand}>
        <Image
          source={{ uri: BRAND_LOGO_URI }}
          style={styles.centerBrandImage}
          contentFit="contain"
          transition={250}
          cachePolicy="memory-disk"
          accessibilityLabel="Success Van Hire logo"
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
    width: 50,
    height: 50,
    borderRadius: 13,
    padding: 1.2,
    overflow: "hidden",
  },
  appIcon: {
    flex: 1,
    overflow: "hidden",
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
    justifyContent: "space-between",
    width: "100%",
    zIndex: 2,
  },
  centerBrand: {
    position: "absolute",
    left: 54,
    right: 54,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  centerBrandImage: {
    width: "100%",
    maxWidth: 184,
    height: 68,
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
  brandSlideContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  brandSlideEyebrow: {
    color: "#ffbd62",
    fontSize: 10,
    fontWeight: "800",
  },
  brandSlideLogo: {
    width: "100%",
    maxWidth: 250,
    height: 112,
  },
  brandSlideName: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  brandSlideDescription: {
    color: "#e2e8f0",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    textAlign: "center",
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
    top: 50,
    width: 174,
  },
  title: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: 0,
  },
  titleCompact: { fontSize: 23, lineHeight: 26 },
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
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  subtitleCompact: { fontSize: 9.5, lineHeight: 13.5 },
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
    padding: 1.5,
    overflow: "visible",
    backgroundColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.35,
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
});

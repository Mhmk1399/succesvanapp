import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = height * 0.52;
const CARD_SPACING = 12;
const SIDE_PADDING = (width - CARD_WIDTH) / 2;

// Premium color palette
const COLORS = {
  accent: "#FF9500",
  accentLight: "rgba(255, 149, 0, 0.15)",
  accentGlow: "rgba(255, 149, 0, 0.4)",
  dark: "#0a0a0a",
  card: "rgba(30, 30, 35, 0.85)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  glass: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
  text: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.6)",
  textTertiary: "rgba(255, 255, 255, 0.4)",
};

export type Van = {
  id: string;
  name: string;
  image: string | number;
  seats: number;
  fuel: string;
  doors: number;
  gear:
    | string
    | {
        availableTypes: ("manual" | "automatic")[];
        automaticExtraCost: number;
      };
  pricePerHour: number;
  cargo?: string;
  rating?: number;
};

type HorizontalVanListProps = {
  vans: Van[];
  onSelectVan?: (van: Van) => void;
  onViewAll?: () => void;
};

export default function HorizontalVanList({
  vans,
  onSelectVan,
  onViewAll,
}: HorizontalVanListProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<Animated.FlatList<Van>>(null);

  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const newIndex = Math.round(
        e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING)
      );
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < vans.length) {
        setActiveIndex(newIndex);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [activeIndex, vans.length]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Van; index: number }) => {
      const inputRange = [
        (index - 1) * (CARD_WIDTH + CARD_SPACING),
        index * (CARD_WIDTH + CARD_SPACING),
        (index + 1) * (CARD_WIDTH + CARD_SPACING),
      ];

      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.92, 1, 0.92],
        extrapolate: "clamp",
      });

      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.5, 1, 0.5],
        extrapolate: "clamp",
      });

      const translateY = scrollX.interpolate({
        inputRange,
        outputRange: [20, 0, 20],
        extrapolate: "clamp",
      });

      const rotateY = scrollX.interpolate({
        inputRange,
        outputRange: ["5deg", "0deg", "-5deg"],
        extrapolate: "clamp",
      });

      return (
        <VanCard
          van={item}
          index={index}
          scale={scale}
          opacity={opacity}
          translateY={translateY}
          rotateY={rotateY}
          scrollX={scrollX}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSelectVan?.(item);
          }}
        />
      );
    },
    [scrollX, onSelectVan]
  );

  if (!vans || vans.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header with Glass Effect */}
      <View style={styles.headerWrapper}>
        <BlurView intensity={20} tint="dark" style={styles.headerBlur}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.titleRow}>
                <View style={styles.titleAccent} />
                <Text style={styles.title}>Featured Vans</Text>
              </View>
              <Text style={styles.subtitle}>
                {vans.length} premium vehicles available
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onViewAll?.();
              }}
              style={({ pressed }) => [
                styles.viewAllButton,
                pressed && styles.viewAllButtonPressed,
              ]}
            >
              <Text style={styles.viewAllText}>See All</Text>
              <View style={styles.viewAllIcon}>
                <Ionicons name="arrow-forward" size={14} color={COLORS.dark} />
              </View>
            </Pressable>
          </View>
        </BlurView>
      </View>

      {/* Cards Carousel */}
      <Animated.FlatList
        ref={flatListRef}
        data={vans}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate={Platform.OS === "ios" ? 0 : 0.98}
        bounces={true}
        overScrollMode="never"
        contentContainerStyle={{
          paddingHorizontal: SIDE_PADDING,
          paddingVertical: 16,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        nestedScrollEnabled
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + CARD_SPACING,
          offset: (CARD_WIDTH + CARD_SPACING) * index,
          index,
        })}
      />

      {/* Quick Navigation */}
    </View>
  );
}

type VanCardProps = {
  van: Van;
  index: number;
  scale: Animated.AnimatedInterpolation<number>;
  opacity: Animated.AnimatedInterpolation<number>;
  translateY: Animated.AnimatedInterpolation<number>;
  rotateY: Animated.AnimatedInterpolation<string>;
  scrollX: Animated.Value;
  onPress?: () => void;
};

function VanCard({
  van,
  index,
  scale,
  opacity,
  translateY,
  rotateY,
  scrollX,
  onPress,
}: VanCardProps) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Entrance animation
    Animated.spring(entranceAnim, {
      toValue: 1,
      delay: index * 80,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Shimmer effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const imageSource =
    typeof van.image === "string" ? { uri: van.image } : van.image;

  const gearText =
    typeof van.gear === "object"
      ? van.gear.availableTypes.includes("automatic")
        ? "Auto"
        : "Manual"
      : van.gear === "automatic"
      ? "Auto"
      : "Manual";

  // Parallax effect for image
  const imageTranslateX = scrollX.interpolate({
    inputRange: [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ],
    outputRange: [-30, 0, 30],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [
            {
              scale: Animated.multiply(
                scale,
                Animated.multiply(pressAnim, entranceAnim)
              ),
            },
            { translateY },
            { perspective: 1000 },
            { rotateY },
          ],
          opacity: Animated.multiply(opacity, entranceAnim),
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardPressable}
      >
        {/* Card Background with Glass Effect */}
        <View style={styles.card}>
          {/* Image Section */}
          <View style={styles.imageWrapper}>
            <Animated.View
              style={[
                styles.imageContainer,
                { transform: [{ translateX: imageTranslateX }] },
              ]}
            >
              <Image
                source={imageSource}
                style={styles.image}
                contentFit="cover"
                transition={300}
              />
            </Animated.View>

            {/* Gradient Overlays */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.3)", "rgba(10,10,10,0.95)"]}
              locations={[0, 0.5, 1]}
              style={styles.gradient}
            />
          </View>

          {/* Content Section with Glass Effect */}
          <BlurView intensity={25} tint="dark" style={styles.contentBlur}>
            <View style={styles.content}>
              {/* Van Name */}
              <View style={styles.nameRow}>
                <Text style={styles.vanName} numberOfLines={1}>
                  {van.name}
                </Text>
              </View>

              {/* Specs Row */}
              <View style={styles.specsContainer}>
                <View style={styles.specPill}>
                  <Ionicons name="people" size={14} color={COLORS.accent} />
                  <Text style={styles.specValue}>{van.seats}</Text>
                  <Text style={styles.specLabel}>Seats</Text>
                </View>

                <View style={styles.specPill}>
                  <Ionicons name="cog" size={14} color={COLORS.accent} />
                  <Text style={styles.specValue}>{gearText}</Text>
                </View>

                <View style={styles.specPill}>
                  <Ionicons name="flash" size={14} color={COLORS.accent} />
                  <Text style={styles.specValue}>{van.fuel}</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Starting from</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.currency}>£</Text>
                    <Text style={styles.price}>{van.pricePerHour}</Text>
                    <Text style={styles.priceUnit}>/hour</Text>
                  </View>
                </View>

                <Pressable
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.bookButton,
                    pressed && styles.bookButtonPressed,
                  ]}
                >
                  <LinearGradient
                    colors={[COLORS.accent, "#E68900"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bookButtonGradient}
                  >
                    <Text style={styles.bookButtonText}>Book</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={COLORS.dark}
                    />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </BlurView>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  headerWrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  headerBlur: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  titleAccent: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
    marginLeft: 14,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: 100,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  viewAllButtonPressed: {
    backgroundColor: COLORS.accentLight,
    transform: [{ scale: 0.98 }],
  },
  viewAllText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  viewAllIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: CARD_SPACING / 2,
  },
  cardPressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  cardGlow: {
    position: "absolute",
    bottom: -10,
    left: "10%",
    right: "10%",
    height: 60,
    backgroundColor: COLORS.accentGlow,
    borderRadius: 100,
    opacity: 0.3,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 40,
      },
    }),
  },
  imageWrapper: {
    flex: 1.2,
    overflow: "hidden",
  },
  imageContainer: {
    width: "120%",
    height: "100%",
    marginLeft: "-10%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.1)",
    transform: [{ skewX: "-20deg" }],
  },
  badgeRow: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  ratingText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  featuredText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  contentBlur: {
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    overflow: "hidden",
  },
  content: {
    padding: 20,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  vanName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  specsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  specPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  specValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  specLabel: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currency: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: "700",
  },
  price: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  priceUnit: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 2,
  },
  bookButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  bookButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  bookButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  bookButtonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "700",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  quickNav: {
    alignItems: "center",
    marginTop: 12,
  },
  quickNavText: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: "500",
  },
});

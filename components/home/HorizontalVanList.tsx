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
import GlassView from "@/components/global/GlassView";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { ACCENT } from "../global/BookingModal/constants";
import { appTheme } from "@/constants/appTheme";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = Math.min(width * 0.5, 210);
const CARD_HEIGHT = 184;
const CARD_SPACING = 10;
const SIDE_PADDING = 18;

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
  loading?: boolean;
  error?: string | null;
  onSelectVan?: (van: Van) => void;
  onViewAll?: () => void;
};

export default function HorizontalVanList({
  vans,
  loading = false,
  error,
  onSelectVan,
  onViewAll,
}: HorizontalVanListProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<Animated.FlatList<Van>>(null);

  const onMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const newIndex = Math.round(
        e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING),
      );
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < vans.length) {
        setActiveIndex(newIndex);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [activeIndex, vans.length],
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
    [scrollX, onSelectVan],
  );

  return (
    <View style={styles.container}>
      {/* Header with Glass Effect */}
      <View style={styles.headerWrapper}>
        <GlassView intensity={14} tint="dark" style={styles.headerBlur}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.titleRow}>
                <View style={styles.titleAccent} />
                <Text style={styles.title}>Featured Vans</Text>
              </View>
              <Text style={styles.subtitle}>
                {loading
                  ? "Finding the best options for you"
                  : error
                    ? "We could not refresh the fleet"
                    : vans.length > 0
                      ? `${vans.length} premium vehicles available`
                      : "Browse our available fleet"}
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
        </GlassView>
      </View>

      {loading ? (
        <LoadingFleetState />
      ) : !vans || vans.length === 0 ? (
        <EmptyFleetState
          message={
            error ||
            "No featured vans are showing right now. You can still browse the full fleet."
          }
          onPress={onViewAll}
        />
      ) : (
        <>
          <Animated.FlatList
            ref={flatListRef}
            data={vans}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_SPACING}
            decelerationRate={Platform.OS === "ios" ? 0 : 0.98}
            bounces
            overScrollMode="never"
            contentContainerStyle={{
              paddingHorizontal: SIDE_PADDING,
              paddingVertical: 10,
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true },
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
          <FleetPagination count={vans.length} activeIndex={activeIndex} />
        </>
      )}

      {/* Quick Navigation */}
    </View>
  );
}

function FleetPagination({
  count,
  activeIndex,
}: {
  count: number;
  activeIndex: number;
}) {
  if (count < 2) return null;

  return (
    <View style={styles.pagination}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === activeIndex && styles.dotActive]}
        />
      ))}
    </View>
  );
}

function LoadingFleetState() {
  return (
    <View style={styles.stateRow}>
      {[0, 1].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonLineWide} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonButton} />
        </View>
      ))}
    </View>
  );
}

function EmptyFleetState({
  message,
  onPress,
}: {
  message: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.emptyWrap}>
      <GlassView intensity={24} tint="dark" style={styles.emptyGlass}>
        <View style={styles.emptyIcon}>
          <Ionicons name="car-sport-outline" size={22} color={COLORS.accent} />
        </View>
        <Text style={styles.emptyTitle}>Fleet is loading slowly</Text>
        <Text style={styles.emptyText}>{message}</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress?.();
          }}
          style={({ pressed }) => [
            styles.emptyButton,
            pressed && styles.bookButtonPressed,
          ]}
        >
          <Text style={styles.emptyButtonText}>View all vans</Text>
          <Ionicons name="arrow-forward" size={15} color={COLORS.dark} />
        </Pressable>
      </GlassView>
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
      ]),
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
                Animated.multiply(pressAnim, entranceAnim),
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

            <LinearGradient
              colors={["rgba(0,0,0,0.04)", "rgba(8,11,18,0.68)"]}
              locations={[0.35, 1]}
              style={styles.imageShade}
            />
          </View>

          {/* Content Section with Glass Effect */}
          <GlassView intensity={14} tint="dark" style={styles.contentBlur}>
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
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12.29 3.29L20 11v4.13a1 1 0 01-.86 1l-2.06.3A6.11 6.11 0 0012 21H5a1 1 0 01-1-1V4a1 1 0 011-1h6.59a1 1 0 01.7.29zM20 11H4M8 15h2"
                      stroke={ACCENT}
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </Svg>
                  <Text style={styles.specValue}>{van.doors}</Text>
                  <Text style={styles.specLabel}>Doors</Text>
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
                  <Text style={styles.priceLabel}>From</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.currency}>£</Text>
                    <Text style={styles.price}>
                      {Number(van.pricePerHour || 0).toFixed(0)}
                    </Text>
                    <Text style={styles.priceUnit}>/day</Text>
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
                    <Text style={styles.bookButtonText}>View van</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={COLORS.dark}
                    />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </GlassView>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginBottom: 8,
  },
  headerWrapper: {
    display: "none",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 18,
    overflow: "hidden",
  },
  headerBlur: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.78)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 18,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    paddingLeft: 12,
    paddingRight: 7,
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
    fontSize: 11,
    fontWeight: "800",
  },
  viewAllIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  stateRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  skeletonCard: {
    flex: 1,
    minHeight: 156,
    borderRadius: 20,
    padding: 14,
    justifyContent: "flex-end",
    backgroundColor: appTheme.color.panelSoft,
    borderWidth: 1,
    borderColor: appTheme.color.border,
    overflow: "hidden",
  },
  skeletonImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  skeletonLineWide: {
    width: "72%",
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.13)",
    marginBottom: 10,
  },
  skeletonLine: {
    width: "48%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 18,
  },
  skeletonButton: {
    width: "58%",
    height: 42,
    borderRadius: 16,
    backgroundColor: appTheme.color.accentSoft,
  },
  emptyWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyGlass: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: appTheme.color.border,
    padding: 18,
    alignItems: "center",
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.color.accentSoft,
    marginBottom: 12,
  },
  emptyTitle: {
    color: appTheme.color.text,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    color: appTheme.color.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 7,
    maxWidth: 280,
  },
  emptyButton: {
    minHeight: 44,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.accent,
  },
  emptyButtonText: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: "900",
  },
  cardPressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(15,23,42,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.24,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
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
    flex: 0.9,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageShade: {
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
    justifyContent: "flex-end",
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
    paddingHorizontal: 11,
    paddingVertical: 7,
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
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(8,12,22,0.9)",
    overflow: "hidden",
  },
  content: {
    padding: 12,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  vanName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0,
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
    display: "none",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  specPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  specValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  specLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  divider: {
    display: "none",
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    display: "none",
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currency: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "800",
  },
  price: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
  },
  priceUnit: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 2,
  },
  bookButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  bookButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  bookButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  bookButtonText: {
    color: COLORS.dark,
    fontSize: 11,
    fontWeight: "900",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  dotActive: {
    width: 18,
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

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  Animated,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const ACCENT = "#fe9a00";
const DARK = "#0f172a";

export type Van = {
  id: string;
  name: string;
  image: string | number;
  seats: number;
  fuel: string;
  doors: number;
  gear: string;
  showPrice?: number;
  pricingTiers?: { minDays: number; maxDays: number; pricePerDay: number }[];
  extraHoursRate?: number;
  cargo?: string;
};

type VanListProps = {
  vans: Van[];
  onSelectVan?: (van: Van) => void;
  onBookVan?: (van: Van) => void;
  flatListRef?: React.RefObject<FlatList | null>;
  highlightedVanId?: string | null;
};

export default function VanList({
  vans,
  onSelectVan,
  onBookVan,
  flatListRef,
  highlightedVanId,
}: VanListProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1000);
  };
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const staticHeaderOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const renderItem = ({ item, index }: { item: Van; index: number }) => (
    <VanCard
      van={item}
      index={index}
      isHighlighted={highlightedVanId === item.id}
      onPress={() => {
        Haptics.selectionAsync();
        onSelectVan?.(item);
      }}
      onBook={() => {
        Haptics.selectionAsync();
        onBookVan?.(item);
      }}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={vans}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 120, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="car-outline" size={80} color={ACCENT} />
            </View>
            <Text style={styles.emptyTitle}>No Vans Available</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find any vans matching your criteria. Try adjusting
              your filters.
            </Text>
          </View>
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef?.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          });
        }}
      />

      {/* Floating Blur Header */}
      <Animated.View
        style={[styles.floatingHeader, { opacity: headerOpacity }]}
      >
        <BlurView intensity={80} tint="dark" style={styles.blurHeader}>
          <Text style={styles.floatingTitle}>
            Choose Your{" "}
            <Text style={styles.floatingTitleAccent}>Perfect Van</Text>
          </Text>
        </BlurView>
      </Animated.View>

      {/* Static Header */}
      <Animated.View
        style={[styles.staticHeader, { opacity: staticHeaderOpacity }]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#f9fafb" />
        </Pressable>
        <Text style={styles.title}>Choose Your Van</Text>
        <Text style={styles.subtitle}>
          Find the ideal van for your needs from our modern fleet.
        </Text>
      </Animated.View>
    </View>
  );
}

type VanCardProps = {
  van: Van;
  index: number;
  isHighlighted?: boolean;
  onPress?: () => void;
  onBook?: () => void;
};

function VanCard({ van, index, isHighlighted, onPress, onBook }: VanCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const imageScale = useRef(new Animated.Value(1.2)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 150,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(imageScale, {
        toValue: 1,
        duration: 800,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isHighlighted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(highlightAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(highlightAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ]),
        { iterations: 2 }
      ).start();
    }
  }, [isHighlighted]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
      Animated.timing(imageScale, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }),
      Animated.spring(imageScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }),
    ]).start();
  };

  const imageSource =
    typeof van.image === "string" ? { uri: van.image } : van.image;

  const borderColor = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(148,163,184,0.5)", "rgba(254,154,0,1)"],
  });

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale }, { translateY }],
          opacity,
        },
      ]}
    >
      <Animated.View style={[styles.card, { borderColor }]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.95 }]}
        >
          <View style={styles.imageContainer}>
            <Animated.View style={{ transform: [{ scale: imageScale }] }}>
              <Image
                source={imageSource}
                style={styles.image}
                contentFit="cover"
              />
            </Animated.View>
            <LinearGradient
              colors={[
                "rgba(0,0,0,0.9)",
                "rgba(0,0,0,0.1)",
                "rgba(0,0,0,0.85)",
              ]}
              locations={[0, 0.5, 1]}
              style={styles.gradientOverlay}
            />
          </View>

          <View style={styles.overlayContent}>
            <View>
              <Text style={styles.vanName} numberOfLines={1}>
                {van.name}
              </Text>
              <Text style={styles.vanSub}>
                {van.cargo ? van.cargo : "Modern van · or similar"}
              </Text>

              <View style={styles.chipsRow}>
                <Chip icon="people-outline" label={`${van.seats} seats`} />
                <Chip icon="car-outline" label={`${van.doors} doors`} />
                <Chip icon="flame-outline" label={van.fuel} />
              </View>
            </View>

            <View style={styles.bottomRow}>
              <View>
                <View style={styles.gearRow}>
                  <Ionicons name="settings-outline" size={14} color={ACCENT} />
                  <Text style={styles.gearText}>
                    {van.gear === "manual,automatic"
                      ? "Manual & Automatic"
                      : van.gear.charAt(0).toUpperCase() + van.gear.slice(1)}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceValue}>
                    £{van.showPrice || 0}
                  </Text>
                  <Text style={styles.priceUnit}>/ day</Text>
                </View>
              </View>

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onBook?.();
                }}
                style={({ pressed }) => [
                  styles.bookButton,
                  pressed && styles.bookButtonPressed,
                ]}
              >
                <Text style={styles.bookButtonText}>Book Now</Text>
                <Ionicons name="chevron-forward" size={16} color="#444444ff" />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

type ChipProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

function Chip({ icon, label }: ChipProps) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={13} color={ACCENT} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flex: 1,
    marginTop: 36,
  },
  staticHeader: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  floatingHeader: {
    position: "absolute",
    top: -40,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  blurHeader: {
    paddingVertical: 16,
    paddingTop: 50,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: -10,
    top: -5,
    zIndex: 999,
    padding: 8,
  },
  floatingTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  floatingTitleAccent: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: "900",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },
  titleAccent: {
    color: ACCENT,
  },
  subtitle: {
    color: "#fffffff5",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 60,
  },

  cardWrapper: {
    width: "100%",
    alignSelf: "center",
  },
  card: {
    width: CARD_WIDTH,
    alignSelf: "center",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#020617",
    borderWidth: 2,
  },
  imageContainer: {
    width: "100%",
    height: 430,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: "space-between",
  },
  vanName: {
    color: "#f9fafb",
    fontSize: 20,
    fontWeight: "900",
  },
  vanSub: {
    color: "#d1d5db",
    fontSize: 12,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.7)",
    borderWidth: 1,
    borderColor: "rgba(248,250,252,0.2)",
  },
  chipText: {
    color: "#e5e7eb",
    fontSize: 11,
    marginLeft: 4,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  gearRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    marginBottom: 4,
  },
  gearText: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    columnGap: 4,
  },
  priceValue: {
    color: "#f9fafb",
    fontSize: 22,
    fontWeight: "900",
  },
  priceUnit: {
    color: "#d1d5db",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    backgroundColor: ACCENT,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    minWidth: 120,
    justifyContent: "center",
  },
  bookButtonPressed: {
    backgroundColor: "#f59e0b",
    transform: [{ scale: 0.97 }],
  },
  bookButtonText: {
    color: DARK,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(254,154,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(254,154,0,0.3)",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#f9fafb",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
});

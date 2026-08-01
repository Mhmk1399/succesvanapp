import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
// Install once in the project: npx expo install expo-video
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { Category } from "@/types/type";
import { categoryService } from "@/services/categoryService";
import BookingModal from "@/components/global/BookingModal";
import type { Van } from "@/components/global/vanlist";

const ACCENT = "#fe9a00";
const ACCENT_LIGHT = "#ffc14f";
const SCREEN_BG = "#02070d";
const CARD_BG = "#07111c";
const BORDER = "rgba(111,147,184,0.18)";
const MUTED = "rgba(229,236,245,0.56)";

type FleetFilter = "all" | "automatic" | "seats" | "bestValue";
type SortMode = "recommended" | "priceLow" | "priceHigh";

const SORT_LABELS: Record<SortMode, string> = {
  recommended: "Recommended",
  priceLow: "Price: Low to High",
  priceHigh: "Price: High to Low",
};

export default function VansScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [selectedVan, setSelectedVan] = useState<Van | null>(null);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingVan, setBookingVan] = useState<Van | null>(null);
  const [vans, setVans] = useState<Van[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList<Van>>(null);
  const [highlightedVanId, setHighlightedVanId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FleetFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingVanId, setPlayingVanId] = useState<string | null>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Van>[] }) => {
      setPlayingVanId((current) => {
        if (!current) return null;
        return viewableItems.some(({ item }) => item?.id === current)
          ? current
          : null;
      });
    },
  ).current;

  const contentWidth = Math.min(width - 28, 390);
  const compact = width < 370;

  // Keep the original safety guard exactly as before.
  const safeVans = useMemo<Van[]>(
    () => (Array.isArray(vans) ? vans.filter((van) => van && van.id) : []),
    [vans],
  );

  const displayedVans = useMemo(() => {
    let next = [...safeVans];

    if (activeFilter === "automatic") {
      next = next.filter((van) => hasAutomaticGear(van.gear));
    } else if (activeFilter === "seats") {
      next = next.filter((van) => Number(van.seats || 0) >= 3);
    } else if (activeFilter === "bestValue") {
      const prices = safeVans
        .map(getVanPriceNumber)
        .filter((price) => price > 0)
        .sort((a, b) => a - b);

      if (prices.length > 0) {
        const middle = Math.floor(prices.length / 2);
        const threshold =
          prices.length % 2 === 0
            ? (prices[middle - 1] + prices[middle]) / 2
            : prices[middle];
        next = next.filter((van) => {
          const price = getVanPriceNumber(van);
          return price > 0 && price <= threshold;
        });
      }
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery) {
      next = next.filter((van) => matchesVanSearch(van, normalizedQuery));
    }

    if (sortMode === "priceLow") {
      next.sort((a, b) => getVanPriceNumber(a) - getVanPriceNumber(b));
    } else if (sortMode === "priceHigh") {
      next.sort((a, b) => getVanPriceNumber(b) - getVanPriceNumber(a));
    }

    return next;
  }, [activeFilter, safeVans, searchQuery, sortMode]);

  useEffect(() => {
    setPlayingVanId(null);
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, [activeFilter, searchQuery, sortMode]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (user) {
      checkPendingBooking();
    }
  }, [user]);

  useEffect(() => {
    if (params.selectedVanId && displayedVans.length > 0) {
      setHighlightedVanId(params.selectedVanId as string);
      const index = displayedVans.findIndex(
        (van) => van.id === params.selectedVanId,
      );

      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }, 300);

        setTimeout(() => setHighlightedVanId(null), 3000);
      }
    }
  }, [displayedVans, params.selectedVanId]);

  const checkPendingBooking = async () => {
    try {
      const pendingVan = await AsyncStorage.getItem("pendingBookingVan");

      if (pendingVan) {
        const van = JSON.parse(pendingVan);
        await AsyncStorage.removeItem("pendingBookingVan");
        setBookingVan(van);
        setBookingModalVisible(true);
      }
    } catch (error) {
      console.log("Check pending booking error:", error);
    }
  };

  const loadCategories = async () => {
    try {
      console.log("=== DEBUGGING CATEGORY SERVICE ===");
      console.log("categoryService object:", categoryService);
      console.log("categoryService type:", typeof categoryService);
      console.log("categoryService.getAll:", categoryService?.getAll);
      console.log("API URL:", process.env.EXPO_PUBLIC_CATEGORIES_API);

      if (!categoryService) {
        throw new Error("categoryService is undefined - import failed");
      }

      if (!categoryService.getAll) {
        throw new Error(
          "categoryService.getAll is undefined - check service exports",
        );
      }

      console.log("Calling categoryService.getAll()...");
      const result = await categoryService.getAll();
      console.log("Result received:", result);

      if (result.success) {
        let mappedVans: Van[] = result.data.map((cat: Category) => ({
          id: cat._id || "",
          name: typeof cat.name === "string" ? cat.name : "Unknown Van",
          image: cat.image || require("@/assets/images/van.png"),
          video: cat.video,
          purpose: typeof cat.purpose === "string" ? cat.purpose : "",
          seats: typeof cat.seats === "number" ? cat.seats : 2,
          fuel: typeof cat.fuel === "string" ? cat.fuel : "Diesel",
          doors: typeof cat.doors === "number" ? cat.doors : 2,
          gear:
            typeof cat.gear === "string"
              ? cat.gear
              : typeof cat.gear === "object" && cat.gear?.availableTypes
              ? cat.gear
              : "manual",
          showPrice: typeof cat.showPrice === "number" ? cat.showPrice : 0,
          pricingTiers: cat.pricingTiers || [],
          extraHoursRate: cat.extrahoursRate || cat.extraHoursRate || 0,
          expert: typeof cat.expert === "string" ? cat.expert : "No",
          properties: Array.isArray(cat.properties) ? cat.properties : [],
          rules: Array.isArray(cat.rules) ? cat.rules : [],
          requiredLicense: cat.requiredLicense,
          selloffer: typeof cat.selloffer === "number" ? cat.selloffer : 0,
        }));

        if (params.category) {
          mappedVans = mappedVans.filter((van) => van.id === params.category);
        }

        console.log("Mapped vans count:", mappedVans.length);
        setVans(mappedVans);
      }
    } catch (error) {
      console.error("=== LOAD CATEGORIES ERROR ===");
      console.error("Error type:", error?.constructor?.name);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : String(error),
      );
      console.error("Full error:", error);
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVan = (van: Van) => {
    setSelectedVan(van);
  };

  const handleBookVan = (van: Van) => {
    if (user) {
      setBookingVan(van);
      setBookingModalVisible(true);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  };

  const cycleSortMode = () => {
    setSortMode((current) => {
      if (current === "recommended") return "priceLow";
      if (current === "priceLow") return "priceHigh";
      return "recommended";
    });
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <ScreenBackground />
        <VansLoadingSkeleton
          contentWidth={contentWidth}
          topInset={insets.top}
          compact={compact}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenBackground />

      <FlatList
        ref={flatListRef}
        data={displayedVans}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        contentContainerStyle={[
          styles.listContent,
          {
            width: contentWidth,
            paddingTop: Math.max(insets.top, 18) + 12,
            paddingBottom: Math.max(insets.bottom, 18) + 122,
          },
        ]}
        ListHeaderComponent={
          <FleetHeader
            vanCount={displayedVans.length}
            activeFilter={activeFilter}
            onFilterChange={(filter) => {
              setActiveFilter(filter);
              setPlayingVanId(null);
            }}
            sortMode={sortMode}
            onSortPress={cycleSortMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onBack={handleBack}
          />
        }
        ListEmptyComponent={
          <EmptyFleetState
            hasActiveSearch={searchQuery.trim().length > 0}
            hasActiveFilter={activeFilter !== "all"}
            onReset={() => {
              setSearchQuery("");
              setActiveFilter("all");
              setSortMode("recommended");
            }}
          />
        }
        renderItem={({ item, index }) => (
          <PremiumVanCard
            van={item}
            index={index}
            compact={compact}
            highlighted={highlightedVanId === item.id}
            isPlaying={playingVanId === item.id}
            onToggleVideo={() =>
              setPlayingVanId((current) =>
                current === item.id ? null : item.id,
              )
            }
            onSelect={() => handleSelectVan(item)}
            onBook={() => handleBookVan(item)}
          />
        )}
        onScrollToIndexFailed={({ index }) => {
          flatListRef.current?.scrollToOffset({
            offset: Math.max(0, index * (compact ? 266 : 284)),
            animated: true,
          });
        }}
      />

      <VanDetailsModal
        visible={Boolean(selectedVan)}
        van={selectedVan}
        onClose={() => setSelectedVan(null)}
        onBook={() => {
          if (!selectedVan) return;
          const vanToBook = selectedVan;
          setSelectedVan(null);
          handleBookVan(vanToBook);
        }}
      />

      <BookingModal
        visible={bookingModalVisible}
        van={bookingVan}
        onClose={() => setBookingModalVisible(false)}
        prefilledData={
          params.office && params.pickupDate
            ? {
                office: params.office as string,
                category: params.category as string,
                pickupDate: params.pickupDate as string,
                returnDate: params.returnDate as string,
                pickupTime: params.pickupTime as string,
                returnTime: params.returnTime as string,
                driverAge: params.driverAge as string,
              }
            : undefined
        }
      />
    </View>
  );
}

function ScreenBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={["#01050a", "#030912", "#02070d"]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgBlueGlow} />
      <View style={styles.bgOrangeGlow} />
      <View style={styles.bgTopLine} />
    </View>
  );
}

type FleetHeaderProps = {
  vanCount: number;
  activeFilter: FleetFilter;
  onFilterChange: (filter: FleetFilter) => void;
  sortMode: SortMode;
  onSortPress: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onBack: () => void;
};

function FleetHeader({
  vanCount,
  activeFilter,
  onFilterChange,
  sortMode,
  onSortPress,
  searchQuery,
  onSearchChange,
  onBack,
}: FleetHeaderProps) {
  const filters: Array<{
    key: FleetFilter;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    { key: "all", label: "All", icon: "grid-outline" },
    { key: "automatic", label: "Automatic", icon: "settings-outline" },
    { key: "seats", label: "3+ seats", icon: "people-outline" },
    { key: "bestValue", label: "Best value", icon: "pricetag-outline" },
  ];

  return (
    <View style={styles.headerSection}>
      <View style={styles.titleRow}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.roundHeaderButton,
            pressed && styles.headerButtonPressed,
          ]}
        >
          <Ionicons name="arrow-back" size={18} color="#f8fafc" />
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Choose Your Van</Text>
          <View style={styles.availabilityRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.pageSubtitle}>
              {vanCount} vehicles ready today
            </Text>
          </View>
        </View>

        <View style={styles.resultBadge}>
          <Text style={styles.resultBadgeValue}>{vanCount}</Text>
          <Text style={styles.resultBadgeLabel}>found</Text>
        </View>
      </View>

      <View
        style={[
          styles.searchBar,
          searchQuery.trim().length > 0 && styles.searchBarActive,
        ]}
      >
        <View style={styles.searchIconWrap}>
          <Ionicons
            name="search-outline"
            size={17}
            color={searchQuery ? ACCENT : "rgba(235,242,250,0.58)"}
          />
        </View>
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search vans, seats, fuel, gear..."
          placeholderTextColor="rgba(224,234,244,0.38)"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => onSearchChange("")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={({ pressed }) => [
              styles.searchClearButton,
              pressed && styles.headerButtonPressed,
            ]}
          >
            <Ionicons name="close" size={15} color="#dbe7f3" />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <Pressable
              key={filter.key}
              onPress={() => onFilterChange(filter.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Filter by ${filter.label}`}
              style={({ pressed }) => [
                styles.filterChip,
                active && styles.filterChipActive,
                pressed && styles.filterChipPressed,
              ]}
            >
              <Ionicons
                name={filter.icon}
                size={13}
                color={active ? "#111827" : "rgba(242,246,252,0.76)"}
              />
              <Text
                style={[styles.filterLabel, active && styles.filterLabelActive]}
                numberOfLines={1}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={onSortPress}
        accessibilityRole="button"
        accessibilityLabel={`Sort vans. Current sorting: ${SORT_LABELS[sortMode]}`}
        style={({ pressed }) => [
          styles.sortRow,
          pressed && styles.sortRowPressed,
        ]}
      >
        <Text style={styles.sortCaption}>Sort by</Text>
        <Text style={styles.sortValue}>{SORT_LABELS[sortMode]}</Text>
        <Ionicons name="chevron-down" size={13} color={ACCENT} />
      </Pressable>
    </View>
  );
}

type PremiumVanCardProps = {
  van: Van;
  index: number;
  compact: boolean;
  highlighted: boolean;
  isPlaying: boolean;
  onToggleVideo: () => void;
  onSelect: () => void;
  onBook: () => void;
};

function PremiumVanCard({
  van,
  index,
  compact,
  highlighted,
  isPlaying,
  onToggleVideo,
  onSelect,
  onBook,
}: PremiumVanCardProps) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const featured = index === 0 || highlighted;

  useEffect(() => {
    if (!featured) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [featured, glowPulse]);

  const pulseOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.32],
  });

  const price = getVanPrice(van);
  const gearLabel = getGearLabel(van.gear);
  const imageSource = getImageSource(van.image);
  const videoUri = getVideoUri(van.video);
  const cardHeight = compact ? 256 : 274;

  const animatePress = (toValue: number) => {
    Animated.spring(pressScale, {
      toValue,
      tension: 320,
      friction: 18,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardOuter,
        {
          height: cardHeight,
          transform: [{ scale: pressScale }],
        },
      ]}
    >
      {featured && (
        <Animated.View
          pointerEvents="none"
          style={[styles.featuredAura, { opacity: pulseOpacity }]}
        />
      )}

      <View style={[styles.vanCard, featured && styles.vanCardFeatured]}>
        <LinearGradient
          colors={["#0b1724", CARD_BG, "#050b12"]}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.cardTopHighlight} />
        <View pointerEvents="none" style={styles.cardOrangeGlow} />
        <View pointerEvents="none" style={styles.cardArcLarge} />
        <View pointerEvents="none" style={styles.cardArcSmall} />

        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleArea}>
            {featured && (
              <View style={styles.bestMatchPill}>
                <Ionicons name="star" size={10} color={ACCENT} />
                <Text style={styles.bestMatchText}>Best match</Text>
              </View>
            )}

            <Text style={styles.vanName} numberOfLines={1}>
              {van.name}
            </Text>
            <Text style={styles.vanPurpose} numberOfLines={1}>
              {van.purpose || "Reliable van for your journey"}
            </Text>
          </View>

          <View style={styles.priceBlock}>
            <Text style={styles.priceFrom}>from</Text>
            <View style={styles.priceLine}>
              <Text style={styles.currency}>£</Text>
              <Text style={styles.priceValue}>{price}</Text>
              <Text style={styles.pricePer}>/day</Text>
            </View>
          </View>
        </View>

        <View style={styles.specRow}>
          <SpecChip icon="people-outline" text={`${van.seats || 2} seats`} />
          <SpecChip icon="water-outline" text={van.fuel || "Diesel"} />
          <SpecChip icon="car-outline" text={`${van.doors || 2} doors`} />
        </View>

        <View style={styles.gearPill}>
          <Ionicons name="settings-outline" size={11} color="#63d8aa" />
          <Text style={styles.gearText}>{gearLabel}</Text>
        </View>

        <Pressable
          onPress={videoUri ? onToggleVideo : undefined}
          disabled={!videoUri}
          accessibilityRole={videoUri ? "button" : undefined}
          accessibilityLabel={
            videoUri
              ? `${isPlaying ? "Pause" : "Play"} video for ${van.name}`
              : undefined
          }
          style={({ pressed }) => [
            styles.vehicleStage,
            compact && styles.vehicleStageCompact,
            pressed && videoUri && styles.vehicleStagePressed,
          ]}
        >
          <View pointerEvents="none" style={styles.vehicleShadow} />

          {isPlaying && videoUri ? (
            <InlineVanVideo
              uri={videoUri}
              posterSource={imageSource}
              name={van.name}
            />
          ) : (
            <AdaptiveVanArtwork source={imageSource} name={van.name} />
          )}

          <LinearGradient
            pointerEvents="none"
            colors={[CARD_BG, "rgba(7,17,28,0.5)", "rgba(7,17,28,0)"]}
            locations={[0, 0.28, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.vehicleFadeLeft}
          />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(5,11,18,0)", "rgba(5,11,18,0.62)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.vehicleFadeBottom}
          />

          {videoUri && (
            <View pointerEvents="none" style={styles.videoHint}>
              <View style={styles.videoHintIcon}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={10}
                  color="#111827"
                />
              </View>
              <Text style={styles.videoHintText}>
                {isPlaying ? "Playing" : "Play video"}
              </Text>
            </View>
          )}
        </Pressable>

        <View style={styles.cardFooter}>
          <Pressable
            onPress={onSelect}
            onPressIn={() => animatePress(0.985)}
            onPressOut={() => animatePress(1)}
            style={({ pressed }) => [
              styles.detailsButton,
              pressed && styles.detailsButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`View details for ${van.name}`}
          >
            <Ionicons
              name="information-circle-outline"
              size={15}
              color="rgba(238,244,251,0.72)"
            />
            <Text style={styles.detailsText}>View Details</Text>
          </Pressable>

          <Pressable
            onPress={onBook}
            onPressIn={() => animatePress(0.985)}
            onPressOut={() => animatePress(1)}
            style={({ pressed }) => [
              styles.bookButton,
              pressed && styles.bookButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Book ${van.name}`}
          >
            <LinearGradient
              colors={[ACCENT_LIGHT, ACCENT, "#e77600"]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.bookGloss} />
            <Text style={styles.bookText}>Book Now</Text>
            <View style={styles.bookArrow}>
              <Ionicons name="arrow-forward" size={12} color="#f8fafc" />
            </View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

type SpecChipProps = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
};

function SpecChip({ icon, text }: SpecChipProps) {
  return (
    <View style={styles.specChip}>
      <Ionicons name={icon} size={10} color={ACCENT} />
      <Text style={styles.specText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function getVanPriceNumber(van: Van) {
  const offer = Number(van.selloffer || 0);
  const regular = Number(van.showPrice || 0);
  const value = offer > 0 ? offer : regular;
  return Number.isFinite(value) ? value : 0;
}

function getVanPrice(van: Van) {
  return Math.round(getVanPriceNumber(van)).toString();
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function getGearTypes(gear: Van["gear"]) {
  if (!gear) return ["manual"];

  if (typeof gear === "string") {
    const normalized = normalizeText(gear);
    const types: Array<"manual" | "automatic"> = [];

    if (normalized.includes("manual")) types.push("manual");
    if (normalized.includes("auto")) types.push("automatic");

    return types.length > 0 ? types : [normalized || "manual"];
  }

  if (typeof gear === "object" && "availableTypes" in gear) {
    const availableTypes = (gear as { availableTypes?: unknown })
      .availableTypes;

    if (Array.isArray(availableTypes)) {
      const types = availableTypes
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const candidate = item as Record<string, unknown>;
            return (
              candidate.gearType ??
              candidate.type ??
              candidate.name ??
              candidate.value ??
              ""
            );
          }
          return "";
        })
        .map(normalizeText)
        .filter(Boolean);

      return types.length > 0 ? types : ["manual"];
    }
  }

  return ["manual"];
}

function hasAutomaticGear(gear: Van["gear"]) {
  return getGearTypes(gear).some((type) => type.includes("auto"));
}

function matchesVanSearch(van: Van, normalizedQuery: string) {
  const propertyText = Array.isArray(van.properties)
    ? van.properties
        .map((property) => `${property.key ?? ""} ${property.value ?? ""}`)
        .join(" ")
    : "";
  const ruleText = Array.isArray(van.rules)
    ? van.rules.map((rule) => `${rule.key ?? ""} ${rule.value ?? ""}`).join(" ")
    : "";

  const searchable = [
    van.name,
    van.purpose,
    van.fuel,
    van.expert,
    van.requiredLicense,
    `${van.seats} seats`,
    `${van.doors} doors`,
    getGearLabel(van.gear),
    getGearTypes(van.gear).join(" "),
    getVanPrice(van),
    propertyText,
    ruleText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

function getGearLabel(gear: Van["gear"]) {
  const types = getGearTypes(gear);
  const hasManual = types.some((type) => type.includes("manual"));
  const hasAutomatic = types.some((type) => type.includes("auto"));

  if (hasManual && hasAutomatic) return "Manual & Automatic";
  if (hasAutomatic) return "Automatic";
  if (hasManual) return "Manual";

  return types
    .map((type) => type.replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .join(" & ");
}

function getVideoUri(video: unknown): string | null {
  if (typeof video === "string") {
    const value = video.trim();
    return value.length > 0 ? value : null;
  }

  if (!video || typeof video !== "object") return null;

  const candidate = video as Record<string, unknown>;
  const value = candidate.uri ?? candidate.url ?? candidate.secure_url;
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function getImageSource(image: Van["image"]) {
  return typeof image === "string" ? { uri: image } : image;
}

function AdaptiveVanArtwork({
  source,
  name,
  forceContain = false,
}: {
  source: any;
  name: string;
  forceContain?: boolean;
}) {
  const [portraitSource, setPortraitSource] = useState(false);
  const useCover = portraitSource && !forceContain;

  return (
    <Image
      source={source}
      style={styles.vehicleImage}
       contentPosition={useCover ? { left: "50%", top: "52%" } : "center"}
      transition={220}
      cachePolicy="memory-disk"
      allowDownscaling
      recyclingKey={name}
      accessibilityLabel={name}
      onLoad={(event) => {
        const sourceWidth = event.source?.width ?? 0;
        const sourceHeight = event.source?.height ?? 0;
        setPortraitSource(sourceHeight > sourceWidth * 1.12);
      }}
    />
  );
}

function InlineVanVideo({
  uri,
  posterSource,
  name,
}: {
  uri: string;
  posterSource: any;
  name: string;
}) {
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const player = useVideoPlayer({ uri }, (instance) => {
    instance.loop = true;
    instance.muted = false;
  });

  useEffect(() => {
    player.play();
    return () => {
      player.pause();
    };
  }, [player]);

  return (
    <View style={styles.inlineVideoRoot} pointerEvents="none">
      {!firstFrameReady && (
        <AdaptiveVanArtwork source={posterSource} name={name} />
      )}

      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        surfaceType={Platform.OS === "android" ? "textureView" : undefined}
        onFirstFrameRender={() => setFirstFrameReady(true)}
      />

      {!firstFrameReady && (
        <View style={styles.videoLoading}>
          <ActivityIndicator size="small" color={ACCENT} />
        </View>
      )}
    </View>
  );
}

type VanDetailsModalProps = {
  visible: boolean;
  van: Van | null;
  onClose: () => void;
  onBook: () => void;
};

function VanDetailsModal({
  visible,
  van,
  onClose,
  onBook,
}: VanDetailsModalProps) {
  if (!van) return null;

  const rows = getDetailRows(van);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.detailsModalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close van details"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.detailsModalCard}>
          <LinearGradient
            colors={["#111e2d", "#07111c", "#040a11"]}
            locations={[0, 0.48, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.detailsModalGlow} />

          <View style={styles.detailsModalHeader}>
            <View style={styles.detailsModalTitleBlock}>
              <Text style={styles.detailsModalEyebrow}>VAN DETAILS</Text>
              <Text style={styles.detailsModalTitle} numberOfLines={2}>
                {van.name}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.detailsModalClose,
                pressed && { opacity: 0.72 },
              ]}
            >
              <Ionicons name="close" size={20} color="#f8fafc" />
            </Pressable>
          </View>

          <View style={styles.detailsModalImageStage}>
            <AdaptiveVanArtwork
              source={getImageSource(van.image)}
              name={van.name}
              forceContain
            />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(7,17,28,0)", "rgba(7,17,28,0.95)"]}
              style={styles.detailsModalImageFade}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.detailsModalScrollContent}
          >
            {van.purpose ? (
              <Text style={styles.detailsModalPurpose}>{van.purpose}</Text>
            ) : null}

            <View style={styles.detailsGrid}>
              {rows.map((row) => (
                <View
                  key={`${row.label}-${row.value}`}
                  style={styles.detailCell}
                >
                  <View style={styles.detailCellIcon}>
                    <Ionicons name={row.icon} size={15} color={ACCENT} />
                  </View>
                  <Text style={styles.detailCellLabel}>{row.label}</Text>
                  <Text style={styles.detailCellValue} numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            {normalizeProperties(van.properties).length > 0 ? (
              <View style={styles.propertySection}>
                <Text style={styles.propertySectionTitle}>
                  DIMENSIONS & FEATURES
                </Text>
                {normalizeProperties(van.properties).map((property, index) => (
                  <View
                    key={`${property.label}-${index}`}
                    style={styles.propertyRow}
                  >
                    <View style={styles.propertyDot} />
                    <Text style={styles.propertyLabel}>{property.label}</Text>
                    <Text style={styles.propertyValue} numberOfLines={2}>
                      {property.value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <Pressable
            onPress={onBook}
            style={({ pressed }) => [
              styles.detailsModalBookButton,
              pressed && { opacity: 0.84 },
            ]}
          >
            <LinearGradient
              colors={[ACCENT_LIGHT, ACCENT, "#e77600"]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.detailsModalBookText}>Book This Van</Text>
            <View style={styles.detailsModalBookArrow}>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type DetailRow = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function getDetailRows(van: Van): DetailRow[] {
  return [
    {
      label: "Seats",
      value: String(van.seats || 2),
      icon: "people-outline",
    },
    {
      label: "Fuel",
      value: van.fuel || "Diesel",
      icon: "water-outline",
    },
    {
      label: "Doors",
      value: String(van.doors || 2),
      icon: "car-outline",
    },
    {
      label: "Transmission",
      value: getGearLabel(van.gear),
      icon: "settings-outline",
    },
  ];
}

function normalizeProperties(properties: unknown) {
  if (!Array.isArray(properties))
    return [] as Array<{ label: string; value: string }>;

  return properties
    .map((item, index) => {
      if (typeof item === "string") {
        return { label: item, value: "Included" };
      }

      if (!item || typeof item !== "object") return null;

      const object = item as Record<string, unknown>;
      const label =
        object.label ??
        object.name ??
        object.title ??
        object.key ??
        `Feature ${index + 1}`;
      const value =
        object.value ??
        object.description ??
        object.text ??
        object.content ??
        "Included";

      return { label: String(label), value: String(value) };
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
}

type EmptyFleetStateProps = {
  hasActiveSearch: boolean;
  hasActiveFilter: boolean;
  onReset: () => void;
};

function EmptyFleetState({
  hasActiveSearch,
  hasActiveFilter,
  onReset,
}: EmptyFleetStateProps) {
  const canReset = hasActiveSearch || hasActiveFilter;

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="car-sport-outline" size={34} color={ACCENT} />
      </View>
      <Text style={styles.emptyTitle}>
        {canReset ? "No matching vans" : "No vans available"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {canReset
          ? "Try a broader search or clear the current filters."
          : "Please try another category or check again shortly."}
      </Text>
      {canReset && (
        <Pressable
          onPress={onReset}
          accessibilityRole="button"
          accessibilityLabel="Clear van filters"
          style={({ pressed }) => [
            styles.emptyResetButton,
            pressed && styles.headerButtonPressed,
          ]}
        >
          <Ionicons name="refresh" size={14} color="#111827" />
          <Text style={styles.emptyResetText}>Reset filters</Text>
        </Pressable>
      )}
    </View>
  );
}

type VansLoadingSkeletonProps = {
  contentWidth: number;
  topInset: number;
  compact: boolean;
};

function VansLoadingSkeleton({
  contentWidth,
  topInset,
  compact,
}: VansLoadingSkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-240, 440],
  });

  return (
    <View
      style={[
        styles.skeletonScreen,
        {
          width: contentWidth,
          paddingTop: Math.max(topInset, 18) + 12,
        },
      ]}
    >
      <View style={styles.skeletonTitleRow}>
        <View style={styles.skeletonRoundButton} />
        <View style={styles.skeletonHeadingBlock}>
          <View style={styles.skeletonHeading} />
          <View style={styles.skeletonSubheading} />
        </View>
        <View style={styles.skeletonRoundButton} />
      </View>

      <View style={styles.skeletonFilters}>
        {[72, 91, 83, 88].map((item, index) => (
          <View
            key={`${item}-${index}`}
            style={[
              styles.skeletonFilter,
              { width: compact ? item - 8 : item },
              index === 0 && styles.skeletonFilterActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.skeletonSort} />

      {[0, 1, 2].map((item) => (
        <SkeletonVanCard
          key={item}
          translateX={translateX}
          compact={compact}
          featured={item === 0}
        />
      ))}
    </View>
  );
}

function SkeletonVanCard({
  translateX,
  compact,
  featured,
}: {
  translateX: Animated.AnimatedInterpolation<number>;
  compact: boolean;
  featured: boolean;
}) {
  return (
    <View
      style={[
        styles.skeletonCard,
        { height: compact ? 256 : 274 },
        featured && styles.skeletonCardFeatured,
      ]}
    >
      <LinearGradient
        colors={["#0b1724", "#07111c", "#050b12"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.skeletonShimmer,
          { transform: [{ translateX }, { rotate: "12deg" }] },
        ]}
      />

      <View style={styles.skeletonOverlay}>
        <View style={styles.skeletonTopLine} />
        <View style={styles.skeletonLineWide} />
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonChipRow}>
          <View style={styles.skeletonChip} />
          <View style={styles.skeletonChip} />
          <View style={styles.skeletonChipSmall} />
        </View>
        <View style={styles.skeletonGear} />

        <View style={styles.skeletonVehicle}>
          <Ionicons
            name="car-sport-outline"
            size={86}
            color="rgba(255,255,255,0.07)"
          />
        </View>

        <View style={styles.skeletonFooter}>
          <View style={styles.skeletonButtonGhost} />
          <View style={styles.skeletonButton} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    backgroundColor: SCREEN_BG,
  },
  bgBlueGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    left: -190,
    top: 110,
    backgroundColor: "rgba(43,104,184,0.09)",
  },
  bgOrangeGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    right: -230,
    top: 260,
    backgroundColor: "rgba(254,154,0,0.07)",
  },
  bgTopLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "rgba(127,166,207,0.08)",
  },
  listContent: {
    alignSelf: "center",
  },
  headerSection: {
    marginBottom: 11,
  },
  searchBar: {
    height: 48,
    marginTop: 12,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(7,17,29,0.94)",
    borderWidth: 1,
    borderColor: "rgba(116,149,183,0.2)",
  },
  searchBarActive: {
    borderColor: "rgba(254,154,0,0.58)",
    backgroundColor: "rgba(9,20,33,0.98)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
    }),
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    paddingVertical: 0,
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
  },
  searchClearButton: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  titleRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roundHeaderButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11,24,38,0.88)",
    borderWidth: 1,
    borderColor: "rgba(119,151,184,0.18)",
    overflow: "hidden",
  },
  headerButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  titleBlock: {
    flex: 1,
    paddingHorizontal: 12,
  },
  resultBadge: {
    minWidth: 48,
    height: 38,
    paddingHorizontal: 9,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.26)",
  },
  resultBadgeValue: {
    color: ACCENT,
    fontSize: 13,
    lineHeight: 15,
    fontWeight: "900",
  },
  resultBadgeLabel: {
    color: "rgba(241,247,254,0.56)",
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: "800",
  },
  pageTitle: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    letterSpacing: -0.35,
  },
  availabilityRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#35d07f",
    ...Platform.select({
      ios: {
        shadowColor: "#35d07f",
        shadowOpacity: 0.55,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 2 },
    }),
  },
  pageSubtitle: {
    color: "rgba(224,234,244,0.55)",
    fontSize: 9.5,
    fontWeight: "700",
  },
  filterRow: {
    marginTop: 12,
    paddingRight: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterChip: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(8,18,30,0.9)",
    borderWidth: 1,
    borderColor: "rgba(116,149,183,0.18)",
  },
  filterChipPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  filterChipActive: {
    backgroundColor: ACCENT,
    borderColor: "rgba(255,201,102,0.86)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 4 },
    }),
  },
  filterLabel: {
    color: "rgba(242,246,252,0.7)",
    fontSize: 10,
    fontWeight: "800",
  },
  filterLabelActive: {
    color: "#111827",
  },
  sortRow: {
    marginTop: 10,
    alignSelf: "flex-start",
    minHeight: 30,
    paddingHorizontal: 11,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(7,16,27,0.9)",
    borderWidth: 1,
    borderColor: "rgba(114,148,183,0.15)",
  },
  sortRowPressed: {
    opacity: 0.74,
    transform: [{ scale: 0.985 }],
  },
  sortCaption: {
    color: "rgba(222,231,241,0.5)",
    fontSize: 8.5,
    fontWeight: "700",
  },
  sortValue: {
    color: ACCENT,
    fontSize: 8.5,
    fontWeight: "900",
  },
  cardOuter: {
    position: "relative",
    marginBottom: 10,
  },
  featuredAura: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 19,
    backgroundColor: ACCENT,
  },
  vanCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD_BG,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 6 },
    }),
  },
  vanCardFeatured: {
    borderColor: "rgba(254,154,0,0.7)",
  },
  cardTopHighlight: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  cardOrangeGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -62,
    top: 64,
    backgroundColor: "rgba(254,154,0,0.14)",
  },
  cardArcLarge: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.22)",
    right: -89,
    top: 30,
  },
  cardArcSmall: {
    position: "absolute",
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.14)",
    right: -51,
    top: 68,
  },
  cardHeaderRow: {
    position: "absolute",
    zIndex: 6,
    top: 12,
    left: 13,
    right: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardTitleArea: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  bestMatchPill: {
    alignSelf: "flex-start",
    minHeight: 20,
    paddingHorizontal: 7,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(9,18,29,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 6,
  },
  bestMatchText: {
    color: "rgba(244,247,251,0.8)",
    fontSize: 7.5,
    fontWeight: "800",
  },
  vanName: {
    color: "#ffffff",
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "900",
    letterSpacing: -0.35,
  },
  vanPurpose: {
    marginTop: 2,
    maxWidth: 190,
    color: MUTED,
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "600",
  },
  priceBlock: {
    alignItems: "flex-end",
    minWidth: 66,
  },
  priceFrom: {
    color: "rgba(232,239,247,0.5)",
    fontSize: 7.5,
    fontWeight: "700",
  },
  priceLine: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  currency: {
    color: ACCENT,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "900",
  },
  priceValue: {
    color: ACCENT,
    fontSize: 21,
    lineHeight: 23,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  pricePer: {
    marginBottom: 3,
    color: "rgba(232,239,247,0.62)",
    fontSize: 7.5,
    fontWeight: "700",
  },
  specRow: {
    position: "absolute",
    zIndex: 7,
    left: 13,
    top: 83,
    flexDirection: "row",
    gap: 5,
  },
  specChip: {
    minHeight: 23,
    maxWidth: 88,
    paddingHorizontal: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(5,14,24,0.76)",
    borderWidth: 1,
    borderColor: "rgba(111,147,184,0.13)",
  },
  specText: {
    color: "rgba(230,237,246,0.66)",
    fontSize: 7.2,
    fontWeight: "700",
  },
  gearPill: {
    position: "absolute",
    zIndex: 7,
    left: 13,
    top: 113,
    minHeight: 23,
    paddingHorizontal: 7,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(4,18,22,0.76)",
    borderWidth: 1,
    borderColor: "rgba(74,210,157,0.15)",
  },
  gearText: {
    color: "rgba(209,243,231,0.66)",
    fontSize: 7.2,
    fontWeight: "700",
  },
  vehicleStage: {
    position: "absolute",
    zIndex: 5,
    width: "66%",
    height: "72%",
    right: -2,
    bottom: 31,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleStageCompact: {
    width: "65%",
    height: "70%",
    bottom: 31,
  },
  vehicleStagePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  vehicleShadow: {
    position: "absolute",
    width: "72%",
    height: 18,
    right: 14,
    bottom: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.44)",
    transform: [{ scaleX: 1.16 }],
  },
  vehicleImage: {
    width: "100%",
    height: "110%",
  },
  inlineVideoRoot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,8,14,0.46)",
  },
  videoLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,8,14,0.18)",
  },
  videoHint: {
    position: "absolute",
    zIndex: 10,
    top: 8,
    right: 8,
    minHeight: 24,
    paddingLeft: 5,
    paddingRight: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(4,11,19,0.84)",
    borderWidth: 1,
    borderColor: "rgba(255,184,61,0.32)",
  },
  videoHintIcon: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },
  videoHintText: {
    color: "rgba(248,250,252,0.82)",
    fontSize: 7.5,
    fontWeight: "900",
  },
  vehicleFadeLeft: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "30%",
  },
  vehicleFadeBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "24%",
  },
  cardFooter: {
    position: "absolute",
    zIndex: 8,
    left: 13,
    right: 13,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailsButton: {
    minWidth: 100,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(7,17,29,0.88)",
    borderWidth: 1,
    borderColor: "rgba(111,147,184,0.18)",
  },
  detailsButtonPressed: {
    opacity: 0.78,
  },
  detailsText: {
    color: "rgba(238,244,251,0.78)",
    fontSize: 8,
    fontWeight: "800",
  },
  bookButton: {
    minWidth: 112,
    height: 36,
    paddingLeft: 15,
    paddingRight: 7,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,212,132,0.78)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.28,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 5 },
    }),
  },
  bookButtonPressed: {
    opacity: 0.82,
  },
  bookGloss: {
    position: "absolute",
    top: 2,
    left: 12,
    right: 12,
    height: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  bookText: {
    color: "#101722",
    fontSize: 9,
    fontWeight: "900",
  },
  bookArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111c2b",
  },
  detailsModalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 28,
    backgroundColor: "rgba(0,3,8,0.82)",
  },
  detailsModalCard: {
    width: "100%",
    maxWidth: 390,
    maxHeight: "88%",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.42)",
    backgroundColor: CARD_BG,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.2,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 18 },
    }),
  },
  detailsModalGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -100,
    top: 56,
    backgroundColor: "rgba(254,154,0,0.12)",
  },
  detailsModalHeader: {
    zIndex: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  detailsModalTitleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  detailsModalEyebrow: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  detailsModalTitle: {
    marginTop: 4,
    color: "#fff",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: -0.45,
  },
  detailsModalClose: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  detailsModalImageStage: {
    height: 190,
    marginTop: 10,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(2,8,14,0.52)",
  },
  detailsModalImageFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "36%",
  },
  detailsModalScrollContent: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  detailsModalPurpose: {
    color: "rgba(230,237,246,0.65)",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailCell: {
    width: "48.5%",
    minHeight: 76,
    borderRadius: 14,
    padding: 10,
    backgroundColor: "rgba(8,18,30,0.82)",
    borderWidth: 1,
    borderColor: "rgba(111,147,184,0.16)",
  },
  detailCellIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.1)",
    marginBottom: 7,
  },
  detailCellLabel: {
    color: "rgba(222,231,241,0.48)",
    fontSize: 8.5,
    fontWeight: "800",
  },
  detailCellValue: {
    marginTop: 2,
    color: "#f8fafc",
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: "900",
  },
  propertySection: {
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(6,15,25,0.8)",
    borderWidth: 1,
    borderColor: "rgba(111,147,184,0.14)",
  },
  propertySectionTitle: {
    color: ACCENT,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  propertyRow: {
    minHeight: 31,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  propertyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: ACCENT,
    marginRight: 8,
  },
  propertyLabel: {
    flex: 1,
    color: "rgba(230,237,246,0.66)",
    fontSize: 9.5,
    fontWeight: "700",
  },
  propertyValue: {
    maxWidth: "48%",
    color: "#f8fafc",
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: "900",
    textAlign: "right",
  },
  detailsModalBookButton: {
    height: 48,
    borderRadius: 17,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,220,156,0.72)",
  },
  detailsModalBookText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "900",
  },
  detailsModalBookArrow: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111c2b",
  },
  emptyState: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.09)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.2)",
  },
  emptyTitle: {
    marginTop: 14,
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  emptySubtitle: {
    marginTop: 6,
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  emptyResetButton: {
    minHeight: 38,
    marginTop: 16,
    paddingHorizontal: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: ACCENT,
    borderWidth: 1,
    borderColor: "rgba(255,211,128,0.72)",
  },
  emptyResetText: {
    color: "#111827",
    fontSize: 10,
    fontWeight: "900",
  },
  skeletonScreen: {
    flex: 1,
    alignSelf: "center",
  },
  skeletonTitleRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skeletonRoundButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  skeletonHeadingBlock: {
    flex: 1,
    paddingHorizontal: 12,
  },
  skeletonHeading: {
    width: 156,
    height: 17,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  skeletonSubheading: {
    width: 106,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  skeletonFilters: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  skeletonFilter: {
    height: 32,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  skeletonFilterActive: {
    backgroundColor: "rgba(254,154,0,0.5)",
    borderColor: "rgba(254,154,0,0.25)",
  },
  skeletonSort: {
    marginTop: 10,
    marginBottom: 11,
    width: 126,
    height: 30,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  skeletonCard: {
    position: "relative",
    width: "100%",
    marginBottom: 10,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  skeletonCardFeatured: {
    borderColor: "rgba(254,154,0,0.36)",
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 13,
  },
  skeletonShimmer: {
    position: "absolute",
    top: -60,
    bottom: -60,
    width: 86,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  skeletonTopLine: {
    width: 74,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 7,
  },
  skeletonLineWide: {
    width: "48%",
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: 6,
  },
  skeletonLine: {
    width: "38%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: 10,
  },
  skeletonChipRow: {
    flexDirection: "row",
    gap: 5,
  },
  skeletonChip: {
    width: 62,
    height: 23,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  skeletonChipSmall: {
    width: 53,
    height: 23,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  skeletonGear: {
    marginTop: 7,
    width: 114,
    height: 23,
    borderRadius: 8,
    backgroundColor: "rgba(79,207,159,0.06)",
  },
  skeletonVehicle: {
    position: "absolute",
    right: 24,
    bottom: 45,
    width: 164,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonFooter: {
    position: "absolute",
    left: 13,
    right: 13,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skeletonButtonGhost: {
    width: 100,
    height: 34,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  skeletonButton: {
    width: 112,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(254,154,0,0.58)",
  },
});

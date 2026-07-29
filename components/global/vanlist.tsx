import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  Animated,
  RefreshControl,
  Modal,
  ScrollView,
  PanResponder,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import GlassView from "@/components/global/GlassView";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { ResizeMode, Video } from "expo-av";
import LoginRequiredModal from "@/components/global/LoginRequiredModal";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 32;
const ACCENT = "#fe9a00";
const ACCENT_LIGHT = "rgba(254,154,0,0.15)";
const DARK = "#0f172a";
const DISMISS_THRESHOLD = 100;
const BOTTOM_SAFE = Platform.OS === "ios" ? 34 : 20;

type FilterKey = "all" | "automatic" | "seats" | "price" | "offers";

export type Van = {
  id: string;
  name: string;
  image: string | number;
  video?: string;
  purpose?: string;
  seats: number;
  fuel: string;
  expert: string;
  doors: number;
  gear?:
    | {
        availableTypes: ("manual" | "automatic")[];
        automaticExtraCost: number;
      }
    | string;
  showPrice?: number;
  pricingTiers?: { minDays: number; maxDays: number; pricePerDay: number }[];
  extraHoursRate?: number;
  selloffer?: number;
  cargo?: string;
  properties?: { key: string; value: string; _id: string }[];
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
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const scrollY = useRef(new Animated.Value(0)).current;
  const safeVans = Array.isArray(vans) ? vans : [];

  const displayedVans = useMemo(() => {
    const list = safeVans.filter((van) => van && van.id);
    switch (activeFilter) {
      case "automatic":
        return list.filter((van) => {
          if (typeof van.gear === "string") {
            return van.gear.toLowerCase().includes("automatic");
          }
          return van.gear?.availableTypes?.includes("automatic");
        });
      case "seats":
        return list.filter((van) => Number(van.seats) >= 3);
      case "price":
        return [...list].sort(
          (a, b) => Number(a.showPrice || 0) - Number(b.showPrice || 0),
        );
      case "offers":
        return list.filter((van) => Number(van.selloffer || 0) > 0);
      default:
        return list;
    }
  }, [activeFilter, safeVans]);

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const staticHeaderOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const renderItem = ({ item, index }: { item: Van; index: number }) => {
    if (!item || !item.id) return null;
    return (
      <VanCard
        van={item}
        index={index}
        isHighlighted={highlightedVanId === item.id}
        onPress={() => {
          Haptics.selectionAsync();
          onSelectVan?.(item);
        }}
        onBook={async () => {
          Haptics.selectionAsync();
          onBookVan?.(item);
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={displayedVans}
        keyExtractor={(item) => item?.id || Math.random().toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 178, paddingBottom: 110 }}
        ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="car-sport-outline" size={64} color={ACCENT} />
            </View>
            <Text style={styles.emptyTitle}>No Vans Available</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find any vans matching your criteria.{"\n"}Try a
              different filter.
            </Text>
          </View>
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
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
        maxToRenderPerBatch={4}
        windowSize={5}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef?.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 500);
        }}
      />

      {/* Floating blur header */}
      <Animated.View
        style={[styles.floatingHeader, { opacity: headerOpacity }]}
        pointerEvents="box-none"
      >
        <GlassView
          pointerEvents="box-none"
          intensity={90}
          tint="dark"
          style={styles.blurHeader}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.floatingBackButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.backButtonInner}>
              <Ionicons name="chevron-back" size={22} color="#f9fafb" />
            </View>
          </Pressable>
          <Text style={styles.floatingTitle}>
            Choose Your{" "}
            <Text style={styles.floatingTitleAccent}>Perfect Van</Text>
          </Text>
        </GlassView>
      </Animated.View>

      {/* Static header */}
      <Animated.View
        style={[styles.staticHeader, { opacity: staticHeaderOpacity }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <View style={styles.backButtonInner}>
            <Ionicons name="chevron-back" size={22} color="#f9fafb" />
          </View>
        </Pressable>
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>Choose Your Van</Text>
          <Text style={styles.subtitle}>
            {displayedVans.length} option{displayedVans.length === 1 ? "" : "s"} ready to compare.
          </Text>
        </View>
        <FilterRail
          value={activeFilter}
          onChange={(filter) => {
            Haptics.selectionAsync();
            setActiveFilter(filter);
          }}
        />
      </Animated.View>
    </View>
  );
}

function FilterRail({
  value,
  onChange,
}: {
  value: FilterKey;
  onChange: (value: FilterKey) => void;
}) {
  const filters: { key: FilterKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "all", label: "All", icon: "grid-outline" },
    { key: "automatic", label: "Automatic", icon: "cog-outline" },
    { key: "seats", label: "3+ seats", icon: "people-outline" },
    { key: "price", label: "Best price", icon: "pricetag-outline" },
    { key: "offers", label: "Offers", icon: "flash-outline" },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRail}
    >
      {filters.map((filter) => {
        const active = filter.key === value;
        return (
          <Pressable
            key={filter.key}
            onPress={() => onChange(filter.key)}
            style={({ pressed }) => [
              styles.filterChip,
              active && styles.filterChipActive,
              pressed && styles.filterChipPressed,
            ]}
          >
            <Ionicons
              name={filter.icon}
              size={14}
              color={active ? DARK : "rgba(255,255,255,0.72)"}
            />
            <Text
              style={[
                styles.filterChipText,
                active && styles.filterChipTextActive,
              ]}
              numberOfLines={1}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ═══════════════════════════════════════
   BOTTOM SHEET — pan-to-dismiss
═══════════════════════════════════════ */

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  sheetHeight?: number;
};

function BottomSheet({
  visible,
  onClose,
  children,
  sheetHeight = height * 0.88,
}: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(sheetHeight);
      backdropOpacity.setValue(0);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            tension: 60,
            friction: 13,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: sheetHeight,
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      onClose();
    });
  }, [onClose, sheetHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8 && g.dy > 0,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dy) > 8 && g.dy > 0,
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        backdropOpacity.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
          backdropOpacity.setValue(
            Math.max(0, 1 - g.dy / (sheetHeight * 0.55)),
          );
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > 1.0) {
          dismiss();
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              tension: 80,
              friction: 13,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 180,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    }),
  ).current;

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={bsStyles.root}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
          <Animated.View
            style={[bsStyles.backdrop, { opacity: backdropOpacity }]}
          />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          style={[
            bsStyles.sheet,
            { height: sheetHeight, transform: [{ translateY }] },
          ]}
        >
          {/* Drag handle zone */}
          <View style={bsStyles.dragZone} {...panResponder.panHandlers}>
            <View style={bsStyles.handle} />
          </View>

          <Pressable onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
            {children}
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const bsStyles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.78)",
  },
  sheet: {
    backgroundColor: "#0d1526",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  dragZone: {
    width: "100%",
    minHeight: 44,
    paddingTop: 14,
    paddingBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
});

/* ═══════════════════════════════════════
   VAN CARD
═══════════════════════════════════════ */

type VanCardProps = {
  van: Van;
  index: number;
  isHighlighted?: boolean;
  onPress?: () => void;
  onBook?: () => void;
};

function VanCard({ van, index, isHighlighted, onPress, onBook }: VanCardProps) {
  if (!van || typeof van !== "object") return null;

  const { user } = useAuth();
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"features" | "purpose">(
    "features",
  );

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cardTY = useRef(new Animated.Value(40)).current;
  const imageScale = useRef(new Animated.Value(1.12)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const safeVan: Van = {
    id: String(van.id || ""),
    name: String(van.name || "Unknown Van"),
    image: van.image || require("@/assets/images/van.png"),
    video: van.video || undefined,
    purpose: String(van.purpose || ""),
    seats: Number(van.seats) || 2,
    fuel: String(van.fuel || "Diesel"),
    expert: String(van.expert || "No"),
    doors: Number(van.doors) || 2,
    gear: van.gear,
    showPrice: Number(van.showPrice) || 0,
    pricingTiers: van.pricingTiers || [],
    extraHoursRate: van.extraHoursRate,
    cargo: van.cargo,
    properties: van.properties || [],
    selloffer: Number(van.selloffer) || 0,
  };

  useEffect(() => {
    if (showDetails) setActiveTab("features");
  }, [showDetails]);

  useEffect(() => {
    if (!showVideo) setVideoReady(false);
  }, [showVideo]);

  /* entrance animation */
  useEffect(() => {
    const delay = Math.min(index * 100, 400);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 480,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(cardTY, {
        toValue: 0,
        delay,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(imageScale, {
        toValue: 1,
        duration: 650,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* highlight pulse */
  useEffect(() => {
    if (!isHighlighted) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: false,
        }),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 750,
          useNativeDriver: false,
        }),
      ]),
      { iterations: 3 },
    ).start();
  }, [isHighlighted]);

  /* arrow bounce */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  /* shimmer on video badge */
  useEffect(() => {
    if (!safeVan.video) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.965,
        useNativeDriver: true,
        speed: 22,
        bounciness: 4,
      }),
      Animated.timing(imageScale, {
        toValue: 1.07,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 7,
      }),
      Animated.spring(imageScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 7,
      }),
    ]).start();
  };

  const handleCardPress = () => {
    if (safeVan.video) {
      Haptics.selectionAsync();
      setShowVideo(true);
    } else {
      onPress?.();
    }
  };

  const imageSource =
    typeof safeVan.image === "string" && safeVan.image
      ? { uri: safeVan.image }
      : typeof safeVan.image === "number"
        ? safeVan.image
        : require("@/assets/images/van.png");

  const borderColor = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.07)", "rgba(254,154,0,0.95)"],
  });

  const gearLabel =
    typeof safeVan.gear === "string"
      ? safeVan.gear === "manual,automatic"
        ? "Manual & Automatic"
        : (safeVan.gear?.charAt(0)?.toUpperCase() || "") +
          (safeVan.gear?.slice(1) || "")
      : Array.isArray((safeVan.gear as any)?.availableTypes)
        ? (safeVan.gear as any).availableTypes
            .join(" & ")
            .replace(/manual/g, "Manual")
            .replace(/automatic/g, "Automatic")
        : "Manual";

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { transform: [{ scale }, { translateY: cardTY }], opacity },
      ]}
    >
      <Animated.View style={[styles.card, { borderColor }]}>
        <Pressable
          onPress={handleCardPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ flex: 1 }}
        >
          {/* ── Van Image ── */}
          <View style={styles.imageContainer}>
            <Animated.View
              style={[
                styles.imageWrapper,
                { transform: [{ scale: imageScale }] },
              ]}
            >
              <Image
                source={imageSource}
                style={styles.image}
                contentFit="cover"
                transition={300}
              />
            </Animated.View>

            {/* Multi-stop gradient */}
            <LinearGradient
              colors={[
                "rgba(2,6,23,0.82)",
                "rgba(2,6,23,0.0)",
                "rgba(2,6,23,0.0)",
                "rgba(2,6,23,0.92)",
              ]}
              locations={[0, 0.28, 0.55, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

           
          </View>

          {/* ── Discount badge ── */}
          {!!safeVan.selloffer && safeVan.selloffer > 0 && (
            <View style={styles.discountBadge}>
              <Ionicons name="flash" size={12} color="#fff" />
              <Text style={styles.discountText}>{safeVan.selloffer}% OFF</Text>
            </View>
          )}

          {/* ── Card overlay content ── */}
          <View style={styles.overlayContent}>
            {/* Top: name + sub + chips */}
            <View>
              <Text style={styles.vanName} numberOfLines={1}>
                {safeVan.name}
              </Text>
              <Text style={styles.vanSub} numberOfLines={1}>
                {safeVan.expert && safeVan.expert !== "No"
                  ? safeVan.expert
                  : "Modern van · or similar"}
              </Text>

              <View style={styles.chipsRow}>
                <InfoChip
                  icon="people-outline"
                  label={`${safeVan.seats} seats`}
                />
                <InfoChip icon="flame-outline" label={safeVan.fuel} />
                <InfoChip
                  icon="git-branch-outline"
                  label={`${safeVan.doors} doors`}
                />
              </View>

              <View style={styles.gearRow}>
                <View style={styles.gearBadge}>
                  <Ionicons name="cog-outline" size={12} color="#34d399" />
                  <Text style={styles.gearText}>{gearLabel}</Text>
                </View>
              </View>
            </View>

            {/* Bottom: details + book */}
            <View style={styles.bottomRow}>
              {/* Left: view details */}
              <View style={styles.leftSection}>
                {Array.isArray(safeVan.properties) &&
                  safeVan.properties.length > 0 && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowDetails(true);
                      }}
                      style={({ pressed }) => [
                        styles.detailsBtn,
                        pressed && styles.detailsBtnPressed,
                      ]}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons
                        name="layers-outline"
                        size={14}
                        color={ACCENT}
                      />
                      <Text style={styles.detailsBtnText}>View Details</Text>
                      <Animated.View
                        style={{
                          transform: [
                            {
                              translateX: arrowAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 5],
                              }),
                            },
                          ],
                        }}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={13}
                          color={ACCENT}
                        />
                      </Animated.View>
                    </Pressable>
                  )}
              </View>

              {/* Right: Book Now */}
              <Pressable
                onPress={async (e) => {
                  e.stopPropagation();
                  if (!user) {
                    await AsyncStorage.setItem(
                      "pendingBookingVan",
                      JSON.stringify(van),
                    );
                    setShowLoginPrompt(true);
                    return;
                  }
                  await onBook?.();
                }}
                style={({ pressed }) => [
                  styles.bookBtn,
                  pressed && styles.bookBtnPressed,
                ]}
              >
                <Text style={styles.bookBtnText}>Book Now</Text>
                <Ionicons name="arrow-forward-circle" size={18} color={DARK} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* ═══ VIDEO BOTTOM SHEET ═══ */}
      <BottomSheet
        visible={showVideo}
        onClose={() => setShowVideo(false)}
        sheetHeight={height * 0.92}
      >
        <VideoSheetContent
          van={safeVan}
          onClose={() => setShowVideo(false)}
          imageSource={imageSource}
        />
      </BottomSheet>

      {/* ═══ DETAILS BOTTOM SHEET ═══ */}
      <BottomSheet
        visible={showDetails}
        onClose={() => setShowDetails(false)}
        sheetHeight={height * 0.86}
      >
        <DetailsSheetContent
          van={safeVan}
          imageSource={imageSource}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setShowDetails(false)}
        />
      </BottomSheet>

      <LoginRequiredModal
        visible={showLoginPrompt}
        message="Please login or register to book this van."
        onLogin={() => {
          setShowLoginPrompt(false);
          router.push("/register");
        }}
        onCancel={() => setShowLoginPrompt(false)}
      />
    </Animated.View>
  );
}

/* ═══════════════════════════════════════
   VIDEO SHEET CONTENT
═══════════════════════════════════════ */

function VideoSheetContent({
  van,
  onClose,
  imageSource,
}: {
  van: Van;
  onClose: () => void;
  imageSource: any;
}) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const loadAnim = useRef(new Animated.Value(0)).current;

  const onReadyForDisplay = () => {
    setIsReady(true);
    Animated.timing(loadAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  // Full-screen video dimensions (16:9 landscape or fill)
  const videoW = width - 28;
  const videoH = ((width - 28) * 9) / 16;

  return (
    <View style={vsStyles.root}>
      {/* Header */}
      <View style={vsStyles.header}>
        <View style={vsStyles.headerLeft}>
          <View style={vsStyles.vanThumb}>
            <Image
              source={imageSource}
              style={vsStyles.vanThumbImg}
              contentFit="cover"
            />
          </View>
          <View>
            <Text style={vsStyles.title} numberOfLines={1}>
              {van.name}
            </Text>
            <Text style={vsStyles.subtitle}>Fleet Video Tour</Text>
          </View>
        </View>
        <Pressable
          onPress={onClose}
          style={vsStyles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={20} color="#94a3b8" />
        </Pressable>
      </View>

      {/* Divider */}
      <View style={vsStyles.divider} />

      {/* Video */}
      <View style={[vsStyles.videoWrap, { width: videoW, height: videoH }]}>
        {/* Loading placeholder */}
        {!isReady && !hasError && (
          <View style={vsStyles.loadingOverlay}>
            <Image
              source={imageSource}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={["rgba(2,6,23,0.3)", "rgba(2,6,23,0.85)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={vsStyles.loadingCenter}>
              <View style={vsStyles.loadingRing}>
                <Ionicons name="videocam" size={28} color={ACCENT} />
              </View>
              <Text style={vsStyles.loadingText}>Loading video…</Text>
            </View>
          </View>
        )}

        {hasError ? (
          <View style={vsStyles.errorBox}>
            <Ionicons name="videocam-off-outline" size={44} color="#475569" />
            <Text style={vsStyles.errorText}>Video unavailable</Text>
            <Text style={vsStyles.errorSub}>
              Please check your connection and try again.
            </Text>
          </View>
        ) : (
          <Animated.View style={[{ flex: 1 }, { opacity: loadAnim }]}>
            <Video
              source={{ uri: van.video! }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              shouldPlay
              isLooping
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              style={vsStyles.video}
              onReadyForDisplay={onReadyForDisplay}
              onError={() => setHasError(true)}
            />
          </Animated.View>
        )}
      </View>

      {/* Meta chips */}
      <View style={vsStyles.metaRow}>
        <InfoChip icon="people-outline" label={`${van.seats} seats`} />
        <InfoChip icon="flame-outline" label={van.fuel} />
        <InfoChip icon="git-branch-outline" label={`${van.doors} doors`} />
      </View>

      {/* Tip */}
      <View style={vsStyles.tipBox}>
        <Ionicons name="information-circle-outline" size={15} color="#64748b" />
        <Text style={vsStyles.tipText}>
          Tap and hold the video for more controls
        </Text>
      </View>
    </View>
  );
}

const vsStyles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 14,
    paddingBottom: BOTTOM_SAFE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  vanThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  vanThumbImg: {
    width: "100%",
    height: "100%",
  },
  title: {
    color: "#f1f5f9",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    maxWidth: width * 0.52,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 1,
    fontWeight: "500",
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 14,
  },
  videoWrap: {
    alignSelf: "center",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCenter: {
    alignItems: "center",
    gap: 10,
  },
  loadingRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(15,23,42,0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: ACCENT,
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#020617",
  },
  errorText: {
    color: "#cbd5e1",
    fontSize: 16,
    fontWeight: "700",
  },
  errorSub: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 2,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  tipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "500",
  },
});

/* ═══════════════════════════════════════
   DETAILS SHEET CONTENT
═══════════════════════════════════════ */

function DetailsSheetContent({
  van,
  imageSource,
  activeTab,
  setActiveTab,
  onClose,
}: {
  van: Van;
  imageSource: any;
  activeTab: "features" | "purpose";
  setActiveTab: (t: "features" | "purpose") => void;
  onClose: () => void;
}) {
  return (
    <View style={dsStyles.root}>
      {/* Hero image */}
      <View style={dsStyles.hero}>
        <Image
          source={imageSource}
          style={dsStyles.heroImg}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={["rgba(13,21,38,0.15)", "rgba(13,21,38,0.96)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={dsStyles.heroOverlay}>
          <View style={{ flex: 1 }}>
            <Text style={dsStyles.heroEyebrow}>Van Details</Text>
            <Text style={dsStyles.heroName} numberOfLines={2}>
              {van.name}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={dsStyles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color="#cbd5e1" />
          </Pressable>
        </View>

        {/* quick stats row inside hero */}
        
      </View>

      {/* Tab bar */}
      <View style={dsStyles.tabBar}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab("features");
          }}
          style={[dsStyles.tab, activeTab === "features" && dsStyles.tabActive]}
        >
          <Ionicons
            name="cube-outline"
            size={15}
            color={activeTab === "features" ? DARK : "#64748b"}
          />
          <Text
            style={[
              dsStyles.tabLabel,
              activeTab === "features" && dsStyles.tabLabelActive,
            ]}
          >
            Features
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab("purpose");
          }}
          style={[dsStyles.tab, activeTab === "purpose" && dsStyles.tabActive]}
        >
          <Ionicons
            name="compass-outline"
            size={15}
            color={activeTab === "purpose" ? DARK : "#64748b"}
          />
          <Text
            style={[
              dsStyles.tabLabel,
              activeTab === "purpose" && dsStyles.tabLabelActive,
            ]}
          >
            Ideal For
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={dsStyles.scroll}
        contentContainerStyle={[
          dsStyles.scrollContent,
          { paddingBottom: BOTTOM_SAFE + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "features" ? (
          Array.isArray(van.properties) && van.properties.length > 0 ? (
            <View style={dsStyles.grid}>
              {van.properties.map((prop: any, idx: number) => (
                <View key={prop._id || idx} style={dsStyles.gridCard}>
                  <View style={dsStyles.gridCardAccent} />
                  <Text style={dsStyles.gridKey}>
                    {String(prop.key || "").toUpperCase()}
                  </Text>
                  <Text style={dsStyles.gridValue}>
                    {String(prop.value || "")}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="cube-outline"
              text="No features listed for this van."
            />
          )
        ) : van.purpose ? (
          <View style={dsStyles.purposeWrap}>
            {van.purpose.split("\n").map((line: string, idx: number) => {
              const trimmed = line.trim();
              if (!trimmed) return <View key={idx} style={{ height: 6 }} />;
              const isHeader = trimmed.toLowerCase().includes("ideal for");
              const hasTick = trimmed.startsWith("✅");
              const text = hasTick ? trimmed.substring(2).trim() : trimmed;

              if (isHeader) {
                return (
                  <View key={idx} style={dsStyles.purposeHeader}>
                    <Ionicons name="compass" size={16} color={ACCENT} />
                    <Text style={dsStyles.purposeHeaderText}>{text}</Text>
                  </View>
                );
              }

              if (hasTick) {
                return (
                  <View key={idx} style={dsStyles.purposeItem}>
                    <View style={dsStyles.tick}>
                      <Ionicons name="checkmark" size={12} color={DARK} />
                    </View>
                    <Text style={dsStyles.purposeItemText}>{text}</Text>
                  </View>
                );
              }

              return (
                <Text key={idx} style={dsStyles.purposePlain}>
                  {text}
                </Text>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon="compass-outline"
            text="No purpose information available."
          />
        )}
      </ScrollView>
    </View>
  );
}

function HeroStat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={dsStyles.heroStatItem}>
      <Ionicons name={icon} size={13} color={ACCENT} />
      <Text style={dsStyles.heroStatValue}>{value}</Text>
      <Text style={dsStyles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={dsStyles.empty}>
      <View style={dsStyles.emptyCircle}>
        <Ionicons name={icon} size={32} color="#334155" />
      </View>
      <Text style={dsStyles.emptyText}>{text}</Text>
    </View>
  );
}

const dsStyles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    height: 178,
    marginHorizontal: 12,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#020617",
  },
  heroImg: { width: "100%", height: "100%" },
  heroOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#f9fafb",
    letterSpacing: -0.3,
    maxWidth: width * 0.62,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heroStats: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "rgba(13,21,38,0.82)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  heroStatSep: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 2,
  },
  heroStatValue: {
    color: "#f9fafb",
    fontSize: 13,
    fontWeight: "800",
  },
  heroStatLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(15,23,42,0.6)",
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 11,
    gap: 6,
  },
  tabActive: {
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  tabLabelActive: {
    color: DARK,
    fontWeight: "800",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridCard: {
    width: "47.5%",
    backgroundColor: "rgba(30,41,59,0.55)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  gridCardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 3,
    height: "100%",
    backgroundColor: ACCENT,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  gridKey: {
    fontSize: 9,
    color: "#475569",
    fontWeight: "800",
    marginBottom: 5,
    letterSpacing: 1,
  },
  gridValue: {
    fontSize: 15,
    color: "#f1f5f9",
    fontWeight: "800",
  },
  purposeWrap: { gap: 2 },
  purposeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  purposeHeaderText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#f9fafb",
  },
  purposeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  purposeItemText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
  },
  purposePlain: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 52,
    gap: 14,
  },
  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(30,41,59,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  emptyText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});

/* ═══════════════════════════════════════
   INFO CHIP
═══════════════════════════════════════ */

function InfoChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={12} color={ACCENT} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

/* ═══════════════════════════════════════
   MAIN STYLES
═══════════════════════════════════════ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 36,
  },

  /* ── Header ── */
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
  },
  floatingBackButton: {
    position: "absolute",
    left: 16,
    bottom: 10,
    zIndex: 2,
  },
  floatingTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  floatingTitleAccent: {
    color: ACCENT,
  },
  backButton: {
    position: "absolute",
    left: -6,
    top: 0,
    zIndex: 999,
  },
  backButtonInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextBlock: {
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    fontWeight: "400",
  },

  /* ── Card ── */
  cardWrapper: {
    width: "100%",
    alignSelf: "center",
  },
  filterRail: {
    paddingTop: 14,
    paddingBottom: 2,
    paddingHorizontal: 2,
    gap: 8,
  },
  filterChip: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,23,42,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  filterChipActive: {
    backgroundColor: ACCENT,
    borderColor: "rgba(254,154,0,0.8)",
  },
  filterChipPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  filterChipText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
  },
  filterChipTextActive: {
    color: DARK,
  },
  card: {
    width: CARD_WIDTH,
    alignSelf: "center",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#020617",
    borderWidth: 1.5,
  },
  imageContainer: {
    width: "100%",
    height: 400,
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },

  /* Play button */
  playContainer: {
    position: "absolute",
    bottom: 22,
    right: 18,
    alignItems: "center",
    gap: 6,
  },
  playRing: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: ACCENT,
  },
  playCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(15,23,42,0.82)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    paddingLeft: 3,
  },
  playLabel: {
    backgroundColor: "rgba(15,23,42,0.76)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  playLabelText: {
    color: "#e2e8f0",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  /* Discount badge */
  discountBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc2626",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
    zIndex: 10,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  discountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  /* Overlay */
  overlayContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: "space-between",
  },
  vanName: {
    color: "#f9fafb",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  vanSub: {
    color: "rgba(209,213,219,0.85)",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "400",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    gap: 4,
  },
  chipText: {
    color: "#e5e7eb",
    fontSize: 11,
    fontWeight: "600",
  },
  gearRow: {
    marginTop: 9,
  },
  gearBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.78)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.18)",
  },
  gearText: {
    color: "#e5e7eb",
    fontSize: 11,
    fontWeight: "600",
  },

  /* Bottom row */
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  leftSection: {
    flex: 1,
    marginRight: 10,
  },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
    backgroundColor: "rgba(15,23,42,0.82)",
  },
  detailsBtnPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },
  detailsBtnText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: "800",
  },

  /* Book button */
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 999,
    minWidth: 134,
    justifyContent: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 8,
  },
  bookBtnPressed: {
    backgroundColor: "#e8900a",
    transform: [{ scale: 0.96 }],
  },
  bookBtnText: {
    color: DARK,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  /* Empty state */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ACCENT_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(254,154,0,0.2)",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#f9fafb",
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },
});

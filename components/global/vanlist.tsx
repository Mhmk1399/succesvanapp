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
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import Svg, { Path } from "react-native-svg";
import { Video } from "expo-av";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const ACCENT = "#fe9a00";
const DARK = "#0f172a";

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
      onBook={async () => {
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
  const { user } = useAuth();
  const router = useRouter();
  const [showDimensionsModal, setShowDimensionsModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const imageScale = useRef(new Animated.Value(1.2)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<"features" | "purpose">(
    "features"
  );

  useEffect(() => {
    if (showDimensionsModal) {
      setActiveTab("features");
    }
  }, [showDimensionsModal]);
  const handleCardPress = () => {
    if (van.video) {
      Haptics.selectionAsync();
      setShowVideoModal(true); // پخش ویدیو
    } else {
      onPress?.(); // رفتار قبلی: رفتن به جزئیات
    }
  };

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

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (showDimensionsModal) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalScale.setValue(0.8);
      modalOpacity.setValue(0);
    }
  }, [showDimensionsModal]);

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
          onPress={handleCardPress} // ← اینجا تغییر کرد
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.95 }]}
        >
          <View style={styles.imageContainer}>
            <Pressable onPress={() => van.video && setShowVideoModal(true)}>
              <Animated.View style={{ transform: [{ scale: imageScale }] }}>
                <Image
                  source={imageSource}
                  style={styles.image}
                  contentFit="cover"
                />
                {van.video && (
                  <View style={styles.playIconOverlay}>
                    <View style={styles.playIconCircle}>
                      <Ionicons name="play" size={20} color="#fff" />
                    </View>
                  </View>
                )}
              </Animated.View>
            </Pressable>
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
                {van.expert ? van.expert : "Modern van · or similar"}
              </Text>

              <View style={styles.chipsRow}>
                <Chip icon="people-outline" label={`${van.seats} seats`} />
                <View style={styles.chip}>
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
                  <Text style={styles.chipText}>{`${van.doors} doors`}</Text>
                </View>
                <Chip icon="flame-outline" label={van.fuel} />
              </View>
              <View style={styles.gearRow}>
                <Ionicons
                  name="settings-outline"
                  size={14}
                  color={"#07bc1fff"}
                />
                <Text style={styles.gearText}>
                  {typeof van.gear === "string"
                    ? van.gear === "manual,automatic"
                      ? "Manual & Automatic"
                      : van.gear.charAt(0).toUpperCase() + van.gear.slice(1)
                    : van.gear?.availableTypes
                        ?.join(" & ")
                        .replace(/manual/g, "Manual")
                        .replace(/automatic/g, "Automatic") || "Manual"}
                </Text>
              </View>
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.leftSection}>
                {van.properties && van.properties.length > 0 && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowDimensionsModal(true);
                    }}
                    style={({ pressed }) => [
                      styles.dimensionsChip,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.dimensionsText}>Van Dimensions</Text>
                    <Animated.View
                      style={{
                        transform: [
                          {
                            translateX: arrowAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 4],
                            }),
                          },
                        ],
                      }}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={ACCENT}
                      />
                    </Animated.View>
                  </Pressable>
                )}
                {van.selloffer && van.selloffer > 0 && (
                  <View style={styles.discountBadge}>
                    <Ionicons name="pricetag" size={12} color="#fff" />
                    <Text style={styles.discountText}>{van.selloffer}% OFF</Text>
                  </View>
                )}
              </View>

              <View style={styles.rightSection}>
                <Pressable
                  onPress={async (e) => {
                    e.stopPropagation();
                    if (!user) {
                      await AsyncStorage.setItem(
                        "pendingBookingVan",
                        JSON.stringify(van)
                      );
                      Alert.alert(
                        "Login Required",
                        "Please login or register to book this van.",
                        [
                          {
                            text: "Login",
                            onPress: () => router.push("/register"),
                          },
                          {
                            text: "Register",
                            onPress: () => router.push("/register"),
                          },
                          { text: "Cancel", style: "cancel" },
                        ]
                      );
                      return;
                    }
                    await onBook?.();
                  }}
                  style={({ pressed }) => [
                    styles.bookButton,
                    pressed && styles.bookButtonPressed,
                  ]}
                >
                  <Text style={styles.bookButtonText}>Book Now</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#444444ff"
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>

        <Modal
          visible={showVideoModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowVideoModal(false)}
        >
          <View style={styles.videoModalContainer}>
            <View style={styles.videoModalHeader}>
              <Pressable
                onPress={() => setShowVideoModal(false)}
                style={styles.videoCloseButton}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </Pressable>
            </View>

            {/* پخش واقعی ویدیو با expo-av */}
            {van.video ? (
              <Video
                source={{ uri: van.video }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                shouldPlay
                isLooping={false}
                useNativeControls
                style={styles.videoPlayer}
              />
            ) : (
              <View style={styles.videoFallback}>
                <Ionicons name="videocam-off" size={60} color="#666" />
                <Text style={styles.videoFallbackText}>
                  Video not available
                </Text>
              </View>
            )}
          </View>
        </Modal>

        <Modal
          visible={showDimensionsModal}
          transparent
          animationType="none"
          onRequestClose={() => setShowDimensionsModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDimensionsModal(false)}
          >
            <Animated.View
              style={[
                styles.modalContent,
                {
                  opacity: modalOpacity,
                  transform: [{ scale: modalScale }],
                },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalInner}>
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalTitle}>Van Details</Text>
                      <Text style={styles.modalSubtitle}>{van.name}</Text>
                    </View>
                    <Pressable
                      onPress={() => setShowDimensionsModal(false)}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={20} color="#9ca3af" />
                    </Pressable>
                  </View>

                  {/* تب‌ها */}
                  <View style={styles.tabContainer}>
                    <Pressable
                      onPress={() => setActiveTab("features")}
                      style={[
                        styles.tabButton,
                        activeTab === "features" && styles.tabButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          activeTab === "features" && styles.tabTextActive,
                        ]}
                      >
                        Features
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setActiveTab("purpose")}
                      style={[
                        styles.tabButton,
                        activeTab === "purpose" && styles.tabButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          activeTab === "purpose" && styles.tabTextActive,
                        ]}
                      >
                        Ideal For
                      </Text>
                    </Pressable>
                  </View>

                  <ScrollView
                    style={styles.tabContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {activeTab === "features" ? (
                      // تب ویژگی‌ها (همون قبلی)
                      van.properties && van.properties.length > 0 ? (
                        <View style={styles.dimensionsGrid}>
                          {van.properties.map((prop) => (
                            <View key={prop._id} style={styles.dimensionItem}>
                              <Text style={styles.dimensionKey}>
                                {prop.key}
                              </Text>
                              <Text style={styles.dimensionValue}>
                                {prop.value}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.noDataText}>
                          No features available
                        </Text>
                      )
                    ) : van.purpose ? (
                      <View style={styles.purposeContainer}>
                        {van.purpose
                          .split("\n")
                          .map((line: string, index: number) => {
                            const trimmed = line.trim();
                            if (!trimmed)
                              return <View key={index} style={{ height: 8 }} />;

                            const isIdeal = trimmed
                              .toLowerCase()
                              .includes("ideal for");
                            const hasTick = trimmed.startsWith("✅");
                            const displayText = hasTick ? trimmed.substring(2) : trimmed;

                            return (
                              <View key={index} style={styles.purposeLine}>
                                {hasTick && (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={18}
                                    color={ACCENT}
                                    style={{ marginTop: 8 }}
                                  />
                                )}
                                <Text
                                  style={[
                                    styles.purposeText,
                                    isIdeal && styles.purposeIdeal,
                                    hasTick && styles.purposeItem,
                                  ]}
                                >
                                  {displayText}
                                </Text>
                              </View>
                            );
                          })}
                      </View>
                    ) : (
                      <Text style={styles.noDataText}>
                        No purpose information
                      </Text>
                    )}
                  </ScrollView>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
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
  leftSection: {
    flex: 1,
    marginRight: 12,
    gap: 6,
  },
  rightSection: {
    gap: 8,
    alignItems: "center",
  },
  gearRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    marginTop: 10,
  },
  gearText: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceLabel: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
  },
  priceValue: {
    color: "#f9fafb",
    fontSize: 24,
    fontWeight: "900",
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
    fontWeight: "800",
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
  dimensionsChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderColor: ACCENT,
    backgroundColor: "rgba(222, 215, 205, 0)",
    gap: 4,
  },
  dimensionsText: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1e293b",
    borderRadius: 20,
    overflow: "scroll",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalInner: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f9fafb",
  },
  modalSubtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  dimensionsList: {
    maxHeight: 400,
  },
  dimensionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dimensionItem: {
    width: "48%",
    backgroundColor: "rgba(15,23,42,0.5)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.1)",
  },
  dimensionKey: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  dimensionValue: {
    fontSize: 14,
    color: ACCENT,
    fontWeight: "700",
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  playIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 35,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  videoModalContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  videoModalHeader: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
  },
  videoCloseButton: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 30,
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  videoFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  videoFallbackText: {
    color: "#999",
    fontSize: 16,
    marginTop: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(15,23,42,0.6)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: ACCENT,
  },
  tabText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: DARK,
    fontWeight: "800",
  },
  tabContent: {
    maxHeight: 420,
  },
  purposeContainer: {
    paddingHorizontal: 4,
  },
  purposeLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  purposeText: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 20,
  },
  purposeIdeal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f9fafb",
    marginTop: 8,
    marginBottom: 4,
  },
  purposeItem: {
    marginLeft: 4,
  },
  noDataText: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },
  discountBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  discountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
});

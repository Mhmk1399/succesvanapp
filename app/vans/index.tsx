import React, { useEffect, useRef, useState } from "react";
import { Animated, FlatList, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Category } from "@/types/type";
import { categoryService } from "@/services/categoryService";
import BookingModal from "@/components/global/BookingModal";
import VanList, { Van } from "@/components/global/vanlist";

export default function VansScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [, setSelectedVan] = useState<Van | null>(null);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingVan, setBookingVan] = useState<Van | null>(null);
  const [vans, setVans] = useState<Van[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const [highlightedVanId, setHighlightedVanId] = useState<string | null>(null);

  // Ensure vans is always a valid array with proper data
  const safeVans: Van[] = Array.isArray(vans) ? vans.filter(v => v && v.id) : [];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (user) {
      checkPendingBooking();
    }
  }, [user]);

  useEffect(() => {
    if (params.selectedVanId && vans.length > 0) {
      setHighlightedVanId(params.selectedVanId as string);
      const index = vans.findIndex((v) => v.id === params.selectedVanId);
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
  }, [params.selectedVanId, vans]);

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
        throw new Error("categoryService.getAll is undefined - check service exports");
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
            typeof cat.gear === "object" && cat.gear?.availableTypes
              ? cat.gear
              : "manual",
          showPrice: typeof cat.showPrice === "number" ? cat.showPrice : 0,
          pricingTiers: cat.pricingTiers || [],
          extraHoursRate: cat.extrahoursRate || cat.extraHoursRate || 0,
          expert: typeof cat.expert === "string" ? cat.expert : "No",
          properties: Array.isArray(cat.properties) ? cat.properties : [],
          selloffer: typeof cat.selloffer === "number" ? cat.selloffer : 0,
        }));

        // Filter by category if provided
        if (params.category) {
          mappedVans = mappedVans.filter((van) => van.id === params.category);
        }

        console.log("Mapped vans count:", mappedVans.length);
        setVans(mappedVans);
      }
    } catch (error) {
      console.error("=== LOAD CATEGORIES ERROR ===");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Full error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : undefined);
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

  if (loading) {
    return (
      <View style={styles.screen}>
        <LinearGradient
          colors={["#fe9a00", "#0f172b"]}
          style={StyleSheet.absoluteFill}
        />
        <VansLoadingSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#fe9a00", "#0f172b"]}
        style={StyleSheet.absoluteFill}
      />
      <VanList
        vans={safeVans}
        onSelectVan={handleSelectVan}
        onBookVan={handleBookVan}
        flatListRef={flatListRef}
        highlightedVanId={highlightedVanId}
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

function VansLoadingSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    ).start();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 420],
  });

  return (
    <View style={styles.skeletonScreen}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonBack} />
        <View>
          <Text style={styles.skeletonTitle}>Choose Your Van</Text>
          <Text style={styles.skeletonSubtitle}>Loading fleet options...</Text>
        </View>
      </View>
      <View style={styles.skeletonFilters}>
        {["All", "Automatic", "3+ seats", "Best price"].map((label, index) => (
          <View
            key={label}
            style={[
              styles.skeletonFilter,
              index === 0 && styles.skeletonFilterActive,
            ]}
          >
            <Text
              style={[
                styles.skeletonFilterText,
                index === 0 && styles.skeletonFilterTextActive,
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
      {[0, 1, 2].map((item) => (
        <SkeletonVanCard key={item} translateX={translateX} />
      ))}
    </View>
  );
}

function SkeletonVanCard({
  translateX,
}: {
  translateX: Animated.AnimatedInterpolation<number>;
}) {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImageBase} />
      <View style={styles.skeletonVanSilhouette}>
        <Ionicons
          name="car-sport-outline"
          size={92}
          color="rgba(255,255,255,0.11)"
        />
      </View>
      <Animated.View
        style={[
          styles.skeletonShimmer,
          { transform: [{ translateX }, { rotate: "12deg" }] },
        ]}
      />
      <LinearGradient
        colors={[
          "rgba(2,6,23,0.82)",
          "rgba(2,6,23,0.0)",
          "rgba(2,6,23,0.0)",
          "rgba(2,6,23,0.92)",
        ]}
        locations={[0, 0.28, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.skeletonOverlay}>
        <View>
          <View style={styles.skeletonLineWide} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonChipRow}>
            <View style={styles.skeletonChip} />
            <View style={styles.skeletonChip} />
            <View style={styles.skeletonChipSmall} />
          </View>
          <View style={styles.skeletonGear} />
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
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonScreen: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 36,
  },
  skeletonHeader: {
    minHeight: 94,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonBack: {
    position: "absolute",
    left: -6,
    top: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skeletonTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  skeletonSubtitle: {
    color: "rgba(248,250,252,0.58)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
  },
  skeletonFilters: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 14,
    paddingBottom: 18,
  },
  skeletonFilter: {
    minWidth: 70,
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  skeletonFilterActive: {
    backgroundColor: "#fe9a00",
    borderColor: "rgba(254,154,0,0.8)",
  },
  skeletonFilterText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
  },
  skeletonFilterTextActive: {
    color: "#0f172a",
  },
  skeletonCard: {
    width: "100%",
    height: 400,
    alignSelf: "center",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#020617",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 20,
  },
  skeletonImageBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.8)",
  },
  skeletonVanSilhouette: {
    position: "absolute",
    top: 132,
    left: 0,
    right: 0,
    alignItems: "center",
    opacity: 0.75,
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: "space-between",
  },
  skeletonShimmer: {
    position: "absolute",
    top: -50,
    bottom: -50,
    width: 86,
    backgroundColor: "rgba(255,255,255,0.075)",
  },
  skeletonLineWide: {
    width: "58%",
    height: 22,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.16)",
    marginBottom: 10,
  },
  skeletonLine: {
    width: "42%",
    height: 12,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 12,
  },
  skeletonChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 9,
  },
  skeletonChip: {
    width: 78,
    height: 27,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  skeletonChipSmall: {
    width: 68,
    height: 27,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  skeletonGear: {
    width: 128,
    height: 27,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.78)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.18)",
  },
  skeletonFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skeletonButtonGhost: {
    width: 132,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.82)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  skeletonButton: {
    width: 134,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#fe9a00",
  },
});

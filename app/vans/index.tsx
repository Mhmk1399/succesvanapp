import BookingModal from "@/components/global/BookingModal";
import VanList, { Van } from "@/components/global/vanlist";
import { useAuth } from "@/contexts/AuthContext";
import { categoryService } from "@/services/categoryService";
import { Category } from "@/types/type";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

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
      <View style={[styles.screen, styles.center]}>
        <LinearGradient
          colors={["#fe9a00", "#0f172b"]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#fe9a00" />
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
});

import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import VanList, { Van } from "@/components/global/vanlist";
import BookingModal from "@/components/global/BookingModal";
import { LinearGradient } from "expo-linear-gradient";
import { categoryService } from "@/services/categoryService";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Category } from "@/types/type";
import { useAuth } from "@/contexts/AuthContext";

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
      const result = await categoryService.getAll();
      if (result.success) {
        let mappedVans: Van[] = result.data.map((cat: Category) => ({
          id: cat._id,
          name: cat.name,
          image: cat.image || require("@/assets/images/van.png"),
          video: cat.video,
          purpose: cat.purpose,
          seats: cat.seats || 2,
          fuel: cat.fuel || "Diesel",
          doors: cat.doors || 2,
          gear:
            typeof cat.gear === "object" && cat.gear?.availableTypes
              ? cat.gear
              : "manual",
          showPrice: cat.showPrice || 0,
          pricingTiers: cat.pricingTiers || [],
          extraHoursRate: cat.extrahoursRate || cat.extraHoursRate || 0,
          expert:cat.expert || "No",
          properties: cat.properties || [],
        }));

        // Filter by category if provided
        if (params.category) {
          mappedVans = mappedVans.filter((van) => van.id === params.category);
        }

        setVans(mappedVans);
      }
    } catch (error) {
      console.error("Load categories error:", error);
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
        vans={vans}
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

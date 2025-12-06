import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import VanList, { Van } from "@/components/global/vanlist";
import BookingModal from "@/components/global/BookingModal";
import { LinearGradient } from "expo-linear-gradient";
import { categoryService } from "@/services/categoryService";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VansScreen() {
  const params = useLocalSearchParams();
  const [, setSelectedVan] = useState<Van | null>(null);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingVan, setBookingVan] = useState<Van | null>(null);
  const [vans, setVans] = useState<Van[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    checkPendingBooking();
  }, [params]);

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
        let mappedVans: Van[] = result.data.map((cat: any) => ({
          id: cat._id,
          name: cat.name,
          image: cat.image || require("@/assets/images/van.png"),
          seats: cat.seats || 2,
          fuel: cat.fuel || "Diesel",
          doors: cat.doors || 2,
          gear: cat.gear || "manual",
          pricePerHour: cat.pricePerHour || 0,
          cargo: cat.cargo,
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
    setBookingVan(van);
    setBookingModalVisible(true);
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
      />

      <BookingModal
        visible={bookingModalVisible}
        van={bookingVan}
        onClose={() => setBookingModalVisible(false)}
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

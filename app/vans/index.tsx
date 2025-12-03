import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import VanList, { Van } from "@/components/global/vanlist";
import { mockVans } from "@/data/mockVans";
import BookingModal from "@/components/global/BookingModal";
import { LinearGradient } from "expo-linear-gradient";

export default function VansScreen() {
  const [selectedVan, setSelectedVan] = useState<Van | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingVan, setBookingVan] = useState<Van | null>(null);

  const handleSelectVan = (van: Van) => {
    setSelectedVan(van);
    setDetailModalVisible(true);
  };

  const handleBookVan = (van: Van) => {
    setBookingVan(van);
    setBookingModalVisible(true);
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#0f172b", "#0f172b"]}
        style={StyleSheet.absoluteFill}
      />
      <VanList
        vans={mockVans}
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
});

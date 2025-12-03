// app/index.tsx
import { Animated, Dimensions, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import ReservationHero from "@/components/global/ReservationHero";
import HorizontalVanList from "@/components/home/HorizontalVanList";
import WhyUs from "@/components/home/WhyUs";
import FAQ from "@/components/home/FAQ";
import { mockVans } from "@/data/mockVans";
import ReservationForm from "@/components/global/ReservationForm";
import { useState } from "react";

export default function HomeScreen() {
  const router = useRouter();
  const { height: screenHeight } = Dimensions.get("window");

  const [translateY] = useState(new Animated.Value(screenHeight)); // Start from bottom

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(screenHeight); // Reset
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ReservationHero />
      <ReservationForm onCompleted={closeModal} />
      <HorizontalVanList
        vans={mockVans.slice(0, 5)}
        onSelectVan={(van) => router.push("/vans" as any)}
        onViewAll={() => router.push("/vans" as any)}
      />
      <WhyUs />
      <FAQ />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172b",
  },
  content: {
    paddingBottom: 120,
  },
});

// app/index.tsx
import { Animated, Dimensions, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import ReservationHero from "@/components/global/ReservationHero";
import HorizontalVanList from "@/components/home/HorizontalVanList";
import WhyUs from "@/components/home/WhyUs";
import FAQ from "@/components/home/FAQ";
import Footer from "@/components/global/Footer";
import ReservationForm from "@/components/global/ReservationForm";
import { useState, useEffect } from "react";
import { categoryService } from "@/services/categoryService";
import { Van } from "@/components/home/HorizontalVanList";
import { Category } from "@/types/type";

export default function HomeScreen() {
  const router = useRouter();
  const { height: screenHeight } = Dimensions.get("window");
  const [vans, setVans] = useState<Van[]>([]);
  const [translateY] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const result = await categoryService.getAll();
      if (result.success) {
        const mappedVans: Van[] = result.data
          .slice(0, 5)
          .map((cat: Category) => ({
            id: cat._id,
            name: cat.name,
            image: cat.image || require("@/assets/images/van.png"),
            seats: cat.seats || 2,
            fuel: cat.fuel || "Diesel",
            doors: cat.doors || 2,
            gear: cat.gear || "manual",
            pricePerHour: cat.pricePerHour || 0,
          }));
        setVans(mappedVans);
      }
    } catch (error) {
      console.log("Load categories error:", error);
    }
  };

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
        vans={vans}
        onSelectVan={(van) =>
          router.push({
            pathname: "/vans",
            params: { selectedVanId: van.id },
          })
        }
        onViewAll={() => router.push("/vans")}
      />
      <WhyUs />
      <FAQ />
      <Footer />
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

// app/index.tsx
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import ReservationHero from "@/components/global/ReservationHero";
import HorizontalVanList from "@/components/home/HorizontalVanList";
import { mockVans } from "@/data/mockVans";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ReservationHero />
      <HorizontalVanList
        vans={mockVans.slice(0, 5)}
        onSelectVan={(van) => router.push("/vans" as any)}
        onViewAll={() => router.push("/vans" as any)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
        backgroundColor: "#0a0f1e",

  },
  content: {
    paddingBottom: 120,
  },
});

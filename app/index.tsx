// app/index.tsx
import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";
import { Link } from "expo-router";
import ReservationHero from "@/components/global/ReservationHero";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Success Van Hire</Text>
      <Text style={styles.subtitle}>Book your van online in seconds</Text>

      <View style={styles.buttons}>
        <Link href="/vans" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.buttonText}>View Vans</Text>
          </Pressable>
        </Link>

        <Link href="/bookings" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.buttonText}>My Bookings</Text>
          </Pressable>
        </Link>
      </View> */}
      <SafeAreaView style={styles.container}>
        <ReservationHero />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 24,
  },
  buttons: {
    width: "100%",
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fe9a00",
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#0f172b",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

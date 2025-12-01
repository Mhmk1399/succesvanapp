// app/index.tsx
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Success Van Hire</Text>
      <Text style={styles.subtitle}>رزرو آنلاین ون در چند ثانیه</Text>

      <View style={styles.buttons}>
        <Link href="/vans/index" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.buttonText}>مشاهده ونها</Text>
          </Pressable>
        </Link>

        <Link href="/bookings/index" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.buttonText}>رزروهای من</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
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

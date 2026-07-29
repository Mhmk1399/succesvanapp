import React from "react";
import { View, StyleSheet } from "react-native";
import AuthScreen from "@/components/auth/AuthScreen";
import { LinearGradient } from "expo-linear-gradient";

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1b2337", "#101827", "#080b12"]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topBand} />
      <AuthScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBand: {
    position: "absolute",
    top: -70,
    left: -40,
    right: -40,
    height: 230,
    backgroundColor: "rgba(254,154,0,0.16)",
    transform: [{ rotate: "-7deg" }],
  },
});

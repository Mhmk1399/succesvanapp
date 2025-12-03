import React from "react";
import { View, StyleSheet } from "react-native";
import AuthScreen from "@/components/auth/AuthScreen";
import { LinearGradient } from "expo-linear-gradient";

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fe9a00", "#0f172b"]}
        style={StyleSheet.absoluteFill}
      />
      <AuthScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

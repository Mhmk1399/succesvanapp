import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

export default function ScreenEdgeBlur() {
  return (
    <>
      <View style={styles.topBlur} pointerEvents="none">
        <LinearGradient
          colors={[
            "rgba(15,23,42,0.5)",
            "rgba(15,23,42,0.3)",
            "rgba(15,23,42,0.1)",
            "transparent",
          ]}
          style={styles.gradient}
        />
      </View>

      <View style={styles.bottomBlur} pointerEvents="none">
        <BlurView intensity={5} tint="dark" style={styles.blurContainer}>
          <LinearGradient
            colors={[
              "transparent",
              "rgba(15, 23, 42, 0.14)",
              "rgba(15, 23, 42, 0.24)",
              "rgba(15,23,42,0.34)",
            ]}
            style={styles.gradient}
          />
        </BlurView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 99,
  },
  bottomBlur: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 35,
    zIndex: 99,
  },
  gradient: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
  },
});

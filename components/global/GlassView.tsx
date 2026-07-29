import { BlurView, BlurViewProps } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, StyleProp, StyleSheet, ViewStyle } from "react-native";

type GlassViewProps = BlurViewProps & {
  overlayStyle?: StyleProp<ViewStyle>;
};

export default function GlassView({
  children,
  intensity = 60,
  tint = "dark",
  style,
  overlayStyle,
  blurReductionFactor,
  experimentalBlurMethod,
  ...props
}: GlassViewProps) {
  return (
    <BlurView
      {...props}
      intensity={intensity}
      tint={tint}
      blurReductionFactor={
        Platform.OS === "android" ? (blurReductionFactor ?? 1.6) : blurReductionFactor
      }
      experimentalBlurMethod={
        Platform.OS === "android"
          ? (experimentalBlurMethod ?? "dimezisBlurView")
          : experimentalBlurMethod
      }
      style={[styles.base, style]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0.10)",
          Platform.OS === "android"
            ? "rgba(15,23,42,0.62)"
            : "rgba(15,23,42,0.22)",
          "rgba(0,0,0,0.18)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, overlayStyle]}
      />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor:
      Platform.OS === "android" ? "rgba(15,23,42,0.58)" : "transparent",
  },
});

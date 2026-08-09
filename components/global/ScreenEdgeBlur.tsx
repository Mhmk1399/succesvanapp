import React, { memo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlassView from "@/components/global/GlassView";

type ScreenEdgeBlurProps = {
  topEnabled?: boolean;
  bottomEnabled?: boolean;
  topHeight?: number;
  bottomHeight?: number;
  topIntensity?: number;
  bottomIntensity?: number;
  dark?: boolean;
};

const IOS = Platform.OS === "ios";

function ScreenEdgeBlur({
  topEnabled = true,
  bottomEnabled = true,
  topHeight,
  bottomHeight,
  topIntensity = IOS ? 24 : 10,
  bottomIntensity = IOS ? 32 : 14,
  dark = true,
}: ScreenEdgeBlurProps) {
  const insets = useSafeAreaInsets();

  const finalTopHeight = topHeight ?? insets.top + 72;
  const finalBottomHeight = bottomHeight ?? insets.bottom + 92;

  const topBase = dark ? "rgba(15,23,42,0.34)" : "rgba(255,255,255,0.22)";
  const topMid = dark ? "rgba(15,23,42,0.18)" : "rgba(255,255,255,0.12)";
  const topSoft = dark ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.05)";

  const bottomBase = dark ? "rgba(15,23,42,0.62)" : "rgba(255,255,255,0.28)";
  const bottomMid = dark ? "rgba(15,23,42,0.26)" : "rgba(255,255,255,0.14)";
  const bottomSoft = dark ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.05)";

  return (
    <>
      {topEnabled && (
        <View
          pointerEvents="none"
          style={[styles.edge, styles.top, { height: finalTopHeight }]}
        >
          <GlassView
            intensity={topIntensity}
            tint={dark ? "dark" : "light"}
            style={styles.fill}
            overlayStyle={styles.transparentOverlay}
          >
            {/* base blur shading */}
            <LinearGradient
              colors={[topBase, topMid, topSoft, "transparent"]}
              locations={[0, 0.35, 0.68, 1]}
              style={styles.fill}
            />

            {/* iPhone-like glossy top highlight */}
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.16)",
                "rgba(255,255,255,0.05)",
                "transparent",
              ]}
              locations={[0, 0.22, 1]}
              style={styles.topGloss}
            />

            {/* soft hairline */}
            <View style={styles.topHairline} />
          </GlassView>
        </View>
      )}

      {bottomEnabled && (
        <View
          pointerEvents="none"
          style={[styles.edge, styles.bottom, { height: finalBottomHeight }]}
        >
          <GlassView
            intensity={bottomIntensity}
            tint={dark ? "dark" : "light"}
            style={styles.fill}
            overlayStyle={styles.transparentOverlay}
          >
            {/* main bottom fade */}
            <LinearGradient
              colors={["transparent", bottomSoft, bottomMid, bottomBase]}
              locations={[0, 0.28, 0.68, 1]}
              style={styles.fill}
            />

            {/* center ambient softness */}
            <LinearGradient
              colors={[
                "transparent",
                dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.08)",
                "transparent",
              ]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.bottomGlow}
            />

            {/* subtle upper separator */}
            <View style={styles.bottomHairline} />
          </GlassView>
        </View>
      )}
    </>
  );
}

export default memo(ScreenEdgeBlur);

const styles = StyleSheet.create({
  edge: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 99,
    overflow: "hidden",
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
  fill: {
    flex: 1,
  },
  transparentOverlay: {
    backgroundColor: "transparent",
  },

  /* top */
  topGloss: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 28,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  topHairline: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.14)",
    opacity: 0.8,
  },

  /* bottom */
  bottomGlow: {
    position: "absolute",
    left: "18%",
    right: "18%",
    bottom: 0,
    height: 56,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  bottomHairline: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});

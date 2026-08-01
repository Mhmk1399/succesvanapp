import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, PressableProps, StyleSheet, View } from "react-native";

type HeaderBackButtonProps = {
  onPress: () => void;
  style?: PressableProps["style"];
  color?: string;
};

export default function HeaderBackButton({
  onPress,
  style,
  color = "#f9fafb",
}: HeaderBackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={style}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <View style={styles.inner}>
        <Ionicons name="chevron-back" size={22} color={color} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
});

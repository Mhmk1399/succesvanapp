import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, PressableProps, StyleSheet } from "react-native";

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
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={(state) => [
        styles.button,
        typeof style === "function" ? style(state) : style,
        state.pressed && styles.pressed,
      ]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons name="chevron-back" size={22} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(20,30,49,0.86)",
    borderWidth: 1,
    borderColor: "rgba(139,164,194,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
});

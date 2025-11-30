// app/_layout.tsx
import "../global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // دقت کن: بدون کوتیشن، نوعش boolean ـه
      }}
    />
  );
}

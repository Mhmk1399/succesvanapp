import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ title: "صفحه اصلی" }} />
        <Stack.Screen name="vans/index" options={{ title: "لیست ونها" }} />
        <Stack.Screen name="bookings/index" options={{ title: "رزروهای من" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

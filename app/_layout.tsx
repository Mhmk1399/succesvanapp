import { View } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import Navbar from "@/components/global/Navbar";
import DynamicIsland from "@/components/global/DynamicIsland";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Navbar />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="vans/index" />
          <Stack.Screen name="bookings/index" />
        </Stack>
        <DynamicIsland />
      </View>
    </ThemeProvider>
  );
}

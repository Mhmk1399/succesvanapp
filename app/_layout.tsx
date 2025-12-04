import { Stack } from "expo-router";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import DynamicIsland from "@/components/global/DynamicIsland";
import FloatingContactButton from "@/components/global/FloatingContactButton";
import ScreenEdgeBlur from "@/components/global/ScreenEdgeBlur";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions on app start
    (async () => {
      await Notifications.requestPermissionsAsync();
    })();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="vans/index" />
        <Stack.Screen name="dashboard/index" />
      </Stack>
      <ScreenEdgeBlur />
      <DynamicIsland />
      <FloatingContactButton />
    </>
  );
}

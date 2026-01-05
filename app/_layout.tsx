import AlertProvider from "@/components/global/CustomAlert";
import DynamicIsland from "@/components/global/DynamicIsland";
import FloatingContactButton from "@/components/global/FloatingContactButton";
import ScreenEdgeBlur from "@/components/global/ScreenEdgeBlur";
import { AuthProvider } from "@/contexts/AuthContext";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect } from "react";

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
    <AlertProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="vans/index" />
          <Stack.Screen name="dashboard/index" />
        </Stack>
        <ScreenEdgeBlur />
        <DynamicIsland />
        <FloatingContactButton />
      </AuthProvider>
    </AlertProvider>
  );
}

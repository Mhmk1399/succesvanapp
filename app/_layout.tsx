import AlertProvider from "@/components/global/CustomAlert";
import DynamicIsland from "@/components/global/DynamicIsland";
import FloatingContactButton from "@/components/global/FloatingContactButton";
import ScreenEdgeBlur from "@/components/global/ScreenEdgeBlur";
import AppSplash from "@/components/global/AppSplash";
import { AuthProvider } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { useFirstLaunch } from "@/utils/useFirstLaunch";
import { useState } from "react";

function AppContent() {
  const { isLoading } = useFirstLaunch();
  const [showSplash, setShowSplash] = useState(true);

  if (isLoading || showSplash) {
    return <AppSplash onFinish={() => setShowSplash(false)} />;
  }

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

export default function RootLayout() {
  return (
    <AlertProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AlertProvider>
  );
}

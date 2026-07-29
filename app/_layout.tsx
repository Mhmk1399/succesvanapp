import AlertProvider from "@/components/global/CustomAlert";
import DynamicIsland from "@/components/global/DynamicIsland";
import FloatingContactButton from "@/components/global/FloatingContactButton";
import FirstLaunchOnboarding from "@/components/global/FirstLaunchOnboarding";
import { ToastProvider } from "@/components/global/AppToast";
import { AuthProvider } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { useFirstLaunch } from "@/utils/useFirstLaunch";
import { View } from "react-native";

function AppContent() {
  const { isFirstLaunch, isLoading, completeFirstLaunch } = useFirstLaunch();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: "#080a10" }} />;
  }

  if (isFirstLaunch) {
    return <FirstLaunchOnboarding onFinish={completeFirstLaunch} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="vans/index" />
        <Stack.Screen name="dashboard/index" />
      </Stack>
      {/* <ScreenEdgeBlur /> */}
      <DynamicIsland />
      <FloatingContactButton />
    </>
  );
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </AlertProvider>
  );
}

import AlertProvider from "@/components/global/CustomAlert";
import DynamicIsland from "@/components/global/DynamicIsland";
import FloatingContactButton from "@/components/global/FloatingContactButton";
import FirstLaunchOnboarding from "@/components/global/FirstLaunchOnboarding";
import { ToastProvider } from "@/components/global/AppToast";
import { AuthProvider } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { useFirstLaunch } from "@/utils/useFirstLaunch";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppContent() {
  const { isFirstLaunch, isLoading, completeFirstLaunch } = useFirstLaunch();

  if (isLoading) {
    return null;
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#081523" }}
      onLayout={() => {
        void SplashScreen.hideAsync().catch(() => undefined);
      }}
    >
      {isFirstLaunch ? (
        <FirstLaunchOnboarding onFinish={completeFirstLaunch} />
      ) : (
        <>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="vans/index" />
            <Stack.Screen name="dashboard/index" />
          </Stack>
          <DynamicIsland />
          <FloatingContactButton />
        </>
      )}
    </View>
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

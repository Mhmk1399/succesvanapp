// app/profile.tsx
import UserProfileCard from "@/components/dashboard/profile";
import UserReservations from "@/components/dashboard/reserve";
import LicenseUploadBanner from "@/components/dashboard/LicenseUploadBanner";
import LicenseUploadModal from "@/components/dashboard/LicenseUploadModal";
import { useAuth } from "@/contexts/AuthContext";
import { reservationService } from "@/services/reservationService";
import { Reservation } from "@/types/type";
import { registerBackgroundTask } from "@/utils/backgroundTask";
import {
  checkStatusChanges,
  showStatusNotification,
} from "@/utils/reservationNotifier";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlassView from "@/components/global/GlassView";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ACCENT = "#fe9a00";

type TabKey = "profile" | "reservations";

export default function ProfileScreen() {
  const tabsRowRef = useRef<View>(null);
  const [tabsRowWidth, setTabsRowWidth] = useState<number>(0);
  const { user, token, isLoading: authLoading, logout } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("reservations");
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [licenseModalVisible, setLicenseModalVisible] = useState(false);
  const router = useRouter();

  const indicatorX = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const prevTabRef = useRef(activeTab);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/register");
    }
  }, [authLoading, router, token]);

  useEffect(() => {
    fetchReservations();
    if (user?._id) {
      AsyncStorage.setItem("userId", user._id);
      registerBackgroundTask();
    }
  }, [user]);

  // Update the effect to use dynamic value
  useEffect(() => {
    const prevTab = prevTabRef.current;
    prevTabRef.current = activeTab;

    if (prevTab !== activeTab && tabsRowWidth > 0) {
      const targetX = activeTab === "reservations" ? 0 : 1;

      Animated.spring(indicatorX, {
        toValue: targetX,
        tension: 200,
        friction: 15,
        useNativeDriver: true,
      }).start();
    }
  }, [activeTab, tabsRowWidth]);

  const fetchReservations = async () => {
    if (!user?._id) return;
    setIsLoading(true);
    try {
      const result = await reservationService.getAll(user._id);
      const newReservations = result.data || [];

      const changed = await checkStatusChanges(newReservations);
      changed.forEach((res) => showStatusNotification(res));

      setReservations(newReservations);
    } catch (error) {
      console.log("Error fetching reservations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // New: Measure the tabs row width on mount/layout change
  const handleTabsRowLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setTabsRowWidth(width);
  };

  const handleTabChange = async (tab: TabKey) => {
    await Haptics.selectionAsync();
    scrollY.setValue(0);
    setActiveTab(tab);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReservations();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    setLogoutModalVisible(false);
    router.replace("/");
  };

  const hasLicense = user?.licenceAttached?.front && user?.licenceAttached?.back;
  const activeReservations = reservations.filter((reservation) =>
    ["pending", "confirmed", "delivered"].includes(
      String(reservation.status),
    ),
  ).length;
  const floatingHeaderOpacity = scrollY.interpolate({
    inputRange: [36, 96],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const floatingHeaderTranslateY = scrollY.interpolate({
    inputRange: [36, 96],
    outputRange: [-18, 0],
    extrapolate: "clamp",
  });
  const handleDashboardScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  const dashboardChrome = (
    <>
      <DashboardHeader
        name={user?.name || "Customer"}
        onBack={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        onLogout={() => {
          Haptics.selectionAsync();
          setLogoutModalVisible(true);
        }}
      />

      <DashboardSummary
        total={reservations.length}
        active={activeReservations}
        hasLicense={!!hasLicense}
      />

      <View
        ref={tabsRowRef}
        onLayout={handleTabsRowLayout}
        style={styles.tabsRow}
      >
        <Animated.View
          style={[
            styles.tabIndicator,
            tabsRowWidth > 0 && {
              transform: [
                {
                  translateX: indicatorX.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (tabsRowWidth - 10) / 2],
                  }),
                },
              ],
            },
          ]}
        />
        <Pressable
          onPress={() => handleTabChange("reservations")}
          style={({ pressed }) => [
            styles.tabButton,
            pressed && styles.tabButtonPressed,
          ]}
        >
          <Ionicons
            name={activeTab === "reservations" ? "calendar" : "calendar-outline"}
            size={16}
            color={activeTab === "reservations" ? "#0f172a" : "#e5e7eb"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "reservations" && styles.tabTextActive,
            ]}
          >
            Reservations
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleTabChange("profile")}
          style={({ pressed }) => [
            styles.tabButton,
            pressed && styles.tabButtonPressed,
          ]}
        >
          <Ionicons
            name={activeTab === "profile" ? "person" : "person-outline"}
            size={16}
            color={activeTab === "profile" ? "#0f172a" : "#e5e7eb"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "profile" && styles.tabTextActive,
            ]}
          >
            Profile
          </Text>
        </Pressable>
      </View>

      {!hasLicense && (
        <LicenseUploadBanner onPress={() => setLicenseModalVisible(true)} />
      )}
    </>
  );

  if (authLoading || !token) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#fe9a00", "#0f172b"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.authGuardLoading}>
          <ActivityIndicator size="small" color={ACCENT} />
          <Text style={styles.authGuardText}>Checking account...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <LinearGradient
          colors={["#fe9a00", "#0f172b"]}
          style={StyleSheet.absoluteFill}
        />
        {/* محتوا */}
        {activeTab === "profile" ? (
          <ScrollView
            style={styles.tabContent}
            contentContainerStyle={styles.profileScrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleDashboardScroll}
            scrollEventThrottle={16}
          >
            {dashboardChrome}
            <View style={styles.profileCardWrap}>
              <UserProfileCard />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.tabContent}>
            <UserReservations
              reservations={reservations}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              onScroll={handleDashboardScroll}
              ListHeaderComponent={
                <View style={styles.chromeInList}>{dashboardChrome}</View>
              }
            />
          </View>
        )}

        <DashboardFloatingHeader
          opacity={floatingHeaderOpacity}
          translateY={floatingHeaderTranslateY}
          onBack={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          onLogout={() => {
            Haptics.selectionAsync();
            setLogoutModalVisible(true);
          }}
        />
      </View>

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLogoutModalVisible(false)}
        >
          <GlassView intensity={70} tint="dark" style={styles.modalBlur}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalIcon}>
                  <Ionicons name="log-out-outline" size={32} color="#ef4444" />
                </View>
                <Text style={styles.modalTitle}>Logout</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to logout?
                </Text>
                <View style={styles.modalButtons}>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setLogoutModalVisible(false);
                    }}
                    style={styles.modalButtonCancel}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleLogout}
                    style={styles.modalButtonConfirm}
                  >
                    <Text style={styles.modalButtonConfirmText}>Logout</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </GlassView>
        </Pressable>
      </Modal>

      <LicenseUploadModal
        visible={licenseModalVisible}
        onClose={() => setLicenseModalVisible(false)}
        userId={user?._id || ""}
        onSuccess={() => {
          fetchReservations();
        }}
      />
    </>
  );
}

function DashboardFloatingHeader({
  opacity,
  translateY,
  onBack,
  onLogout,
}: {
  opacity: Animated.AnimatedInterpolation<number>;
  translateY: Animated.AnimatedInterpolation<number>;
  onBack: () => void;
  onLogout: () => void;
}) {
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.floatingHeader,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <GlassView
        pointerEvents="box-none"
        intensity={88}
        tint="dark"
        style={styles.floatingHeaderBlur}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.floatingIconButton,
            pressed && styles.floatingIconButtonPressed,
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={20} color="#f8fafc" />
        </Pressable>

        <Text style={styles.floatingHeaderTitle}>Dashboard</Text>

        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            styles.floatingIconButton,
            styles.floatingLogoutButton,
            pressed && styles.floatingIconButtonPressed,
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="log-out-outline" size={18} color="#fb7185" />
        </Pressable>
      </GlassView>
    </Animated.View>
  );
}

function DashboardHeader({
  name,
  onBack,
  onLogout,
}: {
  name: string;
  onBack: () => void;
  onLogout: () => void;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "S";

  return (
    <View style={styles.headerWrap}>
      <GlassView intensity={34} tint="dark" style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Pressable onPress={onBack} style={styles.headerIconButton}>
            <Ionicons name="chevron-back" size={21} color="#f8fafc" />
          </Pressable>
          <Text style={styles.headerCenterText}>Dashboard</Text>
          <Pressable
            onPress={onLogout}
            style={[styles.headerIconButton, styles.logoutButton]}
          >
            <Ionicons name="log-out-outline" size={18} color="#fb7185" />
          </Pressable>
        </View>

        <View style={styles.accountRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountKicker}>Welcome back</Text>
            <Text style={styles.accountName} numberOfLines={1}>
              {name}
            </Text>
          </View>
          <View style={styles.accountBadge}>
            <Ionicons name="shield-checkmark-outline" size={13} color={ACCENT} />
            <Text style={styles.accountBadgeText}>Secure</Text>
          </View>
        </View>
      </GlassView>
    </View>
  );
}

function DashboardSummary({
  total,
  active,
  hasLicense,
}: {
  total: number;
  active: number;
  hasLicense: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <SummaryTile
        icon="calendar-outline"
        label="Bookings"
        value={String(total)}
      />
      <SummaryTile icon="flash-outline" label="Active" value={String(active)} />
      <SummaryTile
        icon={hasLicense ? "checkmark-circle-outline" : "card-outline"}
        label="Licence"
        value={hasLicense ? "Ready" : "Needed"}
        warning={!hasLicense}
      />
    </View>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  warning,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <GlassView intensity={28} tint="dark" style={styles.summaryTile}>
      <View style={[styles.summaryIcon, warning && styles.summaryIconWarning]}>
        <Ionicons name={icon} size={16} color={warning ? "#fbbf24" : ACCENT} />
      </View>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel} numberOfLines={1}>
        {label}
      </Text>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  // safe: {
  //   // flex: 1,
  //   // backgroundColor: "#020617",
  // },
  container: {
    flex: 1,
  },
  authGuardLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  authGuardText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "800",
  },
  tabContent: {
    flex: 1,
  },
  profileScrollContent: {
    paddingBottom: 30,
  },
  profileCardWrap: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  chromeInList: {
    marginHorizontal: -20,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  floatingHeaderBlur: {
    minHeight: 88,
    paddingTop: 42,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(15,23,42,0.64)",
  },
  floatingHeaderTitle: {
    position: "absolute",
    left: 76,
    right: 76,
    bottom: 19,
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  floatingIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    zIndex: 1,
  },
  floatingLogoutButton: {
    backgroundColor: "rgba(127,29,29,0.16)",
    borderColor: "rgba(251,113,133,0.18)",
  },
  floatingIconButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 42,
    paddingBottom: 12,
  },
  headerCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,23,42,0.42)",
    padding: 12,
  },
  headerTop: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  headerCenterText: {
    color: "rgba(248,250,252,0.76)",
    fontSize: 13,
    fontWeight: "900",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },
  avatarText: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
  },
  accountCopy: {
    flex: 1,
    minWidth: 0,
  },
  accountKicker: {
    color: "rgba(248,250,252,0.54)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  accountName: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  accountBadge: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(254,154,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.24)",
  },
  accountBadgeText: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "900",
  },
  headerTitle: {
    color: "#f9fafb",
    fontSize: 20,
    fontWeight: "700",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    zIndex: 1,
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: "rgba(127,29,29,0.16)",
    borderColor: "rgba(251,113,133,0.16)",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  summaryTile: {
    flex: 1,
    minHeight: 76,
    borderRadius: 18,
    overflow: "hidden",
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(15,23,42,0.42)",
  },
  summaryIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.14)",
    marginBottom: 6,
  },
  summaryIconWarning: {
    backgroundColor: "rgba(251,191,36,0.13)",
  },
  summaryValue: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  summaryLabel: {
    color: "rgba(248,250,252,0.58)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(15,23,42,0.72)",
    marginHorizontal: 16,
    borderRadius: 22,
    padding: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    position: "relative",
    marginBottom: 10,
  },
  tabIndicator: {
    position: "absolute",
    top: 5,
    left: 5,
    bottom: 5,
    width: "50%", // Each tab takes half the width
    backgroundColor: ACCENT,
    borderRadius: 17,
    // Remove right: "50%" — it was causing issues
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    columnGap: 6,
    minHeight: 42,
    paddingVertical: 9,
    borderRadius: 17,
    zIndex: 1,
  },
  tabButtonActive: {},
  tabButtonPressed: {
    opacity: 0.8,
  },
  tabText: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "900",
  },
  tabTextActive: {
    color: "#0f172a",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  modalBlur: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1e293b5e",
    borderRadius: 20,
    padding: 24,
    width: 300,
    alignItems: "center",
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(239,68,68,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(148,163,184,0.1)",
  },
  modalButtonCancelText: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalButtonConfirmText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
});

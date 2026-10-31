// app/profile.tsx
import UserProfileCard from "@/components/dashboard/profile";
import UserReservations from "@/components/dashboard/reserve";
import ContractsContent from "@/components/dashboard/ContractsContent";
import LicenseUploadModal from "@/components/dashboard/LicenseUploadModal";
import { useAuth } from "@/contexts/AuthContext";
import { reservationService } from "@/services/reservationService";
import { Reservation } from "@/types/type";
import { isActiveReservationStatus } from "@/constants/reservationStatus";
import { registerBackgroundTask } from "@/utils/backgroundTask";
import {
  checkStatusChanges,
  showStatusNotification,
} from "@/utils/reservationNotifier";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlassView from "@/components/global/GlassView";
import HeaderBackButton from "@/components/global/HeaderBackButton";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ACCENT = "#fe9a00";
const INK = "#050914";
const PANEL = "#10182a";
const PANEL_2 = "#121b2e";

type TabKey = "profile" | "reservations" | "contracts";

const tabOrder: TabKey[] = ["reservations", "contracts", "profile"];

export default function ProfileScreen() {
  const tabsRowRef = useRef<View>(null);
  const [tabsRowWidth, setTabsRowWidth] = useState<number>(0);
  const {
    user,
    token,
    isLoading: authLoading,
    logout,
    refreshUser,
  } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("reservations");
  const [reservationFilter, setReservationFilter] = useState<"all" | "active">("all");
  const profileScrollRef = useRef<ScrollView>(null);
  const [profileCardY, setProfileCardY] = useState<number | null>(null);
  const [licenceY, setLicenceY] = useState<number | null>(null);
  const [scrollToLicence, setScrollToLicence] = useState(false);
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

  useEffect(() => {
    const prevTab = prevTabRef.current;
    prevTabRef.current = activeTab;

    if (prevTab !== activeTab && tabsRowWidth > 0) {
      const targetX = tabOrder.indexOf(activeTab);

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
      await Promise.all(changed.map((res) => showStatusNotification(res)));

      setReservations(newReservations);
    } catch (error) {
      console.log("Error fetching reservations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabsRowLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setTabsRowWidth(width);
  };

  const handleTabChange = (tab: TabKey) => {
    void Haptics.selectionAsync().catch(() => undefined);
    scrollY.setValue(0);
    if (tab !== "profile") setScrollToLicence(false);
    setActiveTab(tab);
  };

  const openReservations = (filter: "all" | "active") => {
    setReservationFilter(filter);
    void handleTabChange("reservations");
  };

  const openLicence = () => {
    if (activeTab !== "profile") {
      setProfileCardY(null);
      setLicenceY(null);
    }
    setScrollToLicence(true);
    void handleTabChange("profile");
  };

  useEffect(() => {
    if (!scrollToLicence || activeTab !== "profile" || profileCardY === null || licenceY === null) return;
    const frame = requestAnimationFrame(() => {
      profileScrollRef.current?.scrollTo({ y: Math.max(0, profileCardY + licenceY - 105), animated: true });
      setScrollToLicence(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [activeTab, licenceY, profileCardY, scrollToLicence]);

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

  const hasLicense =
    user?.licenceAttached?.front && user?.licenceAttached?.back;
  const activeReservationList = reservations.filter((reservation) => isActiveReservationStatus(reservation.status));
  const activeReservations = activeReservationList.length;

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
        familyName={user?.lastName || ""}
        avatar={user?.avatar}
        onProfilePress={() => handleTabChange("profile")}
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
        selectedFilter={activeTab === "reservations" ? reservationFilter : null}
        onBookings={() => openReservations("all")}
        onActive={() => openReservations("active")}
        onLicence={openLicence}
      />

      <View
        ref={tabsRowRef}
        onLayout={handleTabsRowLayout}
        style={styles.tabsRow}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabIndicator,
            tabsRowWidth > 0 && {
              transform: [
                {
                  translateX: indicatorX.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [
                      0,
                      (tabsRowWidth - 8) / 3,
                      ((tabsRowWidth - 8) / 3) * 2,
                    ],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#ffb32f", ACCENT, "#ee7800"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.tabIndicatorGloss} />
        </Animated.View>

        <Pressable
          testID="dashboard-tab-reservations"
          onPress={() => handleTabChange("reservations")}
          style={({ pressed }) => [
            styles.tabButton,
            pressed && styles.tabButtonPressed,
          ]}
        >
          <Ionicons
            name={
              activeTab === "reservations" ? "calendar" : "calendar-outline"
            }
            size={15}
            color={activeTab === "reservations" ? "#101827" : "#9aa5b6"}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={[
              styles.tabText,
              activeTab === "reservations" && styles.tabTextActive,
            ]}
          >
            Reservations
          </Text>
        </Pressable>

        <Pressable
          testID="dashboard-tab-contracts"
          onPress={() => handleTabChange("contracts")}
          style={({ pressed }) => [
            styles.tabButton,
            pressed && styles.tabButtonPressed,
          ]}
        >
          <Ionicons
            name={
              activeTab === "contracts"
                ? "document-text"
                : "document-text-outline"
            }
            size={15}
            color={activeTab === "contracts" ? "#101827" : "#9aa5b6"}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={[
              styles.tabText,
              activeTab === "contracts" && styles.tabTextActive,
            ]}
          >
            Agreements
          </Text>
        </Pressable>

        <Pressable
          testID="dashboard-tab-profile"
          onPress={() => handleTabChange("profile")}
          style={({ pressed }) => [
            styles.tabButton,
            pressed && styles.tabButtonPressed,
          ]}
        >
          <Ionicons
            name={activeTab === "profile" ? "person" : "person-outline"}
            size={16}
            color={activeTab === "profile" ? "#101827" : "#9aa5b6"}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
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
        <DashboardLicenseBanner onPress={() => setLicenseModalVisible(true)} />
      )}
    </>
  );

  if (authLoading || !token) {
    return (
      <View style={styles.container}>
        <DashboardBackground />
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
        <DashboardBackground />

        {activeTab === "profile" ? (
          <ScrollView
            ref={profileScrollRef}
            style={styles.tabContent}
            contentContainerStyle={styles.profileScrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleDashboardScroll}
            scrollEventThrottle={16}
          >
            {dashboardChrome}
            <View style={styles.profileCardWrap} onLayout={(event) => setProfileCardY(event.nativeEvent.layout.y)}>
              <UserProfileCard onLicenceLayout={setLicenceY} onAddLicence={() => setLicenseModalVisible(true)} />
            </View>
          </ScrollView>
        ) : activeTab === "contracts" ? (
          <View style={styles.tabContent}>
            <ContractsContent
              onScroll={handleDashboardScroll}
              ListHeaderComponent={
                <View style={styles.chromeInList}>{dashboardChrome}</View>
              }
            />
          </View>
        ) : (
          <View style={styles.tabContent}>
            <UserReservations
              reservations={reservationFilter === "active" ? activeReservationList : reservations}
              filterMode={reservationFilter}
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
          <GlassView intensity={78} tint="dark" style={styles.modalBlur}>
            <Pressable onPress={(event) => event.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalIcon}>
                  <Ionicons name="log-out-outline" size={25} color="#fb7185" />
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
                    style={({ pressed }) => [
                      styles.modalButtonCancel,
                      pressed && styles.modalButtonPressed,
                    ]}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleLogout}
                    style={({ pressed }) => [
                      styles.modalButtonConfirm,
                      pressed && styles.modalButtonPressed,
                    ]}
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
        onSuccess={async () => {
          await refreshUser();
          await fetchReservations();
        }}
      />
    </>
  );
}

function DashboardBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#070b13", "#080d18", "#050811"]}
        locations={[0, 0.54, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.backgroundTopGlow} />
      <View style={styles.backgroundSideGlow} />
      <View style={styles.backgroundVignette} />
    </View>
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
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.floatingHeader, { opacity, transform: [{ translateY }] }]}
    >
      <GlassView
        pointerEvents="box-none"
        intensity={92}
        tint="dark"
        style={[styles.floatingHeaderBlur, { paddingTop: Math.max(insets.top, 18) + 12 }]}
      >
        <HeaderBackButton onPress={onBack} />

        <Text style={styles.floatingHeaderTitle}>Dashboard</Text>

        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            styles.floatingIconButton,
            styles.floatingLogoutButton,
            pressed && styles.floatingIconButtonPressed,
          ]}
          hitSlop={10}
        >
          <Ionicons name="log-out-outline" size={17} color="#ff705f" />
        </Pressable>
      </GlassView>
    </Animated.View>
  );
}

function DashboardHeader({
  name,
  familyName,
  avatar,
  onProfilePress,
  onBack,
  onLogout,
}: {
  name: string;
  familyName: string;
  avatar?: string;
  onProfilePress: () => void;
  onBack: () => void;
  onLogout: () => void;
}) {
  const insets = useSafeAreaInsets();
  const initial = name.trim().charAt(0).toUpperCase() || "S";
  const avatarUri =
    typeof avatar === "string" && avatar.trim() ? avatar.trim() : null;

  return (
    <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top, 18) + 12 }]}>
      <View style={styles.headerTop}>
        <HeaderBackButton onPress={onBack} />
        <Text style={styles.headerCenterText}>Dashboard</Text>
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            styles.headerIconButton,
            styles.logoutButton,
            pressed && styles.headerIconButtonPressed,
          ]}
        >
          <Ionicons name="log-out-outline" size={17} color="#ff6b57" />
        </Pressable>
      </View>

      <Pressable
        onPress={onProfilePress}
        style={({ pressed }) => [
          styles.accountCard,
          pressed && styles.accountCardPressed,
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(255,155,20,0.42)",
            "rgba(74,47,33,0.76)",
            "rgba(22,28,47,0.97)",
          ]}
          locations={[0, 0.29, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.accountCardGlow} />
        <View style={styles.accountCardTopLine} />

        <View style={styles.avatarOuter}>
          <LinearGradient
            colors={["#ffd06b", "#ff9c12", "#e77700"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.avatarInner}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarPhoto}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
        </View>

        <View style={styles.accountCopy}>
          <Text style={styles.accountKicker}>WELCOME BACK</Text>
          <Text style={styles.accountName} numberOfLines={1}>
            {name} {familyName}
          </Text>
        </View>

        <View style={styles.accountBadge}>
          <Ionicons name="shield-checkmark-outline" size={12} color={ACCENT} />
          <Text style={styles.accountBadgeText}>Secure</Text>
        </View>
      </Pressable>
    </View>
  );
}

function DashboardSummary({
  total,
  active,
  hasLicense,
  selectedFilter,
  onBookings,
  onActive,
  onLicence,
}: {
  total: number;
  active: number;
  hasLicense: boolean;
  selectedFilter: "all" | "active" | null;
  onBookings: () => void;
  onActive: () => void;
  onLicence: () => void;
}) {
  return (
    <View style={styles.summaryRow}>
      <SummaryTile
        icon="calendar-outline"
        label="Bookings"
        value={String(total)}
        onPress={onBookings}
        selected={selectedFilter === "all"}
      />
      <SummaryTile icon="flash-outline" label="Active" value={String(active)} onPress={onActive} selected={selectedFilter === "active"} />
      <SummaryTile
        icon={hasLicense ? "checkmark-circle-outline" : "card-outline"}
        label="Licence"
        value={hasLicense ? "Ready" : "Needed"}
        warning={!hasLicense}
        onPress={onLicence}
      />
    </View>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  warning,
  onPress,
  selected,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  warning?: boolean;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable testID={`summary-${label.toLowerCase()}`} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.summaryTile, selected && styles.summaryTileSelected, pressed && styles.summaryTilePressed]}>
      <LinearGradient
        colors={["rgba(22,32,54,0.98)", "rgba(12,20,36,0.98)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.summaryTileEdge} />
      <View style={[styles.summaryIcon, warning && styles.summaryIconWarning]}>
        <Ionicons name={icon} size={15} color={warning ? "#f7b528" : ACCENT} />
      </View>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel} numberOfLines={1}>
        {label}
      </Text>
      {warning && <View style={styles.summaryWarningDot} />}
    </Pressable>
  );
}

function DashboardLicenseBanner({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.licenseBanner,
        pressed && styles.licenseBannerPressed,
      ]}
    >
      <LinearGradient
        colors={["rgba(107,53,14,0.76)", "rgba(30,28,32,0.97)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.licenseBannerGlow} />
      <View style={styles.licenseBannerIcon}>
        <Ionicons name="card-outline" size={17} color={ACCENT} />
      </View>
      <View style={styles.licenseBannerCopy}>
        <Text style={styles.licenseBannerTitle}>Driving licence needed</Text>
        <Text style={styles.licenseBannerSubtitle} numberOfLines={1}>
          Upload it once to complete bookings.
        </Text>
      </View>
      <View style={styles.uploadButton}>
        <Text style={styles.uploadButtonText}>Upload</Text>
        <Ionicons name="cloud-upload-outline" size={13} color="#121927" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: INK,
  },
  backgroundTopGlow: {
    position: "absolute",
    width: 230,
    height: 160,
    borderRadius: 120,
    top: 54,
    left: -104,
    backgroundColor: "rgba(254,154,0,0.07)",
  },
  backgroundSideGlow: {
    position: "absolute",
    width: 190,
    height: 260,
    borderRadius: 140,
    right: -122,
    top: 244,
    backgroundColor: "rgba(29,78,216,0.035)",
  },
  backgroundVignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.015)",
  },
  authGuardLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  authGuardText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
  },
  tabContent: { flex: 1 },
  profileScrollContent: { paddingBottom: 132 },
  profileCardWrap: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  chromeInList: { marginHorizontal: -16 },

  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  floatingHeaderBlur: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(5,9,20,0.82)",
  },
  floatingHeaderTitle: {
    position: "absolute",
    left: 76,
    right: 76,
    bottom: 20,
    color: "#f6f7fb",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  floatingIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    zIndex: 1,
  },
  floatingLogoutButton: {
    backgroundColor: "rgba(101,31,24,0.14)",
    borderColor: "rgba(255,112,95,0.13)",
  },
  floatingIconButtonPressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },

  headerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 9,
  },
  headerTop: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,30,49,0.86)",
    borderWidth: 1,
    borderColor: "rgba(139,164,194,0.11)",
  },
  headerIconButtonPressed: { opacity: 0.75, transform: [{ scale: 0.95 }] },
  logoutButton: {
    backgroundColor: "rgba(90,28,23,0.13)",
    borderColor: "rgba(255,103,84,0.13)",
  },
  headerCenterText: {
    color: "#f5f6f9",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.15,
  },

  accountCard: {
    minHeight: 72,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,170,61,0.24)",
    ...Platform.select({
      ios: {
        shadowColor: "#f28a00",
        shadowOpacity: 0.15,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 7 },
      },
      android: { elevation: 5 },
    }),
  },
  accountCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  accountCardGlow: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    left: -34,
    top: -20,
    backgroundColor: "rgba(255,161,34,0.19)",
  },
  accountCardTopLine: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,220,157,0.22)",
  },
  avatarOuter: {
    width: 49,
    height: 49,
    borderRadius: 25,
    padding: 2,
    overflow: "hidden",
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.45,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 7 },
    }),
  },
  avatarInner: {
    flex: 1,
    borderRadius: 23,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffae25",
    borderWidth: 1,
    borderColor: "rgba(255,239,199,0.65)",
  },
  avatarText: {
    color: "#111827",
    fontSize: 21,
    fontWeight: "900",
  },
  avatarPhoto: {
    width: "100%",
    height: "100%",
  },
  accountCopy: { flex: 1, minWidth: 0 },
  accountKicker: {
    color: ACCENT,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  accountName: {
    color: "#f7f8fb",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  accountBadge: {
    minHeight: 27,
    paddingHorizontal: 9,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(23,25,36,0.52)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.19)",
  },
  accountBadgeText: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: "800",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  summaryTile: {
    flex: 1,
    minWidth: 0,
    minHeight: 91,
    borderRadius: 14,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(114,143,182,0.12)",
  },
  summaryTileSelected: { borderColor: "rgba(254,154,0,0.55)" },
  summaryTilePressed: { opacity: 0.8 },
  summaryTileEdge: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  summaryIcon: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.14)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.22)",
    marginBottom: 9,
  },
  summaryIconWarning: { backgroundColor: "rgba(251,191,36,0.11)" },
  summaryValue: {
    color: "#f5f6f9",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900",
  },
  summaryLabel: {
    color: "rgba(214,222,234,0.56)",
    fontSize: 9.5,
    fontWeight: "700",
    marginTop: 3,
  },
  summaryWarningDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    bottom: 8,
    left: 11,
    backgroundColor: "#ff334f",
  },

  tabsRow: {
    minHeight: 42,
    flexDirection: "row",
    backgroundColor: "rgba(12,19,34,0.94)",
    marginHorizontal: 16,
    borderRadius: 22,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(108,137,174,0.18)",
    position: "relative",
    overflow: "hidden",
    marginBottom: 10,
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    width: "33.3333%",
    borderRadius: 18,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.32,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 5 },
    }),
  },
  tabIndicatorGloss: {
    position: "absolute",
    top: 1,
    left: 12,
    right: 12,
    height: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  tabButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
    minHeight: 34,
    borderRadius: 18,
    zIndex: 1,
  },
  tabButtonPressed: { opacity: 0.76 },
  tabText: {
    flexShrink: 1,
    minWidth: 0,
    color: "#a6afbd",
    fontSize: 10,
    fontWeight: "800",
  },
  tabTextActive: { color: "#111827" },

  licenseBanner: {
    minHeight: 58,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,154,0,0.22)",
  },
  licenseBannerPressed: { opacity: 0.83, transform: [{ scale: 0.99 }] },
  licenseBannerGlow: {
    position: "absolute",
    left: -34,
    top: -44,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(254,154,0,0.14)",
  },
  licenseBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.18)",
    marginRight: 9,
  },
  licenseBannerCopy: { flex: 1, minWidth: 0 },
  licenseBannerTitle: {
    color: "#f4f5f8",
    fontSize: 11.5,
    fontWeight: "900",
  },
  licenseBannerSubtitle: {
    color: "rgba(218,225,235,0.52)",
    fontSize: 8.5,
    fontWeight: "600",
    marginTop: 3,
  },
  uploadButton: {
    minHeight: 31,
    minWidth: 72,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: ACCENT,
  },
  uploadButtonText: {
    color: "#111827",
    fontSize: 9.5,
    fontWeight: "900",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.36)",
  },
  modalBlur: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 292,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    backgroundColor: "rgba(12,20,35,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  modalIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(239,68,68,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#f9fafb",
    marginBottom: 7,
  },
  modalMessage: {
    fontSize: 12,
    lineHeight: 18,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", gap: 10, width: "100%" },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "rgba(148,163,184,0.1)",
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.22)",
  },
  modalButtonPressed: { opacity: 0.72 },
  modalButtonCancelText: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  modalButtonConfirmText: {
    color: "#fb7185",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
});

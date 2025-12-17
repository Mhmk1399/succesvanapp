// app/profile.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import UserReservations from "@/components/dashboard/reserve";
import UserProfileCard from "@/components/dashboard/profile";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/AuthContext";
import { reservationService } from "@/services/reservationService";
import { Reservation } from "@/types/type";
import { checkStatusChanges, showStatusNotification } from "@/utils/reservationNotifier";
import { registerBackgroundTask } from "@/utils/backgroundTask";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCENT = "#fe9a00";

type TabKey = "profile" | "reservations";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("reservations");
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const router = useRouter();

  const indicatorX = useRef(new Animated.Value(1)).current;
  const prevTabRef = useRef(activeTab);

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

    if (prevTab !== activeTab) {
      const targetX = activeTab === "profile" ? 0 : 1;
      Animated.spring(indicatorX, {
        toValue: targetX,
        tension: 200,
        friction: 15,
        useNativeDriver: true,
      }).start();
    }
  }, [activeTab]);

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
      console.error("Error fetching reservations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = async (tab: TabKey) => {
    await Haptics.selectionAsync();
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

  return (
    <>
      <View style={styles.container}>
        <LinearGradient
          colors={["#fe9a00", "#0f172b"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#f9fafb" />
          </Pressable>
          <Text style={styles.headerTitle}>My Account</Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setLogoutModalVisible(true);
            }}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [
                  {
                    translateX: indicatorX.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 170],
                    }),
                  },
                ],
              },
            ]}
          />
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

          <Pressable
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
              size={16}
              color={activeTab === "reservations" ? "#0f172a" : "#e5e7eb"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "reservations" && styles.tabTextActive,
              ]}
            >
              My Bookings
            </Text>
          </Pressable>
        </View>

        {/* محتوا */}
        {activeTab === "profile" ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: 30,
            }}
            showsVerticalScrollIndicator={false}
          >
            <UserProfileCard
              name={user ? `${user.name} ${user.lastName}` : "User"}
              email={user?.emaildata.emailAddress || ""}
              phone={user?.phoneData.phoneNumber || ""}
            />

            {/* میتونی اینجا کارتهای دیگه مثل Payment Method / Address اضافه کنی */}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 10 }}>
            <UserReservations
              reservations={reservations}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </View>
        )}
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
          <BlurView intensity={70} tint="dark" style={styles.modalBlur}>
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
          </BlurView>
        </Pressable>
      </Modal>
    </>
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
  header: {
    paddingHorizontal: 20,
    marginTop: 40,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    zIndex: 10,
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
    padding: 8,
    zIndex: 10,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(15,23,42,0.9)",
    marginHorizontal: 16,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    right: "50%",
    bottom: 4,
    backgroundColor: ACCENT,
    borderRadius: 999,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    columnGap: 6,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 1,
  },
  tabButtonActive: {},
  tabButtonPressed: {
    opacity: 0.8,
  },
  tabText: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
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

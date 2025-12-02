import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Easing,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.82;

type AppRoute = "/" | "/vans" | "/dashboard";

interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route: AppRoute;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Home",
    icon: "home-outline",
    activeIcon: "home",
    route: "/",
    description: "Back to main page",
  },
  {
    label: "Our Vans",
    icon: "car-outline",
    activeIcon: "car",
    route: "/vans",
    description: "Browse our fleet",
  },
  {
    label: "My Bookings",
    icon: "calendar-outline",
    activeIcon: "calendar",
    route: "/dashboard",
    description: "View reservations",
  },
];

const ACCENT = "#fe9a00";
const DARK = "#0f172a";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  // Animations
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const menuButtonRotate = useRef(new Animated.Value(0)).current;

  // Menu item stagger animations
  const itemAnims = useRef(
    MENU_ITEMS.map(() => ({
      translateX: new Animated.Value(-30),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.95),
    }))
  ).current;

  // CTA animation
  const ctaAnim = useRef({
    translateY: new Animated.Value(20),
    opacity: new Animated.Value(0),
  }).current;

  const openMenu = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenuOpen(true);

    // Reset item animations
    itemAnims.forEach((anim) => {
      anim.translateX.setValue(-30);
      anim.opacity.setValue(0);
      anim.scale.setValue(0.95);
    });
    ctaAnim.translateY.setValue(20);
    ctaAnim.opacity.setValue(0);

    // Animate menu button
    Animated.timing(menuButtonRotate, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate overlay
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate sidebar
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();

    // Staggered menu items
    setTimeout(() => {
      Animated.stagger(
        80,
        itemAnims.map((anim) =>
          Animated.parallel([
            Animated.spring(anim.translateX, {
              toValue: 0,
              tension: 100,
              friction: 12,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.spring(anim.scale, {
              toValue: 1,
              tension: 150,
              friction: 10,
              useNativeDriver: true,
            }),
          ])
        )
      ).start();

      // CTA button animation
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(ctaAnim.translateY, {
            toValue: 0,
            tension: 100,
            friction: 12,
            useNativeDriver: true,
          }),
          Animated.timing(ctaAnim.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, MENU_ITEMS.length * 80);
    }, 150);
  };

  const closeMenu = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate menu button back
    Animated.timing(menuButtonRotate, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Animate overlay
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Animate sidebar out
    Animated.timing(slideAnim, {
      toValue: -SIDEBAR_WIDTH,
      duration: 280,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => setMenuOpen(false));
  };

  const navigateTo = async (route: AppRoute) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Quick press feedback
    Animated.sequence([
      Animated.timing(headerScale, {
        toValue: 0.98,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    closeMenu();
    setTimeout(() => router.push(route as any), 200);
  };

  const menuButtonRotation = menuButtonRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            paddingTop: insets.top + 10,
            transform: [{ scale: headerScale }],
          },
        ]}
      >
        <View style={styles.header}>
          {/* Menu Button */}
          <Pressable
            onPress={openMenu}
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.menuButtonPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.View
              style={{ transform: [{ rotate: menuButtonRotation }] }}
            >
              <Ionicons name="menu-outline" size={24} color="#fff" />
            </Animated.View>
          </Pressable>

          {/* Logo */}
          <Pressable
            onPress={() => navigateTo("/")}
            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Success</Text>
              <Text style={styles.logoAccent}>Van Hire</Text>
            </View>
          </Pressable>

          {/* Right placeholder for balance */}
          <View style={styles.headerRight} />
        </View>
      </Animated.View>

      {/* SIDEBAR MODAL */}
      <Modal visible={menuOpen} transparent animationType="none">
        {/* Overlay */}
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
        </Animated.View>

        {/* Sidebar */}
        <Animated.View
          style={[
            styles.sidebarContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <BlurView intensity={90} tint="dark" style={styles.sidebar}>
            {/* Sidebar Header */}
            <View
              style={[styles.sidebarHeader, { paddingTop: insets.top + 20 }]}
            >
              <View style={styles.brandContainer}>
                <View style={styles.brandIcon}>
                  <Ionicons name="car-sport" size={24} color={ACCENT} />
                </View>
                <View style={styles.brandInfo}>
                  <Text style={styles.brandName}>Success Van Hire</Text>
                  <Text style={styles.brandLocation}>
                    <Ionicons name="location" size={12} color="#888" /> London,
                    UK
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={closeMenu}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed,
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Menu Items */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>NAVIGATION</Text>

              <View style={styles.menuItems}>
                {MENU_ITEMS.map((item, index) => {
                  const isActive = item.route === pathname;

                  return (
                    <Animated.View
                      key={item.route}
                      style={{
                        opacity: itemAnims[index].opacity,
                        transform: [
                          { translateX: itemAnims[index].translateX },
                          { scale: itemAnims[index].scale },
                        ],
                      }}
                    >
                      <Pressable
                        onPress={() => navigateTo(item.route)}
                        onPressIn={() => Haptics.selectionAsync()}
                        style={({ pressed }) => [
                          styles.menuItem,
                          isActive && styles.menuItemActive,
                          pressed && !isActive && styles.menuItemPressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.menuIconWrapper,
                            isActive && styles.menuIconWrapperActive,
                          ]}
                        >
                          <Ionicons
                            name={isActive ? item.activeIcon : item.icon}
                            size={20}
                            color={isActive ? "#fff" : ACCENT}
                          />
                        </View>

                        <View style={styles.menuTextContainer}>
                          <Text
                            style={[
                              styles.menuLabel,
                              isActive && styles.menuLabelActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                          <Text
                            style={[
                              styles.menuDescription,
                              isActive && styles.menuDescriptionActive,
                            ]}
                          >
                            {item.description}
                          </Text>
                        </View>

                        {isActive && (
                          <View style={styles.activeIndicator}>
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color={ACCENT}
                            />
                          </View>
                        )}
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </View>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Bottom Section */}
            <Animated.View
              style={[
                styles.bottomSection,
                {
                  opacity: ctaAnim.opacity,
                  transform: [{ translateY: ctaAnim.translateY }],
                },
              ]}
            >
              {/* Quick Info */}
              <View style={styles.quickInfo}>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={16} color="#888" />
                  <Text style={styles.infoText}>24/7 Available</Text>
                </View>
                <View style={styles.infoDot} />
                <View style={styles.infoItem}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color="#888"
                  />
                  <Text style={styles.infoText}>Insured</Text>
                </View>
              </View>

              {/* CTA Button */}
              <Pressable
                onPress={() => navigateTo("/dashboard")}
                onPressIn={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                }
                style={({ pressed }) => [
                  styles.ctaButton,
                  pressed && styles.ctaButtonPressed,
                ]}
              >
                <LinearGradient
                  colors={[ACCENT, "#ff8c00"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaGradient}
                >
                  <Ionicons name="flash" size={18} color={DARK} />
                  <Text style={styles.ctaText}>Book a Van Now</Text>
                  <Ionicons name="arrow-forward" size={18} color={DARK} />
                </LinearGradient>
              </Pressable>

              {/* Footer */}
              <View
                style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
              >
                <Text style={styles.footerText}>
                  Fast • Reliable • Affordable
                </Text>
                <Text style={styles.versionText}>v1.0.0</Text>
              </View>
            </Animated.View>
          </BlurView>

          {/* Edge shadow */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.edgeShadow}
          />
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ============ HEADER ============
  headerWrapper: {
    backgroundColor: DARK,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.15)",
    transform: [{ scale: 0.95 }],
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  logoAccent: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 44,
  },

  // ============ OVERLAY ============
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  // ============ SIDEBAR ============
  sidebarContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    flexDirection: "row",
  },
  sidebar: {
    flex: 1,
    paddingHorizontal: 24,
  },
  edgeShadow: {
    position: "absolute",
    right: -20,
    top: 0,
    bottom: 0,
    width: 20,
  },

  // ============ SIDEBAR HEADER ============
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 20,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(254,154,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  brandInfo: {
    gap: 4,
  },
  brandName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  brandLocation: {
    color: "#888",
    fontSize: 13,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // ============ DIVIDER ============
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 24,
  },

  // ============ MENU SECTION ============
  menuSection: {
    gap: 16,
  },
  sectionTitle: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  menuItems: {
    gap: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 14,
  },
  menuItemActive: {
    backgroundColor: "rgba(254,154,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.2)",
  },
  menuItemPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(254,154,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconWrapperActive: {
    backgroundColor: ACCENT,
  },
  menuTextContainer: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  menuLabelActive: {
    color: ACCENT,
  },
  menuDescription: {
    color: "#666",
    fontSize: 12,
  },
  menuDescriptionActive: {
    color: "rgba(254,154,0,0.7)",
  },
  activeIndicator: {
    marginLeft: "auto",
  },

  // ============ BOTTOM SECTION ============
  bottomSection: {
    gap: 16,
  },
  quickInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "500",
  },
  infoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
  },

  // ============ CTA BUTTON ============
  ctaButton: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  ctaText: {
    color: DARK,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ============ FOOTER ============
  footer: {
    alignItems: "center",
    gap: 6,
    paddingTop: 16,
  },
  footerText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  versionText: {
    color: "#444",
    fontSize: 11,
  },
});

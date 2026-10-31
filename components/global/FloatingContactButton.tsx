import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Pressable,
  Linking,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import GlassView from "@/components/global/GlassView";
import * as Haptics from "expo-haptics";

const ACCENT = "#fe9a00";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function FloatingContactButton() {
  const dockTranslateY = useRef(new Animated.Value(0)).current;
  const lastDockOffsetY = useRef(0);
  const [modalVisible, setModalVisible] = useState(false);
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const openModal = () => {
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 6 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        const nextOffset = Math.max(
          -170,
          Math.min(88, lastDockOffsetY.current + gestureState.dy),
        );
        dockTranslateY.setValue(nextOffset);
      },
      onPanResponderRelease: (_, gestureState) => {
        lastDockOffsetY.current = Math.max(
          -170,
          Math.min(88, lastDockOffsetY.current + gestureState.dy),
        );
        dockTranslateY.setValue(lastDockOffsetY.current);
      },
    }),
  ).current;

  const makeCall = () => {
    Linking.openURL("tel:+442030111198");
    closeModal();
  };

  const sendEmail = () => {
    Linking.openURL("mailto:successvanhire.tech@gmail.com");
    closeModal();
  };

  return (
    <>
      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.floatingButton,
            {
              transform: [{ translateY: dockTranslateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Pressable
            onPress={openModal}
            style={({ pressed }) => [
              styles.supportDock,
              pressed && styles.supportDockPressed,
            ]}
          >
            <LinearGradient
              colors={["#1b2635", "#111a27", "#0a111d"]}
              locations={[0, 0.48, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.supportDockGradient}
            >
              <View pointerEvents="none" style={styles.supportGlow} />
              <View style={styles.onlineDot} />

              <LinearGradient
                colors={["#ffc14a", ACCENT, "#d86f00"]}
                style={styles.supportIconBubble}
              >
                <Ionicons name="chatbubbles" size={18} color="#ffffff" />
              </LinearGradient>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }],
              },
            ]}
          >
            <Pressable style={styles.modalSurface}>
              <GlassView intensity={96} tint="dark" style={styles.modalBlur}>
                <LinearGradient
                  colors={[
                    "rgba(25,31,39,0.98)",
                    "rgba(18,24,32,0.99)",
                    "rgba(12,18,26,0.995)",
                  ]}
                  locations={[0, 0.42, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.8, y: 1 }}
                  style={styles.modalGradient}
                >
                  <View pointerEvents="none" style={styles.topHighlight} />
                  <View pointerEvents="none" style={styles.orangeAmbient} />

                  <Pressable
                    onPress={closeModal}
                    hitSlop={10}
                    style={({ pressed }) => [
                      styles.headerClose,
                      pressed && styles.headerClosePressed,
                    ]}
                  >
                    <Ionicons name="close" size={19} color="#e5e7eb" />
                  </Pressable>

                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>How can we help?</Text>
                    <Text style={styles.modalSubtitle}>
                      Our support team is here to help{"\n"}you{" "}
                      <Text style={styles.subtitleAccent}>24/7</Text> with
                      anything you need.
                    </Text>
                  </View>

                  <View style={styles.modalOptions}>
                    <ContactOption
                      icon="call"
                      title="Call Us Now"
                      badge="Available 24/7"
                      badgeTone="success"
                      description="Speak with our support team instantly."
                      value="+44 20 3011 1198"
                      onPress={makeCall}
                    />

                    <ContactOption
                      icon="mail"
                      title="Email Support"
                      badge="Fast response"
                      badgeTone="info"
                      description="Send us an email and we'll get back to you shortly."
                      value="support@successvanhire.com"
                      onPress={sendEmail}
                    />
                  </View>

                  <View style={styles.benefitsCard}>
                    <Benefit
                      icon="shield-checkmark-outline"
                      title="Secure & Safe"
                      description={"Your information\nis protected"}
                    />
                    <View style={styles.benefitDivider} />
                    <Benefit
                      icon="time-outline"
                      title="Fast Response"
                      description={"We usually reply\nwithin 2 hours"}
                    />
                    <View style={styles.benefitDivider} />
                    <Benefit
                      icon="people-outline"
                      title="Expert Team"
                      description={"Real people,\nready to help"}
                    />
                  </View>

                  <Pressable
                    onPress={closeModal}
                    style={({ pressed }) => [
                      styles.modalCloseButton,
                      pressed && styles.modalClosePressed,
                    ]}
                  >
                    <LinearGradient
                      colors={["rgba(39,47,58,0.96)", "rgba(28,36,46,0.96)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modalCloseGradient}
                    >
                      <Text style={styles.modalCloseText}>Close</Text>
                    </LinearGradient>
                  </Pressable>
                </LinearGradient>
              </GlassView>

              {/* Kept outside the clipped glass surface so the crest can sit
                  cleanly across the modal edge without being cut off. */}
              <View pointerEvents="none" style={styles.supportCrestWrap}>
                <View style={styles.supportCrestHaloOuter} />
                <View style={styles.supportCrestHaloInner} />
                <View style={styles.supportCrestRing}>
                  <LinearGradient
                    colors={["#ffc34d", ACCENT, "#d46d00"]}
                    locations={[0, 0.56, 1]}
                    start={{ x: 0.18, y: 0 }}
                    end={{ x: 0.82, y: 1 }}
                    style={styles.supportCrest}
                  >
                    <View
                      pointerEvents="none"
                      style={styles.supportCrestGloss}
                    />
                    <Ionicons name="headset" size={30} color="#ffffff" />
                  </LinearGradient>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

type ContactOptionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge: string;
  badgeTone: "success" | "info";
  description: string;
  value: string;
  onPress: () => void;
};

function ContactOption({
  icon,
  title,
  badge,
  badgeTone,
  description,
  value,
  onPress,
}: ContactOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.modalOption,
        pressed && styles.modalOptionPressed,
      ]}
    >
      <LinearGradient
        colors={["rgba(39,46,55,0.96)", "rgba(29,36,45,0.96)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.modalOptionGradient}
      >
        <View pointerEvents="none" style={styles.optionTopHighlight} />

        <View style={styles.modalOptionIconWrapper}>
          <View style={styles.modalOptionIconHalo} />
          <LinearGradient
            colors={["#ffb52f", ACCENT, "#c96b00"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.modalOptionIcon}
          >
            <Ionicons name={icon} size={21} color="#fff" />
          </LinearGradient>
        </View>

        <View style={styles.modalOptionText}>
          <View style={styles.optionTitleRow}>
            <Text style={styles.modalOptionTitle}>{title}</Text>
            <View
              style={[
                styles.optionBadge,
                badgeTone === "success"
                  ? styles.optionBadgeSuccess
                  : styles.optionBadgeInfo,
              ]}
            >
              <Text
                style={[
                  styles.optionBadgeText,
                  badgeTone === "success"
                    ? styles.optionBadgeSuccessText
                    : styles.optionBadgeInfoText,
                ]}
              >
                {badge}
              </Text>
            </View>
          </View>
          <Text style={styles.modalOptionDesc}>{description}</Text>
          <Text style={styles.modalOptionValue}>{value}</Text>
        </View>

        <View style={styles.optionArrow}>
          <Ionicons name="arrow-forward" size={16} color={ACCENT} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

type BenefitProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

function Benefit({ icon, title, description }: BenefitProps) {
  return (
    <View style={styles.benefitItem}>
      <Ionicons name={icon} size={20} color={ACCENT} />
      <Text style={styles.benefitTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.benefitDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    top: "50%",
    zIndex: 850,
    pointerEvents: "box-none",
  },
  floatingButton: {
    marginTop: -24,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 8, height: 0 },
        shadowOpacity: 0.48,
        shadowRadius: 18,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  supportDock: {
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
    borderLeftWidth: 0,
    borderColor: "rgba(255,198,96,0.28)",
    backgroundColor: "rgba(8,14,24,0.98)",
  },
  supportDockPressed: {
    opacity: 0.82,
  },
  supportDockGradient: {
    width: 46,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 2,
    paddingRight: 7,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  supportGlow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    left: -23,
    top: -10,
    backgroundColor: "rgba(254,154,0,0.2)",
  },
  onlineDot: {
    position: "absolute",
    top: 9,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 3,
    backgroundColor: "#22c55e",
    borderWidth: 1,
    borderColor: "#0a111d",
  },
  supportIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,236,194,0.34)",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: Math.min(SCREEN_WIDTH - 48, 354),
    marginTop: 34,
    overflow: "visible",
  },
  modalSurface: {
    position: "relative",
    overflow: "visible",
  },
  modalBlur: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(181,193,207,0.22)",
    backgroundColor: "rgba(13,18,25,0.98)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.55,
        shadowRadius: 36,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalGradient: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 50,
    paddingBottom: 14,
    overflow: "hidden",
  },
  topHighlight: {
    position: "absolute",
    left: 28,
    right: 28,
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  orangeAmbient: {
    position: "absolute",
    width: 176,
    height: 120,
    borderRadius: 88,
    top: -70,
    left: "50%",
    marginLeft: -88,
    backgroundColor: "rgba(254,154,0,0.075)",
  },
  supportCrestWrap: {
    position: "absolute",
    top: -47,
    left: "50%",
    width: 94,
    height: 94,
    marginLeft: -47,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    elevation: 30,
  },
  supportCrestHaloOuter: {
    position: "absolute",
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "rgba(254,154,0,0.055)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.07)",
  },
  supportCrestHaloInner: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(254,154,0,0.085)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.13)",
  },
  supportCrestRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 5,
    backgroundColor: "#111820",
    borderWidth: 1.25,
    borderColor: "rgba(255,194,83,0.52)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.58,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 22 },
    }),
  },
  supportCrest: {
    flex: 1,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  supportCrestGloss: {
    position: "absolute",
    top: 3,
    left: 10,
    right: 10,
    height: 15,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  headerClose: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  headerClosePressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "900",
    letterSpacing: -0.35,
    marginBottom: 5,
  },
  modalSubtitle: {
    color: "rgba(229,235,243,0.66)",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitleAccent: {
    color: ACCENT,
    fontWeight: "900",
  },

  modalOptions: {
    gap: 9,
    marginBottom: 10,
  },
  modalOption: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(170,184,201,0.14)",
    backgroundColor: "rgba(31,38,47,0.98)",
  },
  modalOptionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  modalOptionGradient: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  optionTopHighlight: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  modalOptionIconWrapper: {
    width: 49,
    height: 49,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOptionIconHalo: {
    position: "absolute",
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: "rgba(254,154,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.16)",
  },
  modalOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOptionText: {
    flex: 1,
    minWidth: 0,
  },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 3,
  },
  modalOptionTitle: {
    color: "#f8fafc",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.1,
  },
  optionBadge: {
    minHeight: 17,
    paddingHorizontal: 6,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  optionBadgeSuccess: {
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  optionBadgeInfo: {
    backgroundColor: "rgba(59,130,246,0.13)",
  },
  optionBadgeText: {
    fontSize: 7.5,
    fontWeight: "900",
  },
  optionBadgeSuccessText: {
    color: "#54d982",
  },
  optionBadgeInfoText: {
    color: "#67a9ff",
  },
  modalOptionDesc: {
    color: "rgba(226,232,240,0.66)",
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalOptionValue: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: "900",
  },
  optionArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.13)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.12)",
  },

  benefitsCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 4,
    marginBottom: 10,
    backgroundColor: "rgba(29,36,45,0.94)",
    borderWidth: 1,
    borderColor: "rgba(170,184,201,0.12)",
  },
  benefitItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  benefitDivider: {
    width: 1,
    marginVertical: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  benefitTitle: {
    color: "#f8fafc",
    fontSize: 8.5,
    fontWeight: "900",
    marginTop: 6,
    textAlign: "center",
  },
  benefitDescription: {
    color: "rgba(207,216,228,0.55)",
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
  },

  modalCloseButton: {
    borderRadius: 13,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalCloseGradient: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  modalClosePressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  modalCloseText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
  },
});

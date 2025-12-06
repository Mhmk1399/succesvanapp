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
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

const ACCENT = "#fe9a00";
const EXPAND_THRESHOLD = 50;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function FloatingContactButton() {
  const translateX = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx < 100) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > EXPAND_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 60,
            friction: 8,
          }).start();
          openModal();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 60,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const makeCall = () => {
    Linking.openURL("tel:+442012345678");
    closeModal();
  };

  const sendEmail = () => {
    Linking.openURL("mailto:support@successvanhire.com");
    closeModal();
  };

  return (
    <>
      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.floatingButton,
            {
              transform: [{ translateX }, { scale: pulseAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Pressable onPress={openModal} style={styles.arrowTab}>
            <BlurView intensity={80} tint="dark" style={styles.arrowBlur}>
              <LinearGradient
                colors={["rgba(254,154,0,0.2)", "rgba(255,140,0,0.3)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.arrowGradient}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name="chatbubbles" size={18} color="#fff" />
                </View>
              </LinearGradient>
            </BlurView>
          </Pressable>
        </Animated.View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
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
            <Pressable>
              <BlurView intensity={100} tint="dark" style={styles.modalBlur}>
                <LinearGradient
                  colors={[
                    "rgba(15,23,42,0.1)",
                    "rgba(30,41,59,0.95)",
                    "rgba(15,23,42,0.98)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.modalGradient}
                >
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconContainer}>
                      <LinearGradient
                        colors={[ACCENT, "#ff8c00"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalIconGradient}
                      >
                        <Ionicons name="headset" size={28} color="#fff" />
                      </LinearGradient>
                    </View>
                    <Text style={styles.modalTitle}>Get in Touch</Text>
                    <Text style={styles.modalSubtitle}>
                      Choose your preferred contact method
                    </Text>
                  </View>

                  <View style={styles.modalOptions}>
                    <Pressable
                      onPress={makeCall}
                      style={({ pressed }) => [
                        styles.modalOption,
                        pressed && styles.modalOptionPressed,
                      ]}
                    >
                      <LinearGradient
                        colors={[
                          "rgba(254,154,0,0.15)",
                          "rgba(254,154,0,0.05)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalOptionGradient}
                      >
                        <View style={styles.modalOptionLeft}>
                          <View style={styles.modalOptionIconWrapper}>
                            <LinearGradient
                              colors={[ACCENT, "#ff8c00"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.modalOptionIcon}
                            >
                              <Ionicons name="call" size={24} color="#fff" />
                            </LinearGradient>
                          </View>
                          <View style={styles.modalOptionText}>
                            <Text style={styles.modalOptionTitle}>
                              Call Us Now
                            </Text>
                            <Text style={styles.modalOptionDesc}>
                              +44 20 1234 5678
                            </Text>
                            <Text style={styles.modalOptionBadge}>
                              Available 24/7
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name="arrow-forward-circle"
                          size={28}
                          color={ACCENT}
                        />
                      </LinearGradient>
                    </Pressable>

                    <Pressable
                      onPress={sendEmail}
                      style={({ pressed }) => [
                        styles.modalOption,
                        pressed && styles.modalOptionPressed,
                      ]}
                    >
                      <LinearGradient
                        colors={[
                          "rgba(254,154,0,0.15)",
                          "rgba(254,154,0,0.05)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalOptionGradient}
                      >
                        <View style={styles.modalOptionLeft}>
                          <View style={styles.modalOptionIconWrapper}>
                            <LinearGradient
                              colors={["#ff6b00", ACCENT]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.modalOptionIcon}
                            >
                              <Ionicons name="mail" size={24} color="#fff" />
                            </LinearGradient>
                          </View>
                          <View style={styles.modalOptionText}>
                            <Text style={styles.modalOptionTitle}>
                              Email Support
                            </Text>
                            <Text style={styles.modalOptionDesc}>
                              support@successvanhire.com
                            </Text>
                            <Text style={styles.modalOptionBadge}>
                              Response within 2 hours
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name="arrow-forward-circle"
                          size={28}
                          color={ACCENT}
                        />
                      </LinearGradient>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={closeModal}
                    style={({ pressed }) => [
                      styles.modalCloseButton,
                      pressed && styles.modalClosePressed,
                    ]}
                  >
                    <Text style={styles.modalCloseText}>Close</Text>
                  </Pressable>
                </LinearGradient>
              </BlurView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    zIndex: 1000,
    justifyContent: "center",
    pointerEvents: "box-none",
  },
  floatingButton: {
    position: "absolute",
    left: 0,
    top: "50%",
    marginTop: -2,
  },
  arrowTab: {
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
    borderLeftWidth: 0,
    borderColor: "rgba(254,154,0,0.1)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 8, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  arrowBlur: {
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  arrowGradient: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    paddingRight: 8,
    paddingLeft: 2,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  contactLabel: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
  },
  modalBlur: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(254,154,0,0.3)",
  },
  modalGradient: {
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  modalOptions: {
    gap: 12,
    marginBottom: 20,
  },
  modalOption: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  modalOptionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  modalOptionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  modalOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  modalOptionIconWrapper: {
    borderRadius: 24,
    overflow: "hidden",
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalOptionDesc: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalOptionBadge: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "600",
  },
  modalCloseButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modalClosePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  modalCloseText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "700",
  },
});

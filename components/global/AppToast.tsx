import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import GlassView from "./GlassView";

type ToastType = "success" | "error" | "info";

export type ToastPayload = {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
};

type ToastContextValue = {
  showToast: (payload: ToastPayload | string) => void;
  hideToast: () => void;
};

type ToastListener = (payload: ToastPayload) => void;

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const listeners = new Set<ToastListener>();

export const toast = {
  show(payload: ToastPayload | string) {
    const normalized =
      typeof payload === "string" ? { message: payload } : payload;
    listeners.forEach((listener) => listener(normalized));
  },
  success(message: string, title = "Done") {
    toast.show({ type: "success", title, message });
  },
  error(message: string, title = "Something went wrong") {
    toast.show({ type: "error", title, message });
  },
  info(message: string, title = "Heads up") {
    toast.show({ type: "info", title, message });
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const translateY = useRef(new Animated.Value(-28)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentToast, setCurrentToast] = useState<ToastPayload | null>(null);
  const [portalKey, setPortalKey] = useState(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clearTimer();
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -28,
        duration: 170,
        useNativeDriver: true,
      }),
    ]).start(() => setCurrentToast(null));
  }, [clearTimer, opacity, translateY]);

  const showToast = useCallback(
    (payload: ToastPayload | string) => {
      const normalized =
        typeof payload === "string" ? { message: payload } : payload;

      clearTimer();
      setPortalKey((value) => value + 1);
      setCurrentToast({
        type: "info",
        duration: 2800,
        ...normalized,
      });

      translateY.setValue(-28);
      opacity.setValue(0);

      if (normalized.type === "error") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (normalized.type === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.selectionAsync();
      }

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 190,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(hideToast, normalized.duration ?? 2800);
    },
    [clearTimer, hideToast, opacity, translateY],
  );

  useEffect(() => {
    listeners.add(showToast);
    return () => {
      listeners.delete(showToast);
      clearTimer();
    };
  }, [clearTimer, showToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Modal
        key={`toast-portal-${portalKey}`}
        visible={!!currentToast}
        transparent
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        hardwareAccelerated
        presentationStyle="overFullScreen"
        onRequestClose={hideToast}
      >
        <View pointerEvents="box-none" style={styles.toastPortal}>
          {currentToast && (
            <Animated.View
              pointerEvents="box-none"
              style={[
                styles.toastWrap,
                {
                  opacity,
                  transform: [{ translateY }],
                },
              ]}
            >
              <Pressable onPress={hideToast} style={styles.pressable}>
                <GlassView
                  intensity={100}
                  tint="dark"
                  blurReductionFactor={Platform.OS === "android" ? 1 : undefined}
                  overlayStyle={styles.toastGlassOverlay}
                  style={styles.toastCard}
                >
                  <View pointerEvents="none" style={styles.toastReadableBase} />
                  <View
                    style={[
                      styles.iconWrap,
                      currentToast.type === "success" && styles.iconSuccess,
                      currentToast.type === "error" && styles.iconError,
                    ]}
                  >
                    <Ionicons
                      name={getIconName(currentToast.type)}
                      size={17}
                      color={getIconColor(currentToast.type)}
                    />
                  </View>

                  <View style={styles.copy}>
                    {!!currentToast.title && (
                      <Text style={styles.title} numberOfLines={2}>
                        {currentToast.title}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.message,
                        !currentToast.title && styles.messageOnly,
                      ]}
                      numberOfLines={4}
                    >
                      {currentToast.message}
                    </Text>
                  </View>
                </GlassView>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </Modal>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function getIconName(type?: ToastType) {
  if (type === "success") return "checkmark";
  if (type === "error") return "close";
  return "information";
}

function getIconColor(type?: ToastType) {
  if (type === "success") return "#052e16";
  if (type === "error") return "#450a0a";
  return "#0f172a";
}

const styles = StyleSheet.create({
  toastPortal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999999999999999,
    elevation: 999999999999999999,
  },
  toastWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 34,
    left: 14,
    right: 14,
    zIndex: 999999,
    elevation: 999999,
    alignItems: "center",
  },
  pressable: {
    width: "100%",
    maxWidth: 430,
  },
  toastCard: {
    minHeight: 62,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(2,6,23,0.92)" : "rgba(2,6,23,0.76)",
    paddingVertical: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
  },
  toastGlassOverlay: {
    opacity: Platform.OS === "android" ? 0.96 : 0.9,
  },
  toastReadableBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      Platform.OS === "android" ? "rgba(2,6,23,0.88)" : "rgba(2,6,23,0.58)",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
    marginRight: 10,
  },
  iconSuccess: {
    backgroundColor: "#86efac",
  },
  iconError: {
    backgroundColor: "#fca5a5",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 17,
  },
  message: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12.5,
    fontWeight: "700",
    marginTop: 2,
    lineHeight: 17,
  },
  messageOnly: {
    color: "#ffffff",
    fontSize: 13,
    marginTop: 0,
    lineHeight: 18,
  },
});

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

      timerRef.current = setTimeout(
        hideToast,
        normalized.duration ?? 2800,
      );
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
            <GlassView intensity={82} tint="dark" style={styles.toastCard}>
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
                  <Text style={styles.title} numberOfLines={1}>
                    {currentToast.title}
                  </Text>
                )}
                <Text
                  style={[
                    styles.message,
                    !currentToast.title && styles.messageOnly,
                  ]}
                  numberOfLines={2}
                >
                  {currentToast.message}
                </Text>
              </View>
            </GlassView>
          </Pressable>
        </Animated.View>
      )}
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
    maxWidth: 420,
  },
  toastCard: {
    minHeight: 58,
    borderRadius: 29,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(15,23,42,0.68)",
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.26,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
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
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  message: {
    color: "rgba(248,250,252,0.72)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    lineHeight: 16,
  },
  messageOnly: {
    color: "#f8fafc",
    fontSize: 13,
    marginTop: 0,
  },
});

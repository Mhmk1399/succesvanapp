import React, { createContext, ReactNode, useContext, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type AlertPayload = { title?: string; message?: string };

type AlertContextType = {
  showAlert: (title?: string, message?: string) => void;
  hideAlert: () => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<AlertPayload>({
    title: "",
    message: "",
  });

  const showAlert = (title?: string, message?: string) => {
    console.log("[AlertProvider] showAlert called:", { title, message });
    setPayload({ title: title || "", message: message || "" });
    setVisible(true);
  };

  const hideAlert = () => setVisible(false);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
        onRequestClose={hideAlert}
      >
        <Pressable style={styles.backdrop} onPress={hideAlert}>
          <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>{payload.title}</Text>
            <Text style={styles.message}>{payload.message}</Text>
            <View style={styles.actions}>
              <Pressable
                onPress={hideAlert}
                style={({ pressed }) => [
                  styles.button,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.buttonText}>OK</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      {/* Fallback absolute overlay in case native Modal is occluded by other native overlays */}
      {visible && (
        <View style={styles.fallbackOverlay} pointerEvents="auto">
          <Pressable style={styles.backdrop} onPress={hideAlert}>
            <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.title}>{payload.title}</Text>
              <Text style={styles.message}>{payload.message}</Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={hideAlert}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.buttonText}>OK</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </View>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 99999,
  },
  box: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0b1220",
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    zIndex: 99999,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  message: { color: "#cbd5e1", marginBottom: 14 },
  actions: { flexDirection: "row", justifyContent: "flex-end" },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(254,154,0,0.95)",
  },
  buttonText: { color: "#0b1220", fontWeight: "800" },
  fallbackOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 999999,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AlertProvider;

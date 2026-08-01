import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import GlassView from "./GlassView";

const ACCENT = "#fe9a00";

export type VanRule = {
  _id?: string;
  key?: string;
  value?: string;
};

type VanRulesModalProps = {
  visible: boolean;
  vanName?: string;
  rules?: VanRule[];
  requiredLicense?: string;
  onClose: () => void;
};

export function hasVanRules(rules?: VanRule[], requiredLicense?: string) {
  return (
    Boolean(requiredLicense?.trim()) ||
    Boolean(
      rules?.some((rule) => rule?.key?.trim() || rule?.value?.trim()),
    )
  );
}

export default function VanRulesModal({
  visible,
  vanName,
  rules,
  requiredLicense,
  onClose,
}: VanRulesModalProps) {
  const readableRules = React.useMemo(
    () =>
      (rules || [])
        .map((rule) => ({
          key: rule?.key?.trim(),
          value: rule?.value?.trim(),
        }))
        .filter((rule) => rule.key || rule.value),
    [rules],
  );

  if (!hasVanRules(rules, requiredLicense)) return null;

  const handleClose = () => {
    Haptics.selectionAsync();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <GlassView intensity={86} tint="dark" style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.iconBubble}>
              <Ionicons name="shield-checkmark" size={22} color="#0f172a" />
            </View>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={19} color="#e5e7eb" />
            </Pressable>
          </View>

          <Text style={styles.kicker}>Before you book</Text>
          <Text style={styles.title} numberOfLines={2}>
            {vanName ? `${vanName} rules` : "Van booking rules"}
          </Text>
          <Text style={styles.subtitle}>
            Please review the important booking conditions for this vehicle.
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {!!requiredLicense?.trim() && (
              <View style={styles.licenseRow}>
                <View style={styles.licenseIcon}>
                  <Ionicons name="card-outline" size={17} color={ACCENT} />
                </View>
                <View style={styles.licenseCopy}>
                  <Text style={styles.ruleLabel}>Required licence</Text>
                  <Text style={styles.ruleValue}>{requiredLicense}</Text>
                </View>
              </View>
            )}

            {readableRules.length > 0 ? (
              readableRules.map((rule, index) => (
                <View key={`${rule.key || "rule"}-${index}`} style={styles.ruleRow}>
                  <View style={styles.ruleNumber}>
                    <Text style={styles.ruleNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.ruleCopy}>
                    {!!rule.key && (
                      <Text style={styles.ruleLabel}>{rule.key}</Text>
                    )}
                    {!!rule.value && (
                      <Text style={styles.ruleValue}>{rule.value}</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.ruleRow}>
                <View style={styles.ruleNumber}>
                  <Text style={styles.ruleNumberText}>1</Text>
                </View>
                <View style={styles.ruleCopy}>
                  <Text style={styles.ruleLabel}>Booking condition</Text>
                  <Text style={styles.ruleValue}>
                    Please make sure your licence and booking details match the
                    selected vehicle.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>I understand</Text>
            <Ionicons name="arrow-forward" size={17} color="#0f172a" />
          </Pressable>
        </GlassView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.58)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  card: {
    width: "100%",
    maxHeight: "78%",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(15,23,42,0.92)" : "rgba(15,23,42,0.66)",
    padding: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  closeButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  kicker: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "rgba(248,250,252,0.68)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 14,
  },
  scroll: {
    maxHeight: 330,
  },
  scrollContent: {
    paddingBottom: 8,
    gap: 10,
  },
  licenseRow: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 18,
    padding: 13,
    backgroundColor: "rgba(254,154,0,0.11)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.22)",
  },
  licenseIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.14)",
  },
  licenseCopy: {
    flex: 1,
    minWidth: 0,
  },
  ruleRow: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 18,
    padding: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  ruleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  ruleNumberText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
  },
  ruleCopy: {
    flex: 1,
    minWidth: 0,
  },
  ruleLabel: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 3,
  },
  ruleValue: {
    color: "rgba(248,250,252,0.72)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    marginTop: 16,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  primaryButtonText: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
  },
});

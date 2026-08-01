import { TERMS_AND_CONDITIONS, TERMS_META } from "@/constants/termsAndConditions";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
const DARK = "#0f172a";

type TermsConditionsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function TermsConditionsModal({
  visible,
  onClose,
}: TermsConditionsModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <GlassView intensity={92} tint="dark" style={styles.card}>
          {Platform.OS === "android" && (
            <LinearGradient
              colors={[
                "rgba(2,6,23,0.96)",
                "rgba(15,23,42,0.94)",
                "rgba(2,6,23,0.96)",
              ]}
              style={StyleSheet.absoluteFill}
            />
          )}

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="document-text-outline" size={22} color={ACCENT} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Success Van Hire</Text>
              <Text style={styles.title}>Terms & Conditions</Text>
              <Text style={styles.meta}>
                Updated {TERMS_META.lastUpdated} • Version{" "}
                {TERMS_META.documentVersion}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#e5e7eb" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.notice}>
              <Ionicons name="information-circle" size={17} color={ACCENT} />
              <Text style={styles.noticeText}>
                Please read these terms before confirming your reservation.
              </Text>
            </View>

            {TERMS_AND_CONDITIONS.map((section) => (
              <View key={section.section} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionNumber}>{section.section}</Text>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>

                <View style={styles.items}>
                  {section.items.map((item) => (
                    <View key={item} style={styles.itemRow}>
                      <View style={styles.bullet} />
                      <Text style={styles.itemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.thankYouCard}>
              <Text style={styles.thankYouTitle}>Thank You</Text>
              <Text style={styles.thankYouText}>{TERMS_META.closing}</Text>
            </View>

            <View style={styles.contactCard}>
              <View style={styles.contactIcon}>
                <Ionicons name="call-outline" size={18} color={DARK} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>Questions?</Text>
                <Text style={styles.contactText}>
                  Need clarification about these terms? Call{" "}
                  {TERMS_META.phone}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.footerButton}>
              <Text style={styles.footerButtonText}>I understand</Text>
              <Ionicons name="checkmark-circle" size={18} color={DARK} />
            </Pressable>
          </View>
        </GlassView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 24,
    backgroundColor: "rgba(2,6,23,0.72)",
  },
  card: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "88%",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(2,6,23,0.96)" : "rgba(2,6,23,0.78)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.12)",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 1,
  },
  meta: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  content: {
    padding: 14,
    paddingBottom: 16,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "rgba(254,154,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.18)",
  },
  noticeText: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  sectionCard: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
  },
  sectionNumber: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  sectionTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  items: {
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: ACCENT,
  },
  itemText: {
    flex: 1,
    color: "rgba(248,250,252,0.86)",
    fontSize: 12.5,
    fontWeight: "600",
    lineHeight: 18,
  },
  thankYouCard: {
    borderRadius: 18,
    padding: 12,
    marginTop: 2,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.18)",
  },
  thankYouTitle: {
    color: "#86efac",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 5,
  },
  thankYouText: {
    color: "rgba(248,250,252,0.88)",
    fontSize: 12.5,
    fontWeight: "700",
    lineHeight: 18,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    padding: 12,
    marginTop: 10,
    backgroundColor: "rgba(254,154,0,0.12)",
  },
  contactIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },
  contactLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  contactText: {
    color: "rgba(248,250,252,0.82)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 1,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  footerButton: {
    minHeight: 48,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: ACCENT,
  },
  footerButtonText: {
    color: DARK,
    fontSize: 14,
    fontWeight: "900",
  },
});

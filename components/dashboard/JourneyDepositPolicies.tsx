import { useToast } from "@/components/global/AppToast";
import { DEPOSIT_POLICY_PDF_URL } from "@/utils/rentalFeePolicy";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  depositAccepted: boolean;
  onDepositAccepted: (accepted: boolean) => void;
  cancellationAccepted: boolean;
  onCancellationAccepted: (accepted: boolean) => void;
  cancellationProtected: boolean;
  showCancellation: boolean;
  mode: "deposit" | "cancellation";
  disabled?: boolean;
};

function Check({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={styles.check}
    >
      <Ionicons
        name={checked ? "checkbox" : "square-outline"}
        size={23}
        color={checked ? "#34d399" : "#cbd5e1"}
      />
      <Text style={styles.checkText}>{label}</Text>
    </Pressable>
  );
}

export default function JourneyDepositPolicies(props: Props) {
  const { showToast } = useToast();
  const openPolicy = async () => {
    try {
      await Linking.openURL(DEPOSIT_POLICY_PDF_URL);
    } catch {
      showToast({
        type: "error",
        title: "Could not open policy",
        message: "Please try again or contact the office.",
      });
    }
  };
  return (
    <View style={styles.stack}>
      {props.mode === "deposit" && <View style={styles.panel}>
        <View style={styles.heading}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#fb7185" />
          <Text style={styles.title}>Security deposit policy</Text>
        </View>
        <Text style={styles.copy}>
          Separate from your rental fee: £250 for standard panel vans and £350
          for Luton, Tipper, Refrigerator and minibuses.
        </Text>
        <Text style={styles.copy}>
          The security deposit is refundable after the return inspection and
          returned after 28 days.
        </Text>
        <Pressable
          accessibilityRole="link"
          onPress={openPolicy}
          style={styles.pdf}
        >
          <Ionicons name="document-text-outline" size={18} color="#ffb347" />
          <Text style={styles.pdfText}>View / download PDF terms</Text>
          <Ionicons name="open-outline" size={16} color="#ffb347" />
        </Pressable>
        <Check
          checked={props.depositAccepted}
          onChange={props.onDepositAccepted}
          disabled={props.disabled}
          label="I have read and understand the deposit policies before choosing a rental-fee payment option."
        />
      </View>}
      {props.mode === "cancellation" && props.showCancellation && (
        <View style={styles.panel}>
          <View style={styles.heading}>
            <Ionicons name="calendar-outline" size={20} color="#ffb347" />
            <Text style={styles.title}>Rental-fee cancellation policy</Text>
          </View>
          {props.cancellationProtected && (
            <Text style={styles.protected}>
              Cancellation Protection is selected. Cancellation deductions do
              not apply to this booking.
            </Text>
          )}
          <Text style={styles.ruleTitle}>More than 72 hours before pickup</Text>
          <Text style={styles.copy}>
            Your paid rental fee is returned in full.
          </Text>
          <Text style={styles.ruleTitle}>
            Between 24 and 72 hours before pickup
          </Text>
          <Text style={styles.copy}>
            Full rental fee: 75% deduction up to £200; 50% above £200 and below
            £500; 10% at £500 or more. Safe-secure rental fee: 100% deduction.
          </Text>
          <Text style={styles.ruleTitle}>Less than 24 hours before pickup</Text>
          <Text style={styles.copy}>
            The paid rental fee is deducted in full.
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={openPolicy}
            style={styles.pdf}
          >
            <Ionicons name="document-text-outline" size={18} color="#ffb347" />
            <Text style={styles.pdfText}>Download full policy (PDF)</Text>
            <Ionicons name="open-outline" size={16} color="#ffb347" />
          </Pressable>
          <Check
            checked={props.cancellationAccepted}
            onChange={props.onCancellationAccepted}
            disabled={props.disabled}
            label="I have read and accept the rental-fee cancellation policy."
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  panel: {
    gap: 9,
    padding: 14,
    backgroundColor: "#171a23",
    borderWidth: 1,
    borderColor: "#453039",
    borderRadius: 8,
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 9 },
  title: { color: "#f8fafc", fontSize: 15, fontWeight: "800", flex: 1 },
  copy: { color: "#cbd5e1", fontSize: 13, lineHeight: 20 },
  ruleTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  protected: { color: "#6ee7b7", fontSize: 13, lineHeight: 20 },
  pdf: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  pdfText: { color: "#ffb347", fontSize: 13, fontWeight: "700", flex: 1 },
  check: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
  },
  checkText: { color: "#f1f5f9", flex: 1, fontSize: 13, lineHeight: 20 },
});

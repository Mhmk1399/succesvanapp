import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Reservation } from "@/types/type";
import { formatMoney } from "@/utils/reservationJourney";
import { getReservationPriceBreakdown } from "@/utils/reservationPriceBreakdown";

export default function ReservationPriceBreakdown({ reservation }: { reservation: Reservation }) {
  const price = getReservationPriceBreakdown(reservation);
  const showAmount = (value: number | null) =>
    price.perInvoice ? "Per Invoice" : price.manualPrice || value === null ? "-" : formatMoney(value);
  const duration = price.duration
    ? ` (${price.duration.actualDays}d ${price.duration.actualExtraHours}h)`
    : "";
  const line = (label: string, value: string, key = label) => (
    <View key={key} style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  return (
    <View>
      {line(`${price.rentalLabel}${duration}`, showAmount(price.rental))}
      {price.addOns.map((item, index) => line(item.label, showAmount(item.amount), `addon-${index}`))}
      {price.pickupExtension > 0 && line("Pickup extension", showAmount(price.pickupExtension))}
      {price.returnExtension > 0 && line("Return extension", showAmount(price.returnExtension))}
      {line("Service charge", showAmount(price.serviceCharge))}
      {price.adminDiscount > 0 && line("Admin discount", `-${showAmount(price.adminDiscount)}`)}
      {price.fullPaymentDiscount > 0 && line("Full-payment discount", `-${showAmount(price.fullPaymentDiscount)}`)}
      {price.addOnPricesEstimated && <Text style={styles.caption}>Add-on prices are based on current rates.</Text>}
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{price.perInvoice ? "Per Invoice" : formatMoney(price.total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 },
  label: { flex: 1, fontSize: 12, color: "#d1d5db", fontWeight: "500" },
  value: { fontSize: 14, color: "#f9fafb", fontWeight: "700" },
  caption: { fontSize: 10, lineHeight: 14, color: "#94a3b8", marginTop: 2 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 8 },
  totalLabel: { fontSize: 13, color: "#f9fafb", fontWeight: "600" },
  totalValue: { fontSize: 20, color: "#22c55e", fontWeight: "900", flexShrink: 1 },
});

import { customerJourneyService } from "@/services/customerJourneyService";
import { useImageViewer } from "@/components/global/ImageViewer";
import { uploadToS3 } from "@/utils/s3Upload";
import type { CancellationCalculation, Reservation } from "@/types/type";
import { formatDateTimeInLondon } from "@/utils/londonTime";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = { reservation: Reservation; onUpdated: () => Promise<void> };
type Preview = Awaited<
  ReturnType<typeof customerJourneyService.getCancellationPreview>
>;
const money = (value?: number) => `£${Number(value || 0).toFixed(2)}`;

function CancellationSummary({ calculation, acceptedAt }: { calculation: CancellationCalculation; acceptedAt?: string }) {
  const windowLabel = calculation.window === "over_72_hours" ? "More than 72 hours before pickup" : calculation.window === "between_24_and_72_hours" ? "Between 24 and 72 hours before pickup" : calculation.window === "under_24_hours" ? "Less than 24 hours before pickup" : "Cancellation calculation";
  return <View style={styles.summary}>
    <Text style={styles.label}>{windowLabel}</Text>
    {calculation.paymentOption ? <Text style={styles.copy}>{calculation.paymentOption === "full" ? "Full rental fee" : "Safe-secure rental fee"}</Text> : null}
    <Text style={styles.copy}>Paid: {money(calculation.paidAmount)}</Text>
    <Text style={styles.copy}>Deduction ({Number(calculation.agreedDeductionPercent || 0)}%): {money(calculation.deductionAmount)}</Text>
    <Text style={styles.copy}>Refund: {money(calculation.refundAmount)}</Text>
    {calculation.cancellationProtected ? <Text style={styles.success}>Cancellation protection applied. No rental-fee deduction.</Text> : null}
    {acceptedAt ? <Text style={styles.copy}>Accepted on {formatDateTimeInLondon(acceptedAt)}</Text> : null}
  </View>;
}

export default function JourneyCustomerActions({
  reservation,
  onUpdated,
}: Props) {
  const { openDocument, openImage } = useImageViewer();
  const [section, setSection] = useState<"cancel" | "issue" | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [attachment, setAttachment] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const id = reservation._id;
  const request = reservation.cancellationRequest;
  const settlement = reservation.status === "canceled" ? reservation.cancellationSettlement : undefined;
  const canRequest =
    [
      "confirmed",
      "deposit_pending",
      "deposit_paid",
      "contract_pending",
      "contract_signed",
    ].includes(reservation.status) &&
    !["pending", "approved", "rejected"].includes(request?.status || "");
  const canReport =
    Boolean(reservation.handover?.completedAt) &&
    !reservation.inspection?.receivedAt &&
    ["delivered", "rental_active"].includes(reservation.status);
  const reports = reservation.vehicleIssueNotes || [];

  const openCancellation = async () => {
    if (section === "cancel") {
      setSection(null);
      return;
    }
    setSection("cancel");
    setError("");
    setSuccess("");
    setPreview(null);
    setAccepted(false);
    if (!id || !canRequest) return;
    setBusy(true);
    try {
      setPreview(await customerJourneyService.getCancellationPreview(id));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load cancellation details.",
      );
    } finally {
      setBusy(false);
    }
  };

  const pickAttachment = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const item = result.assets[0];
      setAttachment({
        uri: item.uri,
        fileName: item.name,
        mimeType: item.mimeType,
        fileSize: item.size,
        type: "image",
        width: 0,
        height: 0,
      });
    }
  };

  const submitCancellation = async () => {
    if (
      !id ||
      !preview?.eligible ||
      reason.trim().length < 5 ||
      (preview.calculation && !accepted)
    )
      return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const attachmentUrl = attachment
        ? await uploadToS3(attachment, "cancellation-request")
        : undefined;
      await customerJourneyService.requestCancellation(id, {
        reason: reason.trim(),
        cancellationPolicyAccepted: Boolean(preview.calculation && accepted),
        attachmentUrl,
        attachmentName: attachment?.fileName || undefined,
        attachmentContentType: attachment?.mimeType || undefined,
      });
      setReason("");
      setAttachment(null);
      setPreview(null);
      setSuccess("Cancellation request sent for review.");
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send request.");
    } finally {
      setBusy(false);
    }
  };

  const submitIssue = async () => {
    if (!id || !photo || !note.trim()) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const imageUrl = await uploadToS3(photo, "vehicle-issue");
      await customerJourneyService.submitVehicleIssue(
        id,
        note.trim(),
        imageUrl,
      );
      setPhoto(null);
      setNote("");
      setSuccess("Report sent for review.");
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send report.");
    } finally {
      setBusy(false);
    }
  };

  if (!canRequest && !request?.status && !settlement && !canReport && reports.length === 0)
    return null;
  return (
    <View style={styles.group}>
      {(canRequest || request?.status || settlement) && (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: section === "cancel" }}
            onPress={openCancellation}
            style={styles.header}
          >
            <Ionicons name="calendar-outline" size={19} color="#ffb347" />
            <Text style={styles.title}>Cancellation request</Text>
            <Ionicons
              name={section === "cancel" ? "chevron-up" : "chevron-down"}
              size={19}
              color="#b9c5d4"
            />
          </Pressable>
          {section === "cancel" && (
            <View style={styles.body}>
              {request?.status ? (
                <>
                  <Text style={styles.label}>Status: {request.status}</Text>
                  <Text style={styles.copy}>{request.reason}</Text>
                  {request.reviewNote ? (
                    <Text style={styles.copy}>{request.reviewNote}</Text>
                  ) : null}
                </>
              ) : null}
              {request?.status === "pending" ? <Text style={styles.copy}>Your booking is still active while the office reviews this request.</Text> : null}
              {request?.calculation && <CancellationSummary calculation={request.calculation} acceptedAt={request.policyAcceptedAt} />}
              {settlement && <><Text style={styles.label}>Final cancellation settlement</Text><CancellationSummary calculation={settlement} /></>}
              {request?.attachment?.url && <Pressable accessibilityRole="button" onPress={() => openDocument({ uri: request.attachment!.url!, title: "Your cancellation attachment", mimeType: request.attachment?.contentType })}><Text style={styles.secondaryText}>View your attachment</Text></Pressable>}
              {request?.reviewAttachment?.url && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openDocument({ uri: request.reviewAttachment!.url!, title: "Office attachment", mimeType: request.reviewAttachment?.contentType })}
                >
                  <Text style={styles.secondaryText}>
                    View office attachment
                  </Text>
                </Pressable>
              )}
              {busy && !preview ? <ActivityIndicator color="#fe9a00" /> : null}
              {preview && !preview.eligible ? (
                <Text style={styles.copy}>
                  This booking is no longer eligible for a cancellation request.
                  Please contact the office.
                </Text>
              ) : null}
              {preview?.eligible && (
                <>
                  {preview.calculation ? (
                    <View>
                      <CancellationSummary calculation={preview.calculation} />
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: accepted }}
                        onPress={() => setAccepted(!accepted)}
                        style={styles.check}
                      >
                        <Ionicons
                          name={accepted ? "checkbox" : "square-outline"}
                          size={22}
                          color="#fe9a00"
                        />
                        <Text style={styles.copy}>
                          I have reviewed and accept this calculation.
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                  <Text style={styles.label}>Reason</Text>
                  <TextInput
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    maxLength={1000}
                    placeholder="Tell us why you need to cancel"
                    placeholderTextColor="#8090a2"
                    style={styles.input}
                  />
                  <Pressable onPress={pickAttachment} style={styles.secondary}>
                    <Ionicons name="attach" size={18} color="#ffb347" />
                    <Text style={styles.secondaryText}>
                      {attachment?.fileName || "Add image or PDF (optional)"}
                    </Text>
                  </Pressable>
                  {attachment && (
                    <><Pressable accessibilityRole="button" onPress={() => openDocument({ uri: attachment.uri, title: "Cancellation attachment", mimeType: attachment.mimeType })}><Text style={styles.secondaryText}>View attachment</Text></Pressable><Pressable onPress={() => setAttachment(null)}>
                      <Text style={styles.copy}>Remove attachment</Text>
                    </Pressable></>
                  )}
                  <Pressable
                    disabled={
                      busy ||
                      reason.trim().length < 5 ||
                      Boolean(preview.calculation && !accepted)
                    }
                    onPress={submitCancellation}
                    style={[
                      styles.button,
                      (busy ||
                        reason.trim().length < 5 ||
                        Boolean(preview.calculation && !accepted)) &&
                        styles.disabled,
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {busy ? "Sending..." : "Send request"}
                    </Text>
                  </Pressable>
                </>
              )}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {success ? <Text style={styles.success}>{success}</Text> : null}
            </View>
          )}
        </>
      )}
      {(canReport || reports.length > 0) && (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: section === "issue" }}
            onPress={() => {
              setSection(section === "issue" ? null : "issue");
              setError("");
              setSuccess("");
            }}
            style={styles.header}
          >
            <Ionicons name="warning-outline" size={19} color="#ffb347" />
            <Text style={styles.title}>Vehicle reports</Text>
            <Ionicons
              name={section === "issue" ? "chevron-up" : "chevron-down"}
              size={19}
              color="#b9c5d4"
            />
          </Pressable>
          {section === "issue" && (
            <View style={styles.body}>
              {reports.map((report, index) => (
                <View key={report._id || index} style={styles.report}>
                  <Pressable accessibilityRole="button" accessibilityLabel="View vehicle report photo" onPress={() => openImage({ uri: report.imageUrl, title: "Vehicle report" })}><Image
                    source={{ uri: report.imageUrl }}
                    style={styles.photo}
                    contentFit="cover"
                  /></Pressable>
                  <View style={styles.reportCopy}>
                    <Text style={styles.label}>{report.status}</Text>
                    <Text style={styles.copy}>{report.note}</Text>
                    {report.reviewReason ? (
                      <Text style={styles.copy}>{report.reviewReason}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
              {canReport && (
                <>
                  <Text style={styles.label}>Report a problem</Text>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    multiline
                    maxLength={1000}
                    placeholder="Describe the problem"
                    placeholderTextColor="#8090a2"
                    style={styles.input}
                  />
                  <Pressable
                    onPress={async () => {
                      const picked = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ["images"],
                        quality: 0.8,
                      });
                      if (!picked.canceled && picked.assets[0])
                        setPhoto(picked.assets[0]);
                    }}
                    style={styles.secondary}
                  >
                    <Ionicons name="camera-outline" size={18} color="#ffb347" />
                    <Text style={styles.secondaryText}>
                      {photo ? "Change photo" : "Choose photo"}
                    </Text>
                  </Pressable>
                  {photo && (
                    <Pressable accessibilityRole="button" accessibilityLabel="View selected report photo" onPress={() => openImage({ uri: photo.uri, title: "Selected report photo" })}><Image
                      source={{ uri: photo.uri }}
                      style={styles.photo}
                      contentFit="cover"
                    /></Pressable>
                  )}
                  <Pressable
                    disabled={busy || !photo || !note.trim()}
                    onPress={submitIssue}
                    style={[
                      styles.button,
                      (busy || !photo || !note.trim()) && styles.disabled,
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {busy ? "Sending..." : "Send report"}
                    </Text>
                  </Pressable>
                </>
              )}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {success ? <Text style={styles.success}>{success}</Text> : null}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8, marginTop: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 15,
    backgroundColor: "#182538",
    borderRadius: 8,
  },
  title: { flex: 1, color: "#f8fafc", fontWeight: "700", fontSize: 14 },
  body: { padding: 14, gap: 10, backgroundColor: "#111e30", borderRadius: 8 },
  label: { color: "#f8fafc", fontWeight: "700", fontSize: 13 },
  copy: { color: "#c3ceda", fontSize: 13, flexShrink: 1 },
  summary: {
    gap: 7,
    borderLeftWidth: 2,
    borderLeftColor: "#fe9a00",
    paddingLeft: 12,
  },
  check: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#43536a",
    borderRadius: 8,
    padding: 10,
    color: "white",
    textAlignVertical: "top",
  },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 8,
  },
  secondaryText: { color: "#ffb347", flexShrink: 1 },
  button: {
    backgroundColor: "#fe9a00",
    borderRadius: 8,
    padding: 13,
    alignItems: "center",
  },
  buttonText: { color: "#101820", fontWeight: "700" },
  disabled: { opacity: 0.45 },
  error: { color: "#fb7185" },
  success: { color: "#54d3a0" },
  report: { flexDirection: "row", gap: 10, paddingVertical: 5 },
  reportCopy: { flex: 1, gap: 4 },
  photo: { width: 72, height: 72, borderRadius: 6 },
});

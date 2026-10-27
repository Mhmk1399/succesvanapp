import { customerJourneyService } from "@/services/customerJourneyService";
import type { ContractDocumentKind, SafeContractSummary } from "@/types/contract";
import { useToast } from "@/components/global/AppToast";
import { formatDateInLondon } from "@/utils/londonTime";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ACCENT = "#fe9a00";
WebBrowser.maybeCompleteAuthSession();

const statusLabels: Record<string, string> = {
  draft: "Draft",
  generating: "Being prepared",
  ready: "Ready",
  sent: "Awaiting signature",
  delivered: "Delivered",
  viewed: "Viewed",
  signing: "Signing",
  completed: "Signed",
  declined: "Declined",
  voided: "Voided",
  expired: "Expired",
  error: "Issue",
};

const signableStatuses = ["ready", "sent", "delivered", "viewed", "signing"];

function formatDate(value?: string) {
  return formatDateInLondon(value);
}

export default function ContractsContent({
  ListHeaderComponent,
  onScroll,
}: {
  ListHeaderComponent?: React.ReactElement | null;
  onScroll?: (event: any) => void;
}) {
  const { showToast } = useToast();
  const [contracts, setContracts] = useState<SafeContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState<{
    contractId: string;
    kind: ContractDocumentKind;
  } | null>(null);

  const fetchContracts = useCallback(async () => {
    try {
      const data = await customerJourneyService.getContracts();
      setContracts(data);
    } catch (error) {
      showToast({
        type: "error",
        title: "Agreements unavailable",
        message:
          error instanceof Error ? error.message : "Could not load agreements",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchContracts();
  }, [fetchContracts]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchContracts();
    setRefreshing(false);
  };

  const refreshAfterSigning = useCallback(
    async (contractId: string) => {
      setCheckingId(contractId);
      const delays = [0, 1500, 3500, 7000, 11000];
      try {
        for (const delay of delays) {
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          const updated = await customerJourneyService.refreshContract(contractId);
          setContracts((prev) =>
            prev.map((item) => (item._id === updated._id ? updated : item)),
          );

          if (updated.status === "completed") {
            showToast({
              type: "success",
              title: "Agreement signed",
              message: "Your agreement is now marked as signed.",
            });
            return;
          }
        }

        showToast({
          type: "info",
          title: "Checking signature",
          message:
            "DocuSign may take a moment to confirm. Refresh agreements again shortly.",
          duration: 4200,
        });
      } catch (error) {
        showToast({
          type: "error",
          title: "Status check failed",
          message:
            error instanceof Error ? error.message : "Could not refresh status",
        });
      } finally {
        setCheckingId(null);
      }
    },
    [showToast],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && checkingId) {
        void refreshAfterSigning(checkingId);
      }
    });
    return () => subscription.remove();
  }, [checkingId, refreshAfterSigning]);

  const sign = async (contract: SafeContractSummary) => {
    setBusyId(contract._id);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const returnUrl = Linking.createURL("dashboard");
      const url = await customerJourneyService.startSigning(
        contract._id,
        returnUrl,
      );
      showToast({
        type: "info",
        title: "DocuSign opened",
        message:
          "After signing, DocuSign should return you here and we'll update the agreement automatically.",
        duration: 4600,
      });
      const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);
      if (result.type === "success" || result.type === "dismiss") {
        await refreshAfterSigning(contract._id);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "DocuSign unavailable",
        message: error instanceof Error ? error.message : "Could not start signing",
      });
    } finally {
      setBusyId(null);
    }
  };

  const refreshStatus = async (contract: SafeContractSummary) => {
    setBusyId(contract._id);
    try {
      const updated = await customerJourneyService.refreshContract(contract._id);
      setContracts((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item)),
      );
    } catch (error) {
      showToast({
        type: "error",
        title: "Status check failed",
        message:
          error instanceof Error ? error.message : "Could not refresh status",
      });
    } finally {
      setBusyId(null);
    }
  };

  const downloadDocument = async (
    contract: SafeContractSummary,
    kind: ContractDocumentKind,
  ) => {
    setDownloadBusy({ contractId: contract._id, kind });
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await customerJourneyService.downloadContractDocument(contract, kind);
      showToast({
        type: "success",
        title: "Agreement downloaded",
        message:
          kind === "source"
            ? "The unsigned agreement is ready."
            : kind === "certificate"
              ? "The completion certificate is ready."
              : "The signed agreement is ready.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Download failed",
        message:
          error instanceof Error
            ? error.message
            : "Could not download this agreement.",
      });
    } finally {
      setDownloadBusy(null);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={ACCENT}
          colors={[ACCENT]}
        />
      }
    >
      {ListHeaderComponent}
      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color={ACCENT} />
          <Text style={styles.emptyTitle}>Loading agreements</Text>
          <Text style={styles.emptySubtitle}>
            Checking your rental documents...
          </Text>
        </View>
      ) : contracts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-text-outline" size={31} color={ACCENT} />
          </View>
          <Text style={styles.emptyTitle}>No agreements yet</Text>
          <Text style={styles.emptySubtitle}>
            When a rental agreement is prepared, it will appear here for review
            and DocuSign.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {contracts.map((contract) => {
            const completed = contract.status === "completed";
            const signable = signableStatuses.includes(contract.status);
            const busy = busyId === contract._id;
            const checking = checkingId === contract._id;
            const isDownloading = (kind: ContractDocumentKind) =>
              downloadBusy?.contractId === contract._id &&
              downloadBusy.kind === kind;
            return (
              <View key={contract._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.docIcon, completed && styles.docIconDone]}>
                    <Ionicons
                      name={completed ? "checkmark-circle" : "document-text-outline"}
                      size={20}
                      color={completed ? "#34d399" : ACCENT}
                    />
                  </View>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.contractNumber} numberOfLines={1}>
                      {contract.contractNumber}
                    </Text>
                    <Text style={styles.contractMeta} numberOfLines={2}>
                      {contract.vehicleLabel || "Rental agreement"}
                      {contract.bookingReference
                        ? ` · Booking ${contract.bookingReference}`
                        : ""}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      completed
                        ? styles.badgeDone
                        : ["declined", "voided", "expired", "error"].includes(
                              contract.status,
                            )
                          ? styles.badgeBad
                          : styles.badgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        completed
                          ? styles.badgeDoneText
                          : ["declined", "voided", "expired", "error"].includes(
                                contract.status,
                              )
                            ? styles.badgeBadText
                            : styles.badgePendingText,
                      ]}
                    >
                      {statusLabels[contract.status] || contract.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.dateText}>
                  {contract.docusign?.completedAt
                    ? `Signed ${formatDate(contract.docusign.completedAt)}`
                    : contract.docusign?.sentAt
                      ? `Sent ${formatDate(contract.docusign.sentAt)}`
                      : `Created ${formatDate(contract.createdAt)}`}
                </Text>

                <View style={styles.actions}>
                  {signable && (
                    <Pressable
                      disabled={busy || checking}
                      onPress={() => sign(contract)}
                      style={[
                        styles.primaryAction,
                        (busy || checking) && styles.disabled,
                      ]}
                    >
                      {busy || checking ? (
                        <ActivityIndicator size="small" color="#111827" />
                      ) : (
                        <>
                          <Ionicons name="create-outline" size={15} color="#111827" />
                          <Text style={styles.primaryActionText}>
                            Open DocuSign & return
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )}
                  {contract.docusign?.envelopeId && !completed && (
                    <Pressable
                      disabled={busy}
                      onPress={() => refreshStatus(contract)}
                      style={[styles.secondaryAction, busy && styles.disabled]}
                    >
                      <Ionicons name="refresh-outline" size={15} color="#f8fafc" />
                      <Text style={styles.secondaryActionText}>Check status</Text>
                    </Pressable>
                  )}
                  {checking && (
                    <View style={styles.readyNote}>
                      <Ionicons name="sync-outline" size={14} color={ACCENT} />
                      <Text style={[styles.readyNoteText, { color: ACCENT }]}>
                        Checking DocuSign status...
                      </Text>
                    </View>
                  )}
                  {contract.files.source && (
                    <Pressable
                      disabled={isDownloading("source")}
                      onPress={() => downloadDocument(contract, "source")}
                      style={[
                        styles.secondaryAction,
                        isDownloading("source") && styles.disabled,
                      ]}
                    >
                      {isDownloading("source") ? (
                        <ActivityIndicator size="small" color={ACCENT} />
                      ) : (
                        <Ionicons name="document-outline" size={15} color={ACCENT} />
                      )}
                      <Text style={[styles.secondaryActionText, { color: ACCENT }]}>
                        Unsigned
                      </Text>
                    </Pressable>
                  )}
                  {completed && contract.files.signed && (
                    <Pressable
                      disabled={isDownloading("signed")}
                      onPress={() => downloadDocument(contract, "signed")}
                      style={[
                        styles.signedAction,
                        isDownloading("signed") && styles.disabled,
                      ]}
                    >
                      {isDownloading("signed") ? (
                        <ActivityIndicator size="small" color="#34d399" />
                      ) : (
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={15}
                          color="#34d399"
                        />
                      )}
                      <Text style={styles.signedActionText}>Signed</Text>
                    </Pressable>
                  )}
                  {completed && contract.files.certificate && (
                    <Pressable
                      disabled={isDownloading("certificate")}
                      onPress={() => downloadDocument(contract, "certificate")}
                      style={[
                        styles.secondaryAction,
                        isDownloading("certificate") && styles.disabled,
                      ]}
                    >
                      {isDownloading("certificate") ? (
                        <ActivityIndicator size="small" color="#f8fafc" />
                      ) : (
                        <Ionicons name="ribbon-outline" size={15} color="#f8fafc" />
                      )}
                      <Text style={styles.secondaryActionText}>Certificate</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 132 },
  list: { gap: 10 },
  card: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(12,20,35,0.96)",
    borderWidth: 1,
    borderColor: "rgba(111,142,180,0.13)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.11)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.18)",
  },
  docIconDone: {
    backgroundColor: "rgba(52,211,153,0.11)",
    borderColor: "rgba(52,211,153,0.2)",
  },
  cardTitleWrap: { flex: 1, minWidth: 0 },
  contractNumber: { color: "#f8fafc", fontSize: 14, fontWeight: "900" },
  contractMeta: {
    color: "rgba(203,213,225,0.55)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 3,
  },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  badgeDone: { backgroundColor: "rgba(52,211,153,0.14)" },
  badgePending: { backgroundColor: "rgba(254,154,0,0.14)" },
  badgeBad: { backgroundColor: "rgba(251,113,133,0.14)" },
  badgeText: { fontSize: 9.5, fontWeight: "900" },
  badgeDoneText: { color: "#34d399" },
  badgePendingText: { color: ACCENT },
  badgeBadText: { color: "#fb7185" },
  dateText: {
    color: "rgba(203,213,225,0.48)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 10,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  primaryAction: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: ACCENT,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  primaryActionText: { color: "#111827", fontSize: 11.5, fontWeight: "900" },
  secondaryAction: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  secondaryActionText: { color: "#f8fafc", fontSize: 11.5, fontWeight: "800" },
  signedAction: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: "rgba(52,211,153,0.1)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.22)",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  signedActionText: {
    color: "#34d399",
    fontSize: 11.5,
    fontWeight: "900",
  },
  disabled: { opacity: 0.55 },
  readyNote: {
    minHeight: 38,
    borderRadius: 12,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(52,211,153,0.1)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.17)",
  },
  readyNoteText: { color: "#34d399", fontSize: 10.5, fontWeight: "800" },
  emptyState: {
    minHeight: 178,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(13,22,39,0.97)",
    borderWidth: 1,
    borderColor: "rgba(105,136,174,0.13)",
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    backgroundColor: "rgba(254,154,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.16)",
  },
  emptyTitle: {
    color: "#f0f2f7",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 10,
  },
  emptySubtitle: {
    color: "rgba(190,200,216,0.54)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 5,
  },
});

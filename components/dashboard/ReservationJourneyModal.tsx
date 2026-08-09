import { customerJourneyService } from "@/services/customerJourneyService";
import { DEPOSIT_OPTION_LABELS, statusTone } from "@/constants/reservationStatus";
import type { ContractDocumentKind, SafeContractSummary } from "@/types/contract";
import type { Reservation } from "@/types/type";
import type {
  JourneyStepState,
  ReservationJourneyViewModel,
} from "@/types/reservationJourney";
import {
  buildReservationJourney,
  formatDateTime,
  formatMoney,
  isReservationLicenceReady,
} from "@/utils/reservationJourney";
import {
  formatDateInLondon,
  getInclusiveLondonDeadline,
  getTrustedNowMs,
  syncServerClock,
} from "@/utils/londonTime";
import { useToast } from "@/components/global/AppToast";
import LicenseUploadModal from "@/components/dashboard/LicenseUploadModal";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { height } = Dimensions.get("window");
const ACCENT = "#fe9a00";
const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
WebBrowser.maybeCompleteAuthSession();

type SectionId =
  | "summary"
  | "documents"
  | "deposit"
  | "contract"
  | "collection"
  | "handover"
  | "inspection"
  | "refund"
  | "timeline";

const DEFAULT_SECTION: Partial<Record<string, SectionId>> = {
  confirmed: "deposit",
  deposit_pending: "deposit",
  contract_pending: "contract",
  ready_for_collection: "collection",
  handover_in_progress: "handover",
  delivered: "collection",
  vehicle_returned: "inspection",
  return_inspection: "inspection",
  deposit_review: "refund",
  refund_processing: "refund",
  refund_completed: "refund",
};

const sectionLabels: Record<SectionId, string> = {
  summary: "Booking summary",
  documents: "Documents",
  deposit: "Deposit",
  contract: "Contract",
  collection: "Collection & return",
  handover: "Vehicle handover",
  inspection: "Return inspection",
  refund: "Refund",
  timeline: "Activity",
};

const contractLabels: Record<string, string> = {
  not_created: "Not created",
  generating: "Being prepared",
  awaiting_customer_signature: "Awaiting signature",
  signed: "Signed",
  expired: "Expired",
};

const stepColors: Record<JourneyStepState, { fg: string; bg: string; border: string }> =
  {
    completed: {
      fg: "#34d399",
      bg: "rgba(52,211,153,0.15)",
      border: "rgba(52,211,153,0.42)",
    },
    current: {
      fg: ACCENT,
      bg: "rgba(254,154,0,0.15)",
      border: "rgba(254,154,0,0.45)",
    },
    blocked: {
      fg: ACCENT,
      bg: "rgba(254,154,0,0.18)",
      border: "rgba(254,154,0,0.58)",
    },
    failed: {
      fg: "#fb7185",
      bg: "rgba(251,113,133,0.15)",
      border: "rgba(251,113,133,0.45)",
    },
    upcoming: {
      fg: "#64748b",
      bg: "rgba(100,116,139,0.09)",
      border: "rgba(148,163,184,0.14)",
    },
  };

function normalizeSection(id?: string): SectionId {
  const cleaned = id?.replace("#", "");
  if (cleaned === "return") return "collection";
  return cleaned && cleaned in sectionLabels ? (cleaned as SectionId) : "summary";
}

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  reached: boolean;
};

const countdownUnits: Array<{
  key: keyof Omit<TimeRemaining, "reached">;
  label: string;
}> = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Secs" },
];

function calculateRemaining(deadline: Date): TimeRemaining {
  const difference = Math.max(0, deadline.getTime() - getTrustedNowMs());
  return {
    days: Math.floor(difference / DAY),
    hours: Math.floor((difference % DAY) / HOUR),
    minutes: Math.floor((difference % HOUR) / MINUTE),
    seconds: Math.floor((difference % MINUTE) / SECOND),
    reached: difference === 0,
  };
}

export default function ReservationJourneyModal({
  visible,
  reservation,
  initialSection,
  onClose,
  onUpdated,
}: {
  visible: boolean;
  reservation: Reservation | null;
  initialSection?: string;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const { showToast } = useToast();
  const [remoteReservation, setRemoteReservation] = useState<Reservation | null>(
    null,
  );
  const [contract, setContract] = useState<SafeContractSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openSection, setOpenSection] = useState<SectionId>("summary");
  const [progressOpen, setProgressOpen] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [checkingSignature, setCheckingSignature] = useState(false);
  const [documentBusy, setDocumentBusy] = useState<ContractDocumentKind | null>(
    null,
  );
  const [licenseModalVisible, setLicenseModalVisible] = useState(false);
  const [detailsY, setDetailsY] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const signingRefreshActive = useRef(false);

  const activeReservation = remoteReservation || reservation;
  const journey = useMemo(
    () =>
      activeReservation
        ? buildReservationJourney(activeReservation, contract)
        : null,
    [activeReservation, contract],
  );

  const fetchJourney = useCallback(async () => {
    if (!reservation?._id) return;
    setLoading(true);
    try {
      const data = await customerJourneyService.getReservationJourney(
        reservation._id,
      );
      setRemoteReservation(data.data.reservation);
      setContract(data.data.contract || null);
    } catch (error) {
      setRemoteReservation(reservation);
      console.log("[ReservationJourneyModal] using local reservation:", error);
    } finally {
      setLoading(false);
    }
  }, [reservation]);

  const refreshAfterSigning = useCallback(async () => {
    if (!reservation?._id) return;
    signingRefreshActive.current = true;
    setCheckingSignature(true);
    setOpenSection("contract");

    const delays = [0, 1500, 3500, 7000, 11000];
    try {
      for (const delay of delays) {
        if (!signingRefreshActive.current) break;
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const data = await customerJourneyService.getReservationJourney(
          reservation._id,
        );
        const nextReservation = data.data.reservation;
        const nextContract = data.data.contract || null;
        setRemoteReservation(nextReservation);
        setContract(nextContract);

        if (
          nextContract?.status === "completed" ||
          ["contract_signed", "ready_for_collection"].includes(
            String(nextReservation.status),
          )
        ) {
          showToast({
            type: "success",
            title: "Agreement signed",
            message: "Your booking has been updated in the app.",
          });
          onUpdated?.();
          return;
        }
      }

      showToast({
        type: "info",
        title: "Checking signature",
        message:
          "DocuSign may take a moment to confirm. Pull to refresh or check this agreement again shortly.",
        duration: 4200,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not refresh",
        message:
          error instanceof Error
            ? error.message
            : "Please refresh your booking in a moment.",
      });
    } finally {
      setCheckingSignature(false);
      signingRefreshActive.current = false;
    }
  }, [onUpdated, reservation?._id, showToast]);

  useEffect(() => {
    if (!visible) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && signingRefreshActive.current) {
        void refreshAfterSigning();
      }
    });
    return () => subscription.remove();
  }, [refreshAfterSigning, visible]);

  useEffect(() => {
    if (!visible || !reservation) return;
    setRemoteReservation(null);
    setContract(null);
    const startingSection =
      initialSection ||
      (!isReservationLicenceReady(reservation) ? "documents" : undefined) ||
      DEFAULT_SECTION[String(reservation.status)] ||
      "summary";
    setOpenSection(normalizeSection(startingSection));
    setProgressOpen(true);
    setTimelineOpen(true);
    void fetchJourney();
  }, [fetchJourney, initialSection, reservation, visible]);

  const scrollToDetails = useCallback(() => {
    setTimeout(() => {
      if (detailsY > 0) {
        scrollRef.current?.scrollTo({
          y: Math.max(0, detailsY - 12),
          animated: true,
        });
        return;
      }
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, [detailsY]);

  const openSectionAndScroll = useCallback(
    (section: SectionId) => {
      Haptics.selectionAsync();
      setOpenSection(section);
      scrollToDetails();
    },
    [scrollToDetails],
  );

  const openSectionFromAction = (href?: string) => {
    if (!href?.startsWith("#")) return;
    openSectionAndScroll(normalizeSection(href));
  };

  const handleSignContract = async () => {
    if (!contract?._id || !reservation?._id) return;
    setBusy(true);
    try {
      const returnUrl = Linking.createURL("dashboard", {
        queryParams: {
          contractSigned: "1",
          reservationId: reservation._id,
          contractId: contract._id,
        },
      });
      const url = await customerJourneyService.startSigning(
        contract._id,
        returnUrl,
      );
      if (!url) throw new Error("Signing URL was not returned");
      showToast({
        type: "info",
        title: "DocuSign opened",
        message:
          "After signing, DocuSign will return you here and we'll update this booking automatically.",
        duration: 4600,
      });
      const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);
      if (result.type === "success" || result.type === "dismiss") {
        await refreshAfterSigning();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "DocuSign unavailable",
        message: error instanceof Error ? error.message : "Could not open signing",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadContract = async (kind: ContractDocumentKind) => {
    if (!contract?._id) return;
    setDocumentBusy(kind);
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
      setDocumentBusy(null);
    }
  };

  if (!activeReservation || !journey) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <LinearGradient
            colors={["#111a2d", "#07101f"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerKicker}>TRACK BOOKING</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {journey.bookingReference}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={19} color="#f8fafc" />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={ACCENT} />
              <Text style={styles.loadingText}>Loading booking journey...</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <HeroCard journey={journey} onAction={openSectionFromAction} />
              <JourneyTracker
                journey={journey}
                open={progressOpen}
                onToggle={() => setProgressOpen((prev) => !prev)}
              />
              <CompactJourneyCards
                journey={journey}
                onOpen={openSectionAndScroll}
              />
              <SectionTabs
                openSection={openSection}
                onOpen={openSectionAndScroll}
              />
              <View
                onLayout={(event) => setDetailsY(event.nativeEvent.layout.y)}
              >
                <SectionContent
                  section={openSection}
                  reservation={activeReservation}
                  journey={journey}
                  contract={contract}
                  busy={busy}
                  documentBusy={documentBusy}
                  checkingSignature={checkingSignature}
                  onSignContract={handleSignContract}
                  onDownloadContract={handleDownloadContract}
                  onDepositUpdated={async () => {
                    await fetchJourney();
                    onUpdated?.();
                  }}
                  onUploadLicence={() => setLicenseModalVisible(true)}
                />
              </View>
              <VehicleRecordsAccordions
                reservation={activeReservation}
                activeSection={openSection}
              />
              <TimelineAccordion
                reservation={activeReservation}
                open={timelineOpen}
                onToggle={() => setTimelineOpen((prev) => !prev)}
              />
            </ScrollView>
          )}
          <LicenseUploadModal
            visible={licenseModalVisible}
            onClose={() => setLicenseModalVisible(false)}
            userId={activeReservation.user?._id || ""}
            onSuccess={async () => {
              setLicenseModalVisible(false);
              await fetchJourney();
              onUpdated?.();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function HeroCard({
  journey,
  onAction,
}: {
  journey: ReservationJourneyViewModel;
  onAction: (href?: string) => void;
}) {
  const tone = statusTone(journey.mainStatus);
  const highlighted =
    journey.nextAction.type !== "none" &&
    journey.nextAction.type !== "contact_support";

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroImageWrap}>
        {journey.vehicleImage ? (
          <Image source={{ uri: journey.vehicleImage }} style={styles.heroImage} />
        ) : (
          <Ionicons name="car-sport-outline" size={42} color="#526179" />
        )}
        <LinearGradient
          colors={["transparent", "rgba(5,9,20,0.72)"]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.heroBody}>
        <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: tone.fg }]} />
          <Text style={[styles.statusPillText, { color: tone.fg }]}>
            {journey.publicStatusLabel}
          </Text>
        </View>
        <Text style={styles.vehicleTitle}>{journey.vehicleName}</Text>
        <View style={styles.heroMetaRow}>
          <Meta icon="calendar-outline" label="Pickup" value={journey.pickupDateTime} />
          <Meta icon="return-down-back-outline" label="Return" value={journey.returnDateTime} />
        </View>
        <View style={[styles.nextAction, highlighted && styles.nextActionHot]}>
          <View style={styles.nextIcon}>
            <Ionicons name="flash-outline" size={15} color={highlighted ? "#101827" : ACCENT} />
          </View>
          <View style={styles.nextCopy}>
            <Text style={styles.nextKicker}>NEXT ACTION</Text>
            <Text style={styles.nextTitle}>{journey.nextAction.title}</Text>
            <Text style={styles.nextDescription}>
              {journey.nextAction.description}
            </Text>
          </View>
        </View>
        {journey.nextAction.buttonLabel && journey.nextAction.href?.startsWith("#") && (
          <Pressable
            onPress={() => onAction(journey.nextAction.href)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              !highlighted && styles.secondaryButton,
            ]}
          >
            <Text
              style={[
                styles.primaryButtonText,
                !highlighted && styles.secondaryButtonText,
              ]}
            >
              {journey.nextAction.buttonLabel}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={highlighted ? "#111827" : "#f8fafc"}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color={ACCENT} />
      <View style={styles.metaTextWrap}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function JourneyTracker({
  journey,
  open,
  onToggle,
}: {
  journey: ReservationJourneyViewModel;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.trackerCard}>
      <Pressable onPress={onToggle} style={styles.trackerHeader}>
        <Text style={[styles.sectionTitle, styles.trackerTitle]}>
          Booking progress
        </Text>
        <View style={styles.trackerToggle}>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={ACCENT}
          />
        </View>
      </Pressable>
      {open && (
        <View style={styles.trackerBody}>
          {journey.steps.map((step, index) => {
            const colors = stepColors[step.state];
            const completeLine = step.state === "completed";
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View
                    style={[
                      styles.stepCircle,
                      { backgroundColor: colors.bg, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons
                      name={
                        step.state === "completed"
                          ? "checkmark"
                          : step.state === "failed"
                            ? "close"
                            : step.state === "blocked"
                              ? "alert"
                              : "ellipse"
                      }
                      size={step.state === "upcoming" ? 7 : 14}
                      color={colors.fg}
                    />
                  </View>
                  {index < journey.steps.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        completeLine && { backgroundColor: "#34d399" },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.stepCopy}>
                  <Text style={[styles.stepLabel, { color: colors.fg }]}>
                    {step.label}
                  </Text>
                  <Text style={styles.stepState}>
                    {step.state === "completed"
                      ? "Done"
                      : step.state === "blocked" || step.state === "current"
                        ? "Pending"
                        : step.state === "failed"
                          ? "Issue"
                          : "Upcoming"}
                    {step.date ? ` · ${step.date}` : ""}
                  </Text>
                  {step.description ? (
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function CompactJourneyCards({
  journey,
  onOpen,
}: {
  journey: ReservationJourneyViewModel;
  onOpen: (section: SectionId) => void;
}) {
  return (
    <View style={styles.compactGrid}>
      <CompactCard
        icon="card-outline"
        title="Deposit"
        value={journey.deposit?.status?.replace(/_/g, " ") || "Not requested"}
        detail={formatMoney(journey.deposit?.amount)}
        onPress={() => onOpen("deposit")}
        hot={["confirmed", "deposit_pending"].includes(journey.mainStatus)}
      />
      <CompactCard
        icon="document-text-outline"
        title="Contract"
        value={
          journey.contract
            ? contractLabels[journey.contract.status]
            : "Not created"
        }
        detail={journey.contract?.contractNumber || "Agreement"}
        onPress={() => onOpen("contract")}
        hot={journey.contract?.status === "awaiting_customer_signature"}
      />
      <CompactCard
        icon="location-outline"
        title="Collection"
        value={journey.collection?.collectionCode || "Details"}
        detail={journey.pickupDateTime}
        onPress={() => onOpen("collection")}
        hot={journey.mainStatus === "ready_for_collection"}
      />
      <CompactCard
        icon="refresh-outline"
        title="Refund"
        value={journey.refund?.status?.replace(/_/g, " ") || "Not started"}
        detail={formatMoney(journey.refund?.refundAmount)}
        onPress={() => onOpen("refund")}
        hot={["deposit_review", "refund_processing"].includes(journey.mainStatus)}
      />
    </View>
  );
}

function CompactCard({
  icon,
  title,
  value,
  detail,
  hot,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  detail: string;
  hot?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactCard,
        hot && styles.compactCardHot,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={17} color={ACCENT} />
      <Text style={styles.compactTitle}>{title}</Text>
      <Text style={styles.compactValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.compactDetail} numberOfLines={1}>
        {detail}
      </Text>
    </Pressable>
  );
}

function SectionTabs({
  openSection,
  onOpen,
}: {
  openSection: SectionId;
  onOpen: (section: SectionId) => void;
}) {
  const entries = (Object.entries(sectionLabels) as Array<[SectionId, string]>)
    .filter(([id]) => id !== "timeline");
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.sectionTabs}
    >
      {entries.map(([id, label]) => (
        <Pressable
          key={id}
          onPress={() => onOpen(id)}
          style={[styles.sectionTab, openSection === id && styles.sectionTabActive]}
        >
          <Text
            style={[
              styles.sectionTabText,
              openSection === id && styles.sectionTabTextActive,
            ]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function TimelineAccordion({
  reservation,
  open,
  onToggle,
}: {
  reservation: Reservation;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.timelineCard}>
      <Pressable onPress={onToggle} style={styles.timelineHeader}>
        <View style={styles.timelineHeaderCopy}>
          <Text style={styles.timelineHeaderKicker}>Activity</Text>
          <Text style={styles.timelineHeaderTitle}>Booking timeline</Text>
        </View>
        <View style={styles.timelineToggle}>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={ACCENT}
          />
        </View>
      </Pressable>
      {open && (
        <View style={styles.timelineBody}>
          <TimelineSection reservation={reservation} />
        </View>
      )}
    </View>
  );
}

function SectionContent({
  section,
  reservation,
  journey,
  contract,
  busy,
  documentBusy,
  checkingSignature,
  onSignContract,
  onDownloadContract,
  onDepositUpdated,
  onUploadLicence,
}: {
  section: SectionId;
  reservation: Reservation;
  journey: ReservationJourneyViewModel;
  contract: SafeContractSummary | null;
  busy: boolean;
  documentBusy: ContractDocumentKind | null;
  checkingSignature: boolean;
  onSignContract: () => void;
  onDownloadContract: (kind: ContractDocumentKind) => void;
  onDepositUpdated: () => void;
  onUploadLicence: () => void;
}) {
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionTitle}>{sectionLabels[section]}</Text>
      {section === "summary" && <SummarySection reservation={reservation} />}
      {section === "documents" && (
        <DocumentsSection
          reservation={reservation}
          onUploadLicence={onUploadLicence}
        />
      )}
      {section === "deposit" && (
        <DepositSection reservation={reservation} onUpdated={onDepositUpdated} />
      )}
      {section === "contract" && (
        <ContractSection
          reservation={reservation}
          contract={contract}
          journey={journey}
          busy={busy}
          documentBusy={documentBusy}
          checkingSignature={checkingSignature}
          onSignContract={onSignContract}
          onDownloadContract={onDownloadContract}
        />
      )}
      {section === "collection" && (
        <CollectionSection reservation={reservation} journey={journey} />
      )}
      {section === "handover" && <HandoverSection reservation={reservation} />}
      {section === "inspection" && <InspectionSection reservation={reservation} />}
      {section === "refund" && <RefundSection reservation={reservation} journey={journey} />}
      {section === "timeline" && <TimelineSection reservation={reservation} />}
    </View>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "-"}</Text>
    </View>
  );
}

function SummarySection({ reservation }: { reservation: Reservation }) {
  const addOnsTotal = (reservation.addOns || []).reduce((sum, item) => {
    const addOn = item.addOn;
    const flat =
      typeof addOn?.flatPrice === "object"
        ? Number(addOn.flatPrice.amount || 0)
        : 0;
    return sum + flat * Math.max(1, Number(item.quantity) || 1);
  }, 0);

  return (
    <>
      <Row label="Office" value={reservation.office?.name} />
      <Row label="Vehicle" value={reservation.vehicle?.title || reservation.category?.name} />
      <Row label="Gear" value={reservation.selectedGear || "-"} />
      <Row label="Driver age" value={reservation.driverAge ? `${reservation.driverAge} years` : "-"} />
      <Row label="Pickup" value={formatDateTime(reservation.startDate)} />
      <Row label="Return" value={formatDateTime(reservation.endDate)} />
      <Row label="Add-ons" value={reservation.addOns?.length ? String(reservation.addOns.length) : "None"} />
      {addOnsTotal > 0 && <Row label="Add-ons total" value={formatMoney(addOnsTotal)} />}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Final total</Text>
        <Text style={styles.totalValue}>
          {reservation.perInvoice && !reservation.totalPrice
            ? "Per Invoice"
            : formatMoney(reservation.totalPrice)}
        </Text>
      </View>
      {reservation.messege ? <Row label="Notes" value={reservation.messege} /> : null}
    </>
  );
}

function DocumentsSection({
  reservation,
  onUploadLicence,
}: {
  reservation: Reservation;
  onUploadLicence: () => void;
}) {
  const front = reservation.user?.licenceAttached?.front;
  const back = reservation.user?.licenceAttached?.back;
  const details = reservation.user?.licenceDetails;
  const licenceReady = isReservationLicenceReady(reservation);
  return (
    <>
      <InfoBanner
        tone={licenceReady ? "success" : "warn"}
        title={licenceReady ? "Licence ready" : "Driving licence required"}
        text={
          licenceReady
            ? "Your licence photos and confirmed scanned details are saved."
            : "Upload both sides of your driving licence and confirm the scanned details before your agreement is prepared."
        }
      />
      <Pressable
        onPress={onUploadLicence}
        disabled={!reservation.user?._id}
        style={({ pressed }) => [
          styles.licenceUploadCta,
          pressed && styles.pressed,
          !reservation.user?._id && styles.disabledButton,
        ]}
      >
        <View style={styles.licenceUploadIcon}>
          <Ionicons
            name={licenceReady ? "refresh-outline" : "cloud-upload-outline"}
            size={18}
            color="#0f172a"
          />
        </View>
        <View style={styles.licenceUploadCopy}>
          <Text style={styles.licenceUploadTitle}>
            {licenceReady ? "Update licence" : "Upload and scan licence"}
          </Text>
          <Text style={styles.licenceUploadText}>
            Front side is scanned first, then you confirm the details.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#0f172a" />
      </Pressable>
      <DocumentRow title="Driving licence front" url={front} />
      <DocumentRow title="Driving licence back" url={back} />
      <LicenceDetailsCard details={details} />
      <DocumentRow title="Proof of address" helper="Bring to collection if requested" />
      <DocumentRow title="ID card / passport" helper="Bring to collection if requested" />
      <DocumentRow title="Payment card proof" helper="Bring to collection if requested" />
    </>
  );
}

function LicenceDetailsCard({
  details,
}: {
  details?: NonNullable<Reservation["user"]>["licenceDetails"];
}) {
  if (!details?.isFrontSide) return null;
  const rows = [
    ["Full name", details.fullName],
    ["Licence number", details.licenceNumber || details.licenseNumber],
    ["Date of birth", details.dateOfBirth],
    ["Expiry date", details.expiryDate || details.expirationDate],
    ["Postcode", details.postcode],
    ["Address", details.address],
  ].filter(([, value]) => Boolean(value));

  if (rows.length === 0) return null;

  return (
    <View style={styles.licenceDetailsCard}>
      <View style={styles.licenceDetailsHeader}>
        <View>
          <Text style={styles.licenceDetailsTitle}>Saved licence details</Text>
          <Text style={styles.licenceDetailsSub}>
            Confirmed details used on your rental agreement.
          </Text>
        </View>
        <View style={styles.licenceDetailsBadge}>
          <Ionicons name="checkmark-circle" size={13} color="#34d399" />
          <Text style={styles.licenceDetailsBadgeText}>Confirmed</Text>
        </View>
      </View>
      <View style={styles.licenceDetailsGrid}>
        {rows.map(([label, value]) => (
          <View key={String(label)} style={styles.licenceDetailItem}>
            <Text style={styles.licenceDetailLabel}>{label}</Text>
            <Text style={styles.licenceDetailValue}>{String(value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DocumentRow({
  title,
  url,
  helper,
}: {
  title: string;
  url?: string;
  helper?: string;
}) {
  return (
    <View style={styles.documentRow}>
      <View style={styles.documentIcon}>
        <Ionicons
          name={url ? "checkmark-circle" : "document-attach-outline"}
          size={17}
          color={url ? "#34d399" : ACCENT}
        />
      </View>
      <View style={styles.documentCopy}>
        <Text style={styles.documentTitle}>{title}</Text>
        <Text style={styles.documentSub}>{url ? "Uploaded" : helper || "Required"}</Text>
      </View>
    </View>
  );
}

function DepositSection({
  reservation,
  onUpdated,
}: {
  reservation: Reservation;
  onUpdated: () => void;
}) {
  const { showToast } = useToast();
  const deposit = reservation.deposit;
  const settled = ["paid", "held", "refunded", "partially_refunded", "refund_processing"].includes(
    String(deposit?.status),
  );
  const categoryDeposit = reservation.category?.deposit || reservation.category;
  const [selected, setSelected] = useState<"full" | "secure" | "office">(
    deposit?.option || "secure",
  );
  const [receipt, setReceipt] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canSubmitDeposit = selected === "office" || Boolean(receipt);

  const fullOriginal = deposit?.originalAmount ?? reservation.totalPrice ?? 0;
  const fullDiscount = Math.min(
    100,
    Math.max(
      0,
      Number(
        deposit?.discountPercent ?? categoryDeposit?.fullPayDiscountPercent,
      ) || 0,
    ),
  );
  const fullDiscountAmount =
    deposit?.discountAmount !== undefined
      ? Number(deposit.discountAmount) || 0
      : Math.round(fullOriginal * (fullDiscount / 100) * 100) / 100;
  const fullAmount = Math.max(0, fullOriginal - fullDiscountAmount);
  const options = [
    {
      key: "full" as const,
      label: DEPOSIT_OPTION_LABELS.full,
      amount: fullAmount,
      originalAmount: fullDiscount > 0 ? fullOriginal : undefined,
      discountPercent: fullDiscount,
      discountAmount: fullDiscountAmount,
      note:
        fullDiscount > 0
          ? "Pay the full deposit now by bank transfer."
          : "Pay the full booking total now by bank transfer.",
    },
    {
      key: "secure" as const,
      label: DEPOSIT_OPTION_LABELS.secure,
      amount: Number(categoryDeposit?.securePayPrice || 0),
      originalAmount: undefined,
      discountPercent: 0,
      discountAmount: 0,
      note: "Smaller non-refundable deposit option.",
    },
    {
      key: "office" as const,
      label: DEPOSIT_OPTION_LABELS.office,
      amount: Number(categoryDeposit?.officePayPrice || 0),
      originalAmount: undefined,
      discountPercent: 0,
      discountAmount: 0,
      note: "Pay the deposit when you collect the van.",
    },
  ];

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setReceipt(result.assets[0]);
      Haptics.selectionAsync();
    }
  };

  const submit = async () => {
    if (!canSubmitDeposit) {
      showToast({
        type: "error",
        title: "Receipt needed",
        message: "Please upload your payment receipt before submitting.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await customerJourneyService.submitDeposit(
        reservation._id || "",
        selected,
        receipt,
      );
      onUpdated();
    } catch (error) {
      showToast({
        type: "error",
        title: "Deposit update failed",
        message: error instanceof Error ? error.message : "Could not submit deposit",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (settled || deposit?.status === "pending" || deposit?.option === "office") {
    return (
      <>
        <InfoBanner
          tone={settled ? "success" : "warn"}
          text={
            settled
              ? "Deposit received."
              : deposit?.option === "office"
                ? "Pay-at-office selected. You'll pay before handover."
                : "We received your receipt and are verifying the payment."
          }
        />
        <Row
          label="Option"
          value={deposit?.option ? DEPOSIT_OPTION_LABELS[deposit.option] : "-"}
        />
        <Row label="Amount" value={formatMoney(deposit?.amount)} />
        <Row label="Status" value={String(deposit?.status || "not_paid").replace(/_/g, " ")} />
        {deposit?.paidAt ? <Row label="Paid on" value={formatDateTime(deposit.paidAt)} /> : null}
        {deposit?.receiptUrl ? <DocumentRow title="Payment receipt" url={deposit.receiptUrl} /> : null}
      </>
    );
  }

  return (
    <>
      {deposit?.status === "failed" ? (
        <InfoBanner
          tone="danger"
          title="Refused receipt"
          text={deposit.failureReason || "The uploaded receipt could not be verified."}
        />
      ) : null}
      {options.map((option) => (
        <Pressable
          key={option.key}
          onPress={() => setSelected(option.key)}
          style={[
            styles.depositOption,
            selected === option.key && styles.depositOptionSelected,
          ]}
        >
          <View style={styles.depositOptionTop}>
            <Text style={styles.depositOptionTitle}>{option.label}</Text>
            <View style={styles.depositAmountStack}>
              {option.originalAmount !== undefined && (
                <Text style={styles.depositOriginalAmount}>
                  {formatMoney(option.originalAmount)}
                </Text>
              )}
              <Text style={styles.depositOptionAmount}>
                {formatMoney(option.amount)}
              </Text>
            </View>
          </View>
          {option.discountPercent > 0 && option.discountAmount > 0 && (
            <View style={styles.depositDiscountBadge}>
              <Ionicons name="pricetag-outline" size={12} color="#34d399" />
              <Text style={styles.depositDiscountText}>
                Save {formatMoney(option.discountAmount)} ({option.discountPercent}%
                off)
              </Text>
            </View>
          )}
          <Text style={styles.depositOptionNote}>{option.note}</Text>
        </Pressable>
      ))}
      {selected !== "office" && (
        <>
          {receipt ? (
            <View style={styles.receiptPreviewCard}>
              <Image source={{ uri: receipt.uri }} style={styles.receiptPreviewImage} />
              <LinearGradient
                colors={["transparent", "rgba(2,6,23,0.8)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.receiptPreviewMeta}>
                <View style={styles.receiptPreviewCopy}>
                  <Text style={styles.receiptPreviewTitle}>Payment receipt</Text>
                  <Text style={styles.receiptPreviewText} numberOfLines={1}>
                    Ready to submit
                  </Text>
                </View>
                <Pressable onPress={pickReceipt} style={styles.receiptPreviewAction}>
                  <Ionicons name="refresh-outline" size={14} color="#f8fafc" />
                  <Text style={styles.receiptPreviewActionText}>Change</Text>
                </Pressable>
                <Pressable
                  onPress={() => setReceipt(null)}
                  style={styles.receiptRemoveAction}
                >
                  <Ionicons name="trash-outline" size={14} color="#fb7185" />
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={pickReceipt} style={styles.receiptButton}>
              <Ionicons name="cloud-upload-outline" size={17} color={ACCENT} />
              <Text style={styles.receiptButtonText}>
                Upload payment receipt
              </Text>
            </Pressable>
          )}
        </>
      )}
      <Pressable
        disabled={submitting || !canSubmitDeposit}
        onPress={submit}
        style={[
          styles.primaryButton,
          (submitting || !canSubmitDeposit) && styles.disabledButton,
        ]}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#111827" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {selected === "office" ? "Confirm pay at office" : "Submit receipt"}
          </Text>
        )}
      </Pressable>
    </>
  );
}

function ContractSection({
  reservation,
  contract,
  journey,
  busy,
  documentBusy,
  checkingSignature,
  onSignContract,
  onDownloadContract,
}: {
  reservation: Reservation;
  contract: SafeContractSummary | null;
  journey: ReservationJourneyViewModel;
  busy: boolean;
  documentBusy: ContractDocumentKind | null;
  checkingSignature: boolean;
  onSignContract: () => void;
  onDownloadContract: (kind: ContractDocumentKind) => void;
}) {
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);

  useEffect(() => {
    if (journey.contract?.status !== "awaiting_customer_signature") {
      setSignatureConfirmed(false);
    }
  }, [journey.contract?.status]);

  if (!contract) {
    return (
      <InfoBanner
        tone="neutral"
        text="Your rental agreement hasn't been created yet. It will appear here when it's ready to sign."
      />
    );
  }

  const userName =
    [reservation.user?.name, reservation.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "this customer";
  const userPhone = reservation.user?.phoneData?.phoneNumber || "phone not available";
  const canOpenSigning = signatureConfirmed && !busy && !checkingSignature;

  return (
    <>
      <Row label="Contract number" value={contract.contractNumber} />
      <Row label="Status" value={contractLabels[journey.contract?.status || "not_created"] || contract.status} />
      <Row label="Created" value={formatDateTime(contract.createdAt)} />
      {journey.contract?.signedAt ? <Row label="Signed" value={journey.contract.signedAt} /> : null}
      {journey.contract?.status === "awaiting_customer_signature" && (
        <>
          <InfoBanner
            tone="warn"
            text="Tap the button below to open DocuSign. When signing is complete, you should return to the app and we'll check the agreement status automatically."
          />
          <Pressable
            onPress={() => setSignatureConfirmed((current) => !current)}
            style={[
              styles.signatureConfirmBox,
              signatureConfirmed && styles.signatureConfirmBoxActive,
            ]}
          >
            <View
              style={[
                styles.signatureCheckbox,
                signatureConfirmed && styles.signatureCheckboxActive,
              ]}
            >
              {signatureConfirmed ? (
                <Ionicons name="checkmark" size={14} color="#111827" />
              ) : null}
            </View>
            <View style={styles.signatureConfirmCopy}>
              <Text style={styles.signatureConfirmTitle}>
                I confirm I want to sign this agreement
              </Text>
              <Text style={styles.signatureConfirmText} numberOfLines={2}>
                {userName} - {userPhone}
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={onSignContract}
            disabled={!canOpenSigning}
            style={[
              styles.primaryButton,
              !canOpenSigning && styles.disabledButton,
            ]}
          >
            {busy || checkingSignature ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  Open DocuSign & return here
                </Text>
                <Ionicons name="open-outline" size={15} color="#111827" />
              </>
            )}
          </Pressable>
        </>
      )}
      {contract.files.source || contract.files.signed || contract.files.certificate ? (
        <View style={styles.contractDownloads}>
          <Text style={styles.contractDownloadsTitle}>Agreement files</Text>
          {contract.files.source && (
            <DocumentButton
              icon="document-outline"
              label="Unsigned agreement"
              loading={documentBusy === "source"}
              onPress={() => onDownloadContract("source")}
            />
          )}
          {contract.files.signed && (
            <DocumentButton
              icon="shield-checkmark-outline"
              label="Signed agreement"
              tone="success"
              loading={documentBusy === "signed"}
              onPress={() => onDownloadContract("signed")}
            />
          )}
          {contract.files.certificate && (
            <DocumentButton
              icon="ribbon-outline"
              label="Certificate"
              loading={documentBusy === "certificate"}
              onPress={() => onDownloadContract("certificate")}
            />
          )}
        </View>
      ) : null}
      {checkingSignature && (
        <InfoBanner
          tone="neutral"
          text="Checking DocuSign now. If the signature is complete, this booking will update in a few seconds."
        />
      )}
    </>
  );
}

function DocumentButton({
  icon,
  label,
  tone = "neutral",
  loading,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: "neutral" | "success";
  loading: boolean;
  onPress: () => void;
}) {
  const accent = tone === "success" ? "#34d399" : ACCENT;
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.documentDownloadButton,
        tone === "success" && styles.documentDownloadButtonSuccess,
        pressed && styles.pressed,
        loading && styles.disabledButton,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={accent} />
      ) : (
        <Ionicons name={icon} size={16} color={accent} />
      )}
      <Text style={[styles.documentDownloadText, { color: accent }]}>
        {loading ? "Preparing..." : label}
      </Text>
      {!loading && <Ionicons name="download-outline" size={15} color={accent} />}
    </Pressable>
  );
}

function CollectionSection({
  reservation,
  journey,
}: {
  reservation: Reservation;
  journey: ReservationJourneyViewModel;
}) {
  return (
    <>
      <Row label="Pickup location" value={journey.collection?.location} />
      <Row label="Pickup time" value={journey.pickupDateTime} />
      <Row label="Return time" value={journey.returnDateTime} />
      {journey.collection?.collectionCode ? (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Collection code</Text>
          <Text style={styles.codeValue}>{journey.collection.collectionCode}</Text>
        </View>
      ) : null}
      <InfoBanner
        tone="neutral"
        text="Bring your driving licence and booking reference. Return the van with the same fuel level and on time to avoid extra charges."
      />
      {reservation.office?.phone ? <Row label="Office phone" value={reservation.office.phone} /> : null}
    </>
  );
}

type InspectionRecordRow = {
  label: string;
  before?: React.ReactNode;
  after?: React.ReactNode;
  value?: React.ReactNode;
};

const listValue = (value?: unknown[] | string | number | boolean | null) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

const customFieldValue = (
  field?: {
    value?: string;
    files?: string[];
    fieldType?: "input" | "file";
  } | null,
) => {
  if (!field) return "-";
  if (field.fieldType === "file") {
    return field.files?.length ? `${field.files.length} file(s)` : "-";
  }
  return field.value || "-";
};

const getCustomFieldRows = (reservation: Reservation): InspectionRecordRow[] => {
  const beforeFields = reservation.handover?.customFields || [];
  const afterFields = reservation.inspection?.customFields || [];
  const labels = Array.from(
    new Set(
      [...beforeFields, ...afterFields]
        .map((field) => field.label)
        .filter((label): label is string => Boolean(label)),
    ),
  );

  return labels.map((label) => ({
    label,
    before: customFieldValue(beforeFields.find((field) => field.label === label)),
    after: customFieldValue(afterFields.find((field) => field.label === label)),
  }));
};

function InspectionTable({
  title,
  rows,
  mode = "single",
}: {
  title?: string;
  rows: InspectionRecordRow[];
  mode?: "single" | "compare";
}) {
  const visibleRows = rows.filter((row) =>
    mode === "compare"
      ? row.before !== undefined || row.after !== undefined
      : row.value !== undefined,
  );

  if (!visibleRows.length) return null;

  return (
    <View style={styles.recordTable}>
      {title ? <Text style={styles.recordTableTitle}>{title}</Text> : null}
      {mode === "compare" ? (
        <View style={styles.recordCompareHeader}>
          <Text style={styles.recordHeaderCell}>Item</Text>
          <Text style={styles.recordHeaderCell}>Before</Text>
          <Text style={styles.recordHeaderCell}>After</Text>
        </View>
      ) : null}
      {visibleRows.map((row, index) => (
        <View
          key={`${row.label}-${index}`}
          style={[
            styles.recordRow,
            index === visibleRows.length - 1 && styles.recordRowLast,
            mode === "compare" && styles.recordCompareRow,
          ]}
        >
          <Text
            style={[
              styles.recordLabel,
              mode === "compare" && styles.recordCompareLabel,
            ]}
            numberOfLines={2}
          >
            {row.label}
          </Text>
          {mode === "compare" ? (
            <>
              <Text style={styles.recordCompareValue} numberOfLines={2}>
                {listValue(row.before as any)}
              </Text>
              <Text style={styles.recordCompareValue} numberOfLines={2}>
                {listValue(row.after as any)}
              </Text>
            </>
          ) : (
            <Text style={styles.recordValue}>{listValue(row.value as any)}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function HandoverSection({ reservation }: { reservation: Reservation }) {
  const handover = reservation.handover;
  if (!handover?.completedAt) {
    return (
      <InfoBanner
        tone="neutral"
        text="The handover checklist is completed with our staff when you collect the van. It will appear here afterwards."
      />
    );
  }
  return (
    <>
      <InspectionTable
        rows={[
          { label: "Starting mileage", value: handover.startMileage },
          { label: "Starting fuel", value: handover.startFuelLevel },
          { label: "Condition notes", value: handover.conditionNotes },
          { label: "Existing damages", value: handover.existingDamages },
          { label: "Keys supplied", value: handover.keyCount },
          { label: "Equipment", value: handover.equipment },
          { label: "Staff", value: handover.staff?.name || handover.staffSignature },
          { label: "Completed", value: formatDateTime(handover.completedAt) },
        ]}
      />
    </>
  );
}

function InspectionSection({ reservation }: { reservation: Reservation }) {
  const inspection = reservation.inspection;
  if (!inspection?.completedAt) {
    return (
      <InfoBanner
        tone="neutral"
        text="We inspect the van after you return it. The result will appear here."
      />
    );
  }
  return (
    <>
      <InspectionTable
        rows={[
          { label: "Received", value: formatDateTime(inspection.receivedAt) },
          { label: "Return mileage", value: inspection.returnMileage },
          { label: "Return fuel", value: inspection.returnFuelLevel },
          { label: "New damages", value: inspection.newDamages },
          { label: "Late return", value: inspection.lateReturn },
          { label: "Late by", value: inspection.lateMinutes ? `${inspection.lateMinutes} minutes` : "-" },
          { label: "Cleaning issue", value: inspection.cleaningIssue },
          { label: "Missing equipment", value: inspection.missingEquipment },
          { label: "Staff", value: inspection.staff?.name },
          { label: "Notes", value: inspection.notes },
          { label: "Completed", value: formatDateTime(inspection.completedAt) },
        ]}
      />
    </>
  );
}

function BeforeAfterComparisonSection({
  reservation,
}: {
  reservation: Reservation;
}) {
  const handover = reservation.handover;
  const inspection = reservation.inspection;
  if (!handover?.completedAt || !inspection?.completedAt) {
    return (
      <InfoBanner
        tone="neutral"
        text="Before/after comparison will appear after both pickup and return inspections are completed."
      />
    );
  }

  return (
    <InspectionTable
      mode="compare"
      rows={[
        {
          label: "Mileage",
          before: handover.startMileage,
          after: inspection.returnMileage,
        },
        {
          label: "Fuel level",
          before: handover.startFuelLevel,
          after: inspection.returnFuelLevel,
        },
        {
          label: "Damages",
          before: handover.existingDamages,
          after: inspection.newDamages,
        },
        {
          label: "Equipment",
          before: handover.equipment,
          after: inspection.missingEquipment,
        },
        ...getCustomFieldRows(reservation),
      ]}
    />
  );
}

function VehicleRecordsAccordions({
  reservation,
  activeSection,
}: {
  reservation: Reservation;
  activeSection: SectionId;
}) {
  const hasHandover = Boolean(reservation.handover?.completedAt);
  const hasInspection = Boolean(reservation.inspection?.completedAt);
  if (!hasHandover && !hasInspection) return null;

  return (
    <View style={styles.recordsGroup}>
      <Text style={styles.recordsGroupTitle}>Vehicle records</Text>
      <CollapsibleRecord
        title="Pickup inspection"
        subtitle={hasHandover ? "Completed handover details" : "Not completed yet"}
        icon="clipboard-outline"
        defaultOpen={activeSection === "handover"}
        disabled={!hasHandover}
      >
        <HandoverSection reservation={reservation} />
      </CollapsibleRecord>
      <CollapsibleRecord
        title="Return inspection"
        subtitle={hasInspection ? "Completed return details" : "Not completed yet"}
        icon="search-outline"
        defaultOpen={activeSection === "inspection"}
        disabled={!hasInspection}
      >
        <InspectionSection reservation={reservation} />
      </CollapsibleRecord>
      <CollapsibleRecord
        title="Before / after comparison"
        subtitle="Pickup values compared with return values"
        icon="git-compare-outline"
        defaultOpen={activeSection === "inspection" && hasHandover && hasInspection}
        disabled={!hasHandover || !hasInspection}
      >
        <BeforeAfterComparisonSection reservation={reservation} />
      </CollapsibleRecord>
    </View>
  );
}

function CollapsibleRecord({
  title,
  subtitle,
  icon,
  defaultOpen,
  disabled,
  children,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  defaultOpen?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen && !disabled));

  return (
    <View style={[styles.recordAccordion, disabled && styles.recordAccordionDisabled]}>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen((prev) => !prev)}
        style={styles.recordAccordionHeader}
      >
        <View style={styles.recordAccordionIcon}>
          <Ionicons name={icon} size={16} color={disabled ? "#64748b" : ACCENT} />
        </View>
        <View style={styles.recordAccordionCopy}>
          <Text style={styles.recordAccordionTitle}>{title}</Text>
          <Text style={styles.recordAccordionSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={disabled ? "#64748b" : ACCENT}
        />
      </Pressable>
      {open && !disabled ? <View style={styles.recordAccordionBody}>{children}</View> : null}
    </View>
  );
}

function RefundSection({
  reservation,
  journey,
}: {
  reservation: Reservation;
  journey: ReservationJourneyViewModel;
}) {
  const refund = reservation.refund;
  if (!refund || !journey.refund) {
    return (
      <InfoBanner
        tone="neutral"
        text="Your deposit refund will be reviewed after the return inspection."
      />
    );
  }
  const deductions = [
    ["Fuel charge", refund.charges?.fuel],
    ["Late return charge", refund.charges?.late],
    ["Damage charge", refund.charges?.damage],
    ["Cleaning charge", refund.charges?.cleaning],
    ["Missing equipment", refund.charges?.missingEquipment],
    ["Other charge", refund.charges?.other],
    ...(refund.additionalCharges || []).map((charge) => [
      charge.reason || "Additional charge",
      charge.amount,
    ]),
  ].filter(([, amount]) => Number(amount || 0) > 0);

  return (
    <>
      {journey.mainStatus === "refund_processing" && journey.refund.expectedBy ? (
        <RefundCountdown expectedBy={journey.refund.expectedBy} />
      ) : null}
      <Row label="Deposit paid" value={formatMoney(journey.refund.depositPaid)} />
      {deductions.map(([label, amount], index) => (
        <Row key={`${label}-${index}`} label={String(label)} value={`-${formatMoney(Number(amount))}`} />
      ))}
      <Row label="Total deductions" value={`-${formatMoney(journey.refund.deductionsTotal)}`} />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Refund amount</Text>
        <Text style={[styles.totalValue, { color: "#34d399" }]}>
          {formatMoney(journey.refund.refundAmount)}
        </Text>
      </View>
      <Row label="Status" value={journey.refund.status.replace(/_/g, " ")} />
      <Row label="Expected by" value={formatDateTime(journey.refund.expectedBy)} />
      <Row label="Reference" value={journey.refund.reference} />
    </>
  );
}

function RefundCountdown({ expectedBy }: { expectedBy: string }) {
  const deadline = useMemo(
    () => getInclusiveLondonDeadline(expectedBy),
    [expectedBy],
  );
  const [remaining, setRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    if (!deadline) return;
    let active = true;

    const update = () => {
      if (active) setRemaining(calculateRemaining(deadline));
    };
    update();
    syncServerClock().then(update).catch(update);
    const timer = setInterval(update, SECOND);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [deadline]);

  if (!deadline || !remaining) return null;

  const formattedDate = formatDateInLondon(deadline);

  return (
    <View style={styles.refundCountdown}>
      <View style={styles.refundCountdownHeader}>
        <View style={styles.refundCountdownIcon}>
          <Ionicons name="time-outline" size={18} color={ACCENT} />
          <View style={styles.refundCountdownPulse} />
        </View>
        <View style={styles.refundCountdownCopy}>
          <View style={styles.refundCountdownTitleRow}>
            <Text style={styles.refundCountdownTitle}>Refund processing</Text>
            <Text style={styles.refundCountdownBadge}>In progress</Text>
          </View>
          <Text style={styles.refundCountdownText}>
            Expected refund date: {formattedDate}
          </Text>
        </View>
      </View>

      {remaining.reached ? (
        <View style={styles.refundReachedBox}>
          <Text style={styles.refundReachedTitle}>
            Expected refund date reached
          </Text>
          <Text style={styles.refundReachedText}>
            Bank processing may take a short time to appear.
          </Text>
        </View>
      ) : (
        <View style={styles.countdownGrid}>
          {countdownUnits.map((unit, index) => (
            <View
              key={unit.key}
              style={[
                styles.countdownUnit,
                index > 0 && styles.countdownUnitBorder,
              ]}
            >
              <Text style={styles.countdownValue}>
                {String(remaining[unit.key]).padStart(2, "0")}
              </Text>
              <Text style={styles.countdownLabel}>{unit.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function TimelineSection({ reservation }: { reservation: Reservation }) {
  const history = reservation.statusHistory || [];
  if (!history.length) {
    return (
      <InfoBanner
        tone="neutral"
        text="Booking activity will appear here as your reservation progresses."
      />
    );
  }
  return (
    <>
      {[...history].reverse().map((entry, index) => (
        <View key={`${entry.status}-${index}`} style={styles.timelineRow}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineCopy}>
            <Text style={styles.timelineTitle}>{String(entry.status).replace(/_/g, " ")}</Text>
            <Text style={styles.timelineDate}>{formatDateTime(entry.changedAt)}</Text>
            {entry.note ? <Text style={styles.timelineNote}>{entry.note}</Text> : null}
          </View>
        </View>
      ))}
    </>
  );
}

function InfoBanner({
  text,
  title,
  tone,
}: {
  text: string;
  title?: string;
  tone: "success" | "warn" | "danger" | "neutral";
}) {
  const color =
    tone === "success"
      ? "#34d399"
      : tone === "danger"
        ? "#fb7185"
        : tone === "warn"
          ? ACCENT
          : "#94a3b8";
  return (
    <View style={[styles.infoBanner, { borderColor: `${color}55` }]}>
      <Ionicons
        name={
          tone === "success"
            ? "checkmark-circle-outline"
            : tone === "danger"
              ? "alert-circle-outline"
              : "information-circle-outline"
        }
        size={17}
        color={color}
      />
      <View style={styles.infoBannerCopy}>
        {title ? (
          <Text style={[styles.infoBannerTitle, { color }]}>{title}</Text>
        ) : null}
        <Text style={[styles.infoBannerText, { color }]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sheet: {
    height: height * 0.92,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.5)",
    marginTop: 10,
  },
  header: {
    minHeight: 66,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerCopy: { flex: 1, minWidth: 0 },
  headerKicker: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 34 },
  heroCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(13,22,39,0.96)",
    marginBottom: 12,
  },
  heroImageWrap: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a1221",
  },
  heroImage: { width: "100%", height: "100%" },
  heroBody: { padding: 14 },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: "900" },
  vehicleTitle: {
    color: "#f8fafc",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 10,
  },
  heroMetaRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  metaItem: {
    flex: 1,
    minHeight: 59,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.035)",
    padding: 10,
    flexDirection: "row",
    gap: 7,
  },
  metaTextWrap: { flex: 1, minWidth: 0 },
  metaLabel: {
    color: "rgba(203,213,225,0.55)",
    fontSize: 8.5,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metaValue: {
    color: "#e5edf8",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 3,
  },
  nextAction: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.16)",
    padding: 12,
    marginTop: 12,
  },
  nextActionHot: {
    borderColor: "rgba(254,154,0,0.38)",
    backgroundColor: "rgba(254,154,0,0.1)",
  },
  nextIcon: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },
  nextCopy: { flex: 1, minWidth: 0 },
  nextKicker: {
    color: "rgba(203,213,225,0.5)",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  nextTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 2 },
  nextDescription: {
    color: "rgba(226,232,240,0.72)",
    fontSize: 10.5,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 3,
  },
  recordsGroup: {
    marginBottom: 12,
  },
  recordsGroupTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
  },
  recordAccordion: {
    borderRadius: 15,
    marginBottom: 8,
    overflow: "hidden",
    backgroundColor: "rgba(13,22,39,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  recordAccordionDisabled: {
    opacity: 0.62,
  },
  recordAccordionHeader: {
    minHeight: 58,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  recordAccordionIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.11)",
  },
  recordAccordionCopy: {
    flex: 1,
    minWidth: 0,
  },
  recordAccordionTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
  },
  recordAccordionSubtitle: {
    color: "rgba(203,213,225,0.52)",
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  recordAccordionBody: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  recordTable: {
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: "rgba(2,6,23,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  recordTableTitle: {
    color: ACCENT,
    fontSize: 10.5,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 3,
  },
  recordRow: {
    minHeight: 43,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  recordRowLast: {
    borderBottomWidth: 0,
  },
  recordLabel: {
    color: "rgba(203,213,225,0.54)",
    fontSize: 8.5,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  recordValue: {
    color: "#f8fafc",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
  },
  recordCompareHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(254,154,0,0.08)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(254,154,0,0.18)",
  },
  recordHeaderCell: {
    flex: 1,
    color: "#fed7aa",
    fontSize: 8.5,
    fontWeight: "900",
    textAlign: "center",
  },
  recordCompareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recordCompareValue: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  recordCompareLabel: {
    flex: 1,
    marginBottom: 0,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 43,
    borderRadius: 13,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#111827",
    fontSize: 12.5,
    fontWeight: "900",
  },
  signatureConfirmBox: {
    minHeight: 58,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  signatureConfirmBoxActive: {
    backgroundColor: "rgba(254,154,0,0.1)",
    borderColor: "rgba(254,154,0,0.42)",
  },
  signatureCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(203,213,225,0.34)",
    backgroundColor: "rgba(15,23,42,0.58)",
  },
  signatureCheckboxActive: {
    borderColor: ACCENT,
    backgroundColor: ACCENT,
  },
  signatureConfirmCopy: {
    flex: 1,
    minWidth: 0,
  },
  signatureConfirmTitle: {
    color: "#f8fafc",
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: "900",
  },
  signatureConfirmText: {
    color: "rgba(203,213,225,0.62)",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    marginTop: 3,
  },
  secondaryButton: { backgroundColor: "rgba(255,255,255,0.08)" },
  secondaryButtonText: { color: "#f8fafc" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabledButton: { opacity: 0.55 },
  trackerCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(13,22,39,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },
  trackerHeader: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trackerTitle: {
    marginBottom: 0,
  },
  trackerToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.18)",
  },
  trackerBody: {
    paddingTop: 12,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 12,
  },
  stepRow: { flexDirection: "row", minHeight: 54 },
  stepRail: { alignItems: "center", width: 34 },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(148,163,184,0.15)",
  },
  stepCopy: {
    flex: 1,
    paddingLeft: 7,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },
  stepLabel: { fontSize: 12.5, fontWeight: "900" },
  stepState: {
    color: "rgba(203,213,225,0.55)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },
  stepDescription: {
    color: "rgba(203,213,225,0.52)",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  compactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  compactCard: {
    width: "48.6%",
    minHeight: 102,
    borderRadius: 14,
    padding: 11,
    backgroundColor: "rgba(13,22,39,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  compactCardHot: {
    borderColor: "rgba(254,154,0,0.34)",
    backgroundColor: "rgba(254,154,0,0.08)",
  },
  compactTitle: {
    color: "rgba(203,213,225,0.58)",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 8,
  },
  compactValue: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "capitalize",
  },
  compactDetail: {
    color: "rgba(203,213,225,0.48)",
    fontSize: 9.5,
    fontWeight: "700",
    marginTop: 3,
  },
  sectionTabs: { gap: 8, paddingBottom: 10 },
  sectionTab: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  sectionTabActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  sectionTabText: {
    color: "#b6c0ce",
    fontSize: 10.5,
    fontWeight: "800",
  },
  sectionTabTextActive: { color: "#111827" },
  detailsCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(13,22,39,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },
  infoRow: {
    minHeight: 38,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  infoLabel: {
    color: "rgba(203,213,225,0.55)",
    fontSize: 11,
    fontWeight: "800",
    flex: 0.9,
  },
  infoValue: {
    color: "#f8fafc",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "800",
    textAlign: "right",
    flex: 1.2,
  },
  totalRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(254,154,0,0.22)",
    marginTop: 8,
    paddingTop: 10,
  },
  totalLabel: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  totalValue: { color: ACCENT, fontSize: 19, fontWeight: "900" },
  documentRow: {
    minHeight: 56,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 8,
  },
  documentIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.1)",
    marginRight: 10,
  },
  documentCopy: { flex: 1, minWidth: 0 },
  documentTitle: { color: "#f8fafc", fontSize: 12, fontWeight: "900" },
  documentSub: {
    color: "rgba(203,213,225,0.52)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  licenceUploadCta: {
    minHeight: 62,
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: ACCENT,
    marginBottom: 10,
  },
  licenceUploadIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.12)",
  },
  licenceUploadCopy: { flex: 1, minWidth: 0 },
  licenceUploadTitle: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "900",
  },
  licenceUploadText: {
    color: "rgba(15,23,42,0.72)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  licenceDetailsCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.22)",
    backgroundColor: "rgba(52,211,153,0.08)",
    padding: 12,
    marginBottom: 8,
  },
  licenceDetailsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  licenceDetailsTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
  },
  licenceDetailsSub: {
    color: "rgba(203,213,225,0.56)",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  licenceDetailsBadge: {
    minHeight: 25,
    borderRadius: 999,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(52,211,153,0.12)",
  },
  licenceDetailsBadgeText: {
    color: "#34d399",
    fontSize: 9,
    fontWeight: "900",
  },
  licenceDetailsGrid: {
    gap: 7,
  },
  licenceDetailItem: {
    borderRadius: 11,
    padding: 9,
    backgroundColor: "rgba(2,6,23,0.24)",
  },
  licenceDetailLabel: {
    color: "rgba(203,213,225,0.46)",
    fontSize: 8.5,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  licenceDetailValue: {
    color: "#f8fafc",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  depositOption: {
    borderRadius: 13,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 8,
  },
  depositOptionSelected: {
    borderColor: "rgba(254,154,0,0.56)",
    backgroundColor: "rgba(254,154,0,0.1)",
  },
  depositOptionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  depositOptionTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
    flex: 1,
  },
  depositAmountStack: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  depositOriginalAmount: {
    color: "rgba(203,213,225,0.42)",
    fontSize: 10,
    fontWeight: "800",
    textDecorationLine: "line-through",
    marginBottom: 1,
  },
  depositOptionAmount: { color: ACCENT, fontSize: 13, fontWeight: "900" },
  depositDiscountBadge: {
    alignSelf: "flex-start",
    minHeight: 25,
    borderRadius: 999,
    paddingHorizontal: 9,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(52,211,153,0.12)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.24)",
  },
  depositDiscountText: {
    color: "#34d399",
    fontSize: 10.5,
    fontWeight: "900",
  },
  depositOptionNote: {
    color: "rgba(203,213,225,0.56)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: 5,
  },
  receiptButton: {
    minHeight: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(254,154,0,0.38)",
    backgroundColor: "rgba(254,154,0,0.07)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  receiptButtonText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: "900",
  },
  receiptPreviewCard: {
    height: 148,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.26)",
    marginTop: 4,
    marginBottom: 12,
  },
  receiptPreviewImage: {
    width: "100%",
    height: "100%",
  },
  receiptPreviewMeta: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  receiptPreviewCopy: {
    flex: 1,
    minWidth: 0,
  },
  receiptPreviewTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
  },
  receiptPreviewText: {
    color: "rgba(203,213,225,0.62)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  receiptPreviewAction: {
    minHeight: 34,
    borderRadius: 11,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,23,42,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  receiptPreviewActionText: {
    color: "#f8fafc",
    fontSize: 10.5,
    fontWeight: "900",
  },
  receiptRemoveAction: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,113,133,0.14)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.26)",
  },
  infoBanner: {
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.035)",
    padding: 11,
    flexDirection: "row",
    gap: 9,
    marginBottom: 10,
  },
  infoBannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  infoBannerTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    marginBottom: 2,
  },
  infoBannerText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  refundCountdown: {
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(254,154,0,0.055)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.22)",
    marginBottom: 12,
  },
  refundCountdownHeader: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 12,
  },
  refundCountdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.25)",
  },
  refundCountdownPulse: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ACCENT,
    borderWidth: 2,
    borderColor: "#17233a",
  },
  refundCountdownCopy: { flex: 1, minWidth: 0 },
  refundCountdownTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  refundCountdownTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  refundCountdownBadge: {
    color: ACCENT,
    fontSize: 8.5,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  refundCountdownText: {
    color: "rgba(203,213,225,0.62)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  countdownGrid: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(12,20,37,0.55)",
  },
  countdownUnit: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  countdownUnitBorder: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.08)",
  },
  countdownValue: {
    color: "#f8fafc",
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "900",
  },
  countdownLabel: {
    color: "rgba(203,213,225,0.42)",
    fontSize: 8.5,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: 2,
  },
  refundReachedBox: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    padding: 12,
    backgroundColor: "rgba(12,20,37,0.55)",
  },
  refundReachedTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
  },
  refundReachedText: {
    color: "rgba(203,213,225,0.58)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 3,
  },
  contractDownloads: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginTop: 4,
    marginBottom: 10,
    gap: 8,
  },
  contractDownloadsTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 2,
  },
  documentDownloadButton: {
    minHeight: 43,
    borderRadius: 13,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "rgba(254,154,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.22)",
  },
  documentDownloadButtonSuccess: {
    backgroundColor: "rgba(52,211,153,0.09)",
    borderColor: "rgba(52,211,153,0.24)",
  },
  documentDownloadText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
  },
  codeBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.34)",
    backgroundColor: "rgba(254,154,0,0.08)",
    padding: 14,
    alignItems: "center",
    marginVertical: 8,
  },
  codeLabel: {
    color: "rgba(203,213,225,0.56)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  codeValue: {
    color: ACCENT,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 4,
  },
  timelineCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(13,22,39,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  timelineHeader: {
    minHeight: 58,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timelineHeaderCopy: { flex: 1, minWidth: 0 },
  timelineHeaderKicker: {
    color: "rgba(203,213,225,0.48)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  timelineHeaderTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  timelineToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.18)",
  },
  timelineBody: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  timelineRow: { flexDirection: "row", gap: 10, paddingBottom: 13 },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: ACCENT,
    marginTop: 5,
  },
  timelineCopy: { flex: 1, minWidth: 0 },
  timelineTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  timelineDate: {
    color: "rgba(203,213,225,0.48)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  timelineNote: {
    color: "rgba(203,213,225,0.56)",
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 3,
  },
});

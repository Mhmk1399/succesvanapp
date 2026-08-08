import { useToast } from "@/components/global/AppToast";
import {
  customerJourneyService,
  type LicenceDetailsReview,
} from "@/services/customerJourneyService";
import { uploadToS3 } from "@/utils/s3Upload";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const ACCENT = "#fe9a00";

type LicenceSide = "front" | "back";
type UploadPhase = "idle" | "scanning" | "front" | "back" | "saving";
type PendingLicenceReview = {
  details: LicenceDetailsReview;
  previewUri: string;
};
type EditableLicenceDetails = {
  fullName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  licenceNumber: string;
  issueDate: string;
  expiryDate: string;
  address: string;
  postcode: string;
  issuingAuthority: string;
  issuingCountry: string;
  licenceCategories: string;
};

interface LicenseUploadModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export default function LicenseUploadModal({
  visible,
  onClose,
  userId,
  onSuccess,
}: LicenseUploadModalProps) {
  const { showToast } = useToast();
  const [licenseFront, setLicenseFront] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [licenseBack, setLicenseBack] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [frontProgress, setFrontProgress] = useState(0);
  const [backProgress, setBackProgress] = useState(0);
  const [saveProgress, setSaveProgress] = useState(0);
  const [pendingReview, setPendingReview] = useState<PendingLicenceReview | null>(
    null,
  );

  const readyCount = Number(Boolean(licenseFront)) + Number(Boolean(licenseBack));
  const canSubmit = readyCount === 2 && !isUploading;

  const uploadProgress = useMemo(() => {
    if (!isUploading) return 0;
    return Math.min(
      100,
      Math.round(frontProgress * 0.45 + backProgress * 0.45 + saveProgress * 0.1),
    );
  }, [backProgress, frontProgress, isUploading, saveProgress]);

  const progressLabel = useMemo(() => {
    if (!isUploading) {
      return readyCount === 2
        ? "Ready to scan front side"
        : `${readyCount}/2 sides selected`;
    }
    if (uploadPhase === "scanning") return "Scanning front side";
    if (uploadPhase === "front") return "Uploading front side";
    if (uploadPhase === "back") return "Uploading back side";
    if (uploadPhase === "saving") return "Saving to your profile";
    return "Preparing upload";
  }, [isUploading, readyCount, uploadPhase]);

  const pickImage = async (side: LicenceSide) => {
    if (isUploading) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.82,
      });

      if (!result.canceled && result.assets?.length > 0) {
        if (side === "front") {
          setLicenseFront(result.assets[0]);
          setFrontProgress(0);
        } else {
          setLicenseBack(result.assets[0]);
          setBackProgress(0);
        }
        await Haptics.selectionAsync();
      }
    } catch {
      showToast({
        type: "error",
        title: "Image not selected",
        message: "Failed to pick image.",
      });
    }
  };

  const removeImage = (side: LicenceSide) => {
    if (isUploading) return;
    if (side === "front") {
      setLicenseFront(null);
      setFrontProgress(0);
    } else {
      setLicenseBack(null);
      setBackProgress(0);
    }
    void Haptics.selectionAsync();
  };

  const resetUploadProgress = () => {
    setUploadPhase("idle");
    setFrontProgress(0);
    setBackProgress(0);
    setSaveProgress(0);
  };

  const handleUpload = async () => {
    if (!licenseFront || !licenseBack) {
      showToast({
        type: "error",
        title: "Licence images needed",
        message: "Please select both front and back images.",
      });
      return;
    }

    setIsUploading(true);
    resetUploadProgress();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      setUploadPhase("scanning");
      const licenceDetails =
        await customerJourneyService.extractLicenceDetails(licenseFront);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingReview({
        previewUri: licenseFront.uri,
        details: {
          ...licenceDetails,
          isFrontSide: true,
          sourceSide: "front",
        },
      });
      showToast({
        type: "success",
        title: "Licence scanned",
        message: "Please check the details before saving.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Scan failed",
        message:
          error instanceof Error
            ? error.message
            : "Could not read the front licence image.",
      });
    } finally {
      setIsUploading(false);
      setUploadPhase("idle");
    }
  };

  const handleConfirmReview = async (licenceDetails: LicenceDetailsReview) => {
    if (!licenseFront || !licenseBack) return;

    setIsUploading(true);
    resetUploadProgress();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const requestBody = { front: "", back: "" };

      setUploadPhase("front");
      requestBody.front = await uploadToS3(
        licenseFront,
        "license-front",
        setFrontProgress,
      );

      setUploadPhase("back");
      requestBody.back = await uploadToS3(
        licenseBack,
        "license-back",
        setBackProgress,
      );

      setUploadPhase("saving");
      setSaveProgress(35);
      const result = await customerJourneyService.updateUserLicence(
        userId,
        requestBody,
        licenceDetails,
      );
      setSaveProgress(78);
      setSaveProgress(100);

      if (result.success) {
        await AsyncStorage.setItem("user", JSON.stringify(result.data));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess();
        handleClose(true);
      } else {
        throw new Error(result.error || "Failed to upload licences");
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Upload failed",
        message: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setIsUploading(false);
      setUploadPhase("idle");
    }
  };

  const handleClose = (force = false) => {
    if (isUploading && !force) {
      showToast({
        type: "info",
        title: "Upload in progress",
        message: "Please wait while your licence images finish uploading.",
      });
      return;
    }

    setLicenseFront(null);
    setLicenseBack(null);
    setPendingReview(null);
    resetUploadProgress();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      presentationStyle="overFullScreen"
      onRequestClose={() => handleClose()}
    >
      <Pressable style={styles.overlay} onPress={() => handleClose()}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheet}>
          <LinearGradient
            colors={["#17233a", "#07101f"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="card-outline" size={22} color={ACCENT} />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.kicker}>DRIVING LICENCE</Text>
                <Text style={styles.title}>Upload both sides</Text>
                <Text style={styles.subtitle}>
                  Clear photos help us verify your booking faster.
                </Text>
              </View>
              <Pressable onPress={() => handleClose()} style={styles.closeButton}>
                <Ionicons name="close" size={18} color="#f8fafc" />
              </Pressable>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressTop}>
                <Text style={styles.progressTitle}>{progressLabel}</Text>
                <Text style={styles.progressPercent}>
                  {isUploading ? `${uploadProgress}%` : `${readyCount}/2`}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${isUploading ? uploadProgress : readyCount * 50}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.stepRow}>
                <StepDot label="Front" done={Boolean(licenseFront)} active={uploadPhase === "front"} />
                <StepDot label="Back" done={Boolean(licenseBack)} active={uploadPhase === "back"} />
                <StepDot label="Scan" done={Boolean(pendingReview)} active={uploadPhase === "scanning"} />
                <StepDot label="Save" done={saveProgress === 100} active={uploadPhase === "saving"} />
              </View>
            </View>

            <View style={styles.uploadGrid}>
              <LicenceCard
                side="front"
                title="Front side"
                helper="Photo page with your name and licence number."
                image={licenseFront}
                progress={frontProgress}
                active={uploadPhase === "front"}
                uploading={isUploading}
                onPick={() => pickImage("front")}
                onRemove={() => removeImage("front")}
              />
              <LicenceCard
                side="back"
                title="Back side"
                helper="The reverse side with categories and details."
                image={licenseBack}
                progress={backProgress}
                active={uploadPhase === "back"}
                uploading={isUploading}
                onPick={() => pickImage("back")}
                onRemove={() => removeImage("back")}
              />
            </View>

            <View style={styles.noteBox}>
              <Ionicons name="lock-closed-outline" size={16} color="#94a3b8" />
              <Text style={styles.noteText}>
                Your licence is stored securely and only used for rental
                verification.
              </Text>
            </View>

            <Pressable
              onPress={handleUpload}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.submitBtn,
                !canSubmit && styles.submitBtnDisabled,
                pressed && canSubmit && styles.submitBtnPressed,
              ]}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator size="small" color="#0f172a" />
                  <Text style={styles.submitText}>
                    {uploadPhase === "scanning" ? "Scanning..." : "Uploading..."}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.submitText}>Scan and submit licence</Text>
                  <Ionicons name="arrow-forward" size={15} color="#0f172a" />
                </>
              )}
            </Pressable>
          </ScrollView>

          <LicenceDetailsReviewModal
            visible={Boolean(pendingReview)}
            imagePreview={pendingReview?.previewUri}
            details={pendingReview?.details ?? null}
            saving={isUploading}
            onCancel={() => setPendingReview(null)}
            onConfirm={handleConfirmReview}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const emptyDetails: EditableLicenceDetails = {
  fullName: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  licenceNumber: "",
  issueDate: "",
  expiryDate: "",
  address: "",
  postcode: "",
  issuingAuthority: "",
  issuingCountry: "",
  licenceCategories: "",
};

function toForm(details: LicenceDetailsReview): EditableLicenceDetails {
  return {
    fullName: details.fullName || "",
    firstName: details.firstName || "",
    lastName: details.lastName || "",
    dateOfBirth: details.dateOfBirth || "",
    licenceNumber: details.licenceNumber || details.licenseNumber || "",
    issueDate: details.issueDate || "",
    expiryDate: details.expiryDate || details.expirationDate || "",
    address: details.address || "",
    postcode: details.postcode || "",
    issuingAuthority: details.issuingAuthority || "",
    issuingCountry: details.issuingCountry || "",
    licenceCategories: details.licenceCategories?.join(", ") || "",
  };
}

function toDetails(form: EditableLicenceDetails): LicenceDetailsReview {
  const licenceNumber = form.licenceNumber.trim();
  const expiryDate = form.expiryDate.trim();
  return {
    isFrontSide: true,
    sourceSide: "front",
    fullName: form.fullName.trim() || null,
    firstName: form.firstName.trim() || null,
    lastName: form.lastName.trim() || null,
    dateOfBirth: form.dateOfBirth.trim() || null,
    licenceNumber: licenceNumber || null,
    licenseNumber: licenceNumber || null,
    issueDate: form.issueDate.trim() || null,
    expiryDate: expiryDate || null,
    expirationDate: expiryDate || null,
    address: form.address.trim() || null,
    postcode: form.postcode.trim() || null,
    issuingAuthority: form.issuingAuthority.trim() || null,
    issuingCountry: form.issuingCountry.trim() || null,
    licenceCategories: form.licenceCategories
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function LicenceDetailsReviewModal({
  visible,
  imagePreview,
  details,
  saving,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  imagePreview?: string;
  details: LicenceDetailsReview | null;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (details: LicenceDetailsReview) => void;
}) {
  const [form, setForm] = useState<EditableLicenceDetails>(emptyDetails);

  React.useEffect(() => {
    if (details) setForm(toForm(details));
  }, [details]);

  if (!visible || !details) return null;

  const update =
    (field: keyof EditableLicenceDetails) => (value: string) =>
      setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <View style={styles.reviewOverlay}>
      <View style={styles.reviewSheet}>
        <LinearGradient
          colors={["#17233a", "#07101f"]}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView contentContainerStyle={styles.reviewContent}>
          <View style={styles.reviewHeader}>
            <View style={styles.headerIcon}>
              <Ionicons name="scan-outline" size={21} color={ACCENT} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>LICENCE SCAN REVIEW</Text>
              <Text style={styles.reviewTitle}>Check your licence details</Text>
              <Text style={styles.subtitle}>
                These details are used on your rental agreement.
              </Text>
            </View>
            <Pressable
              disabled={saving}
              onPress={onCancel}
              style={[styles.closeButton, saving && styles.buttonDisabled]}
            >
              <Ionicons name="close" size={18} color="#f8fafc" />
            </Pressable>
          </View>

          {imagePreview ? (
            <Image source={{ uri: imagePreview }} style={styles.reviewImage} />
          ) : null}

          <View style={styles.scanHint}>
            <Ionicons name="information-circle-outline" size={16} color={ACCENT} />
            <Text style={styles.scanHintText}>
              For UK licences, DOB is field 3, expiry is 4b, and licence number
              is field 5.
            </Text>
          </View>

          <View style={styles.fieldsGrid}>
            <ReviewField label="Full name" value={form.fullName} onChange={update("fullName")} />
            <ReviewField label="Licence number" value={form.licenceNumber} onChange={update("licenceNumber")} />
            <ReviewField label="First name" value={form.firstName} onChange={update("firstName")} />
            <ReviewField label="Last name" value={form.lastName} onChange={update("lastName")} />
            <ReviewField label="Date of birth" value={form.dateOfBirth} onChange={update("dateOfBirth")} placeholder="YYYY-MM-DD" />
            <ReviewField label="Expiry date" value={form.expiryDate} onChange={update("expiryDate")} placeholder="YYYY-MM-DD" />
            <ReviewField label="Issue date" value={form.issueDate} onChange={update("issueDate")} placeholder="YYYY-MM-DD" />
            <ReviewField label="Postcode" value={form.postcode} onChange={update("postcode")} />
            <ReviewField label="Address" value={form.address} onChange={update("address")} multiline />
            <ReviewField label="Issuing authority" value={form.issuingAuthority} onChange={update("issuingAuthority")} />
            <ReviewField label="Issuing country" value={form.issuingCountry} onChange={update("issuingCountry")} />
            <ReviewField label="Licence categories" value={form.licenceCategories} onChange={update("licenceCategories")} placeholder="B, BE, C1" />
          </View>

          <View style={styles.reviewActions}>
            <Pressable
              disabled={saving}
              onPress={onCancel}
              style={[styles.reviewCancel, saving && styles.buttonDisabled]}
            >
              <Text style={styles.reviewCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={() => onConfirm(toDetails(form))}
              style={[styles.reviewConfirm, saving && styles.buttonDisabled]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={17} color="#0f172a" />
              )}
              <Text style={styles.reviewConfirmText}>
                {saving ? "Saving..." : "Confirm and save"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function ReviewField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.reviewField}>
      <Text style={styles.reviewFieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(148,163,184,0.45)"
        multiline={multiline}
        style={[styles.reviewInput, multiline && styles.reviewInputMultiline]}
      />
    </View>
  );
}

function StepDot({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <View style={styles.stepItem}>
      <View
        style={[
          styles.stepDot,
          done && styles.stepDotDone,
          active && styles.stepDotActive,
        ]}
      >
        <Ionicons
          name={done ? "checkmark" : active ? "sync-outline" : "ellipse"}
          size={done || active ? 12 : 6}
          color={done ? "#052e16" : active ? "#0f172a" : "#64748b"}
        />
      </View>
      <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

function LicenceCard({
  title,
  helper,
  image,
  progress,
  active,
  uploading,
  onPick,
  onRemove,
}: {
  side: LicenceSide;
  title: string;
  helper: string;
  image: ImagePicker.ImagePickerAsset | null;
  progress: number;
  active: boolean;
  uploading: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.licenceCard, active && styles.licenceCardActive]}>
      <View style={styles.licenceCardHeader}>
        <View style={styles.licenceCardTitleWrap}>
          <Text style={styles.licenceTitle}>{title}</Text>
          <Text style={styles.licenceHelper}>{helper}</Text>
        </View>
        <View style={[styles.statusIcon, image && styles.statusIconDone]}>
          <Ionicons
            name={image ? "checkmark" : "add"}
            size={15}
            color={image ? "#052e16" : ACCENT}
          />
        </View>
      </View>

      {image ? (
        <View style={styles.preview}>
          <Image source={{ uri: image.uri }} style={styles.image} />
          <LinearGradient
            colors={["transparent", "rgba(2,6,23,0.78)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.previewActions}>
            <Pressable
              disabled={uploading}
              onPress={onPick}
              style={[styles.previewButton, uploading && styles.buttonDisabled]}
            >
              <Ionicons name="refresh-outline" size={14} color="#f8fafc" />
              <Text style={styles.previewButtonText}>Change</Text>
            </Pressable>
            <Pressable
              disabled={uploading}
              onPress={onRemove}
              style={[styles.removeButton, uploading && styles.buttonDisabled]}
            >
              <Ionicons name="trash-outline" size={14} color="#fb7185" />
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          disabled={uploading}
          onPress={onPick}
          style={({ pressed }) => [
            styles.uploadBtn,
            pressed && styles.uploadBtnPressed,
            uploading && styles.buttonDisabled,
          ]}
        >
          <Ionicons name="cloud-upload-outline" size={30} color={ACCENT}  />
          <Text style={styles.uploadText}>Choose image</Text>
          <Text style={styles.uploadSubText}>JPG, PNG or WebP</Text>
        </Pressable>
      )}

      {active && (
        <View style={styles.cardProgress}>
          <View style={styles.cardProgressTrack}>
            <View style={[styles.cardProgressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.cardProgressText}>{progress}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.48)",
    marginTop: 10,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.22)",
  },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  title: {
    color: "#f8fafc",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 2,
  },
  subtitle: {
    color: "rgba(203,213,225,0.62)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  progressCard: {
    borderRadius: 16,
    padding: 13,
    backgroundColor: "rgba(13,22,39,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },
  progressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  progressTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
  },
  progressPercent: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: "900",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(148,163,184,0.16)",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
  },
  stepItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100,116,139,0.14)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
  },
  stepDotDone: {
    backgroundColor: "#86efac",
    borderColor: "#86efac",
  },
  stepDotActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  stepLabel: {
    color: "rgba(203,213,225,0.48)",
    fontSize: 10,
    fontWeight: "800",
  },
  stepLabelActive: { color: "#f8fafc" },
  uploadGrid: { gap: 10 },
  licenceCard: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(13,22,39,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  licenceCardActive: {
    borderColor: "rgba(254,154,0,0.42)",
    backgroundColor: "rgba(254,154,0,0.07)",
  },
  licenceCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  licenceCardTitleWrap: { flex: 1, minWidth: 0 },
  licenceTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  licenceHelper: {
    color: "rgba(203,213,225,0.52)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: 3,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.2)",
  },
  statusIconDone: {
    backgroundColor: "#86efac",
    borderColor: "#86efac",
  },
  uploadBtn: {
    minHeight: 124,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(254,154,0,0.42)",
    backgroundColor: "rgba(254,154,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  uploadBtnPressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  uploadText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 8,
  },
  uploadSubText: {
    color: "rgba(203,213,225,0.44)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },
  preview: {
    height: 150,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#020617",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  previewActions: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  previewButton: {
    minHeight: 34,
    borderRadius: 11,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,23,42,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  previewButtonText: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "900",
  },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,113,133,0.14)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.26)",
  },
  buttonDisabled: { opacity: 0.5 },
  cardProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  cardProgressTrack: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(148,163,184,0.16)",
  },
  cardProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  cardProgressText: {
    width: 34,
    color: ACCENT,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "right",
  },
  noteBox: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 13,
    padding: 11,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginTop: 12,
  },
  noteText: {
    flex: 1,
    color: "rgba(203,213,225,0.58)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
  },
  submitBtn: {
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  submitBtnDisabled: {
    backgroundColor: "rgba(254,154,0,0.28)",
  },
  submitBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  submitText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  reviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  reviewSheet: {
    maxHeight: "94%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  reviewContent: {
    padding: 16,
    paddingBottom: 26,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  reviewTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  reviewImage: {
    width: "100%",
    height: 172,
    borderRadius: 16,
    backgroundColor: "#020617",
    marginBottom: 10,
  },
  scanHint: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.22)",
    backgroundColor: "rgba(254,154,0,0.08)",
    padding: 11,
    marginBottom: 12,
  },
  scanHintText: {
    flex: 1,
    color: "rgba(254,214,170,0.82)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
  },
  fieldsGrid: {
    gap: 9,
  },
  reviewField: {
    gap: 5,
  },
  reviewFieldLabel: {
    color: "rgba(203,213,225,0.52)",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  reviewInput: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(2,6,23,0.3)",
    color: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    fontWeight: "800",
  },
  reviewInputMultiline: {
    minHeight: 74,
    textAlignVertical: "top",
  },
  reviewActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },
  reviewCancel: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  reviewCancelText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
  },
  reviewConfirm: {
    flex: 1.35,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    backgroundColor: ACCENT,
  },
  reviewConfirmText: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "900",
  },
});

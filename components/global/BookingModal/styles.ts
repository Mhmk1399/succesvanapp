import { StyleSheet, Platform } from "react-native";
import { height, ACCENT } from "./constants";

export const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.92,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
    borderColor: "rgba(254,154,0,0.2)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  blurContainer: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.92)",
    paddingTop: 6,
  },
  handleArea: {
    paddingVertical: 8,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(148,163,184,0.7)",
    borderRadius: 999,
    marginBottom: 6,
  },
  vanImageCard: {
    height: 130,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(157, 154, 148, 0.11)",
  },
  vanImage: {
    width: "100%",
    height: "100%",
  },
  vanImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  vanImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: "space-between",
  },
  vanImageTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
  },
  vanImageSpecs: {
    flexDirection: "row",
    gap: 12,
  },
  vanImageSpec: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15,23,42,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  vanImageSpecText: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "600",
  },
  vanImagePrice: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  vanImagePriceValue: {
    fontSize: 28,
    fontWeight: "900",
    color: ACCENT,
  },
  vanImagePriceUnit: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "600",
  },
  header: {
    paddingHorizontal: 14,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(254,154,0,0.08)",
    padding: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.2)",
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(254,154,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(197, 216, 199, 0.71)",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#f9fafb",
  },
  titleVan: {
    fontSize: 17,
    fontWeight: "900",
    color: ACCENT,
  },
  form: {
    paddingHorizontal: 14,
    paddingBottom: 70,
  },
  inputGroup: {
    marginBottom: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 7,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  inputFocused: {
    backgroundColor: "rgba(254,154,0,0.08)",
    borderColor: ACCENT,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  input: {
    flex: 1,
    color: "#f9fafb",
    fontSize: 13,
    paddingVertical: 7,
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 6,
    marginBottom: 8,
  },
  infoText: {
    color: "#fbbf24",
    fontSize: 11,
    marginBottom: 6,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  half: {
    flex: 1,
  },
  submitBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f8f9f7ff",
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  accountSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  accountSummaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.12)",
  },
  accountSummaryText: {
    flex: 1,
    minWidth: 0,
  },
  accountSummaryLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  accountSummaryName: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 1,
  },
  accountSummaryEmail: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  accountLockedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: "rgba(15,23,42,0.55)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
  },
  accountLockedText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
  },
  addonCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  addonCardSelected: {
    backgroundColor: "rgba(254,154,0,0.1)",
    borderColor: ACCENT,
  },
  addonInfo: {
    flex: 1,
  },
  addonName: {
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: "700",
  },
  addonDesc: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
  },
  addonPrice: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 22,
  },
  modalContent: {
    width: "90%",
    maxHeight: "70%",
    backgroundColor: "rgba(15,23,42,0.98)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  calendarModalBox: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.42,
        shadowRadius: 28,
      },
      android: {
        elevation: 18,
      },
    }),
  },
  timeModalBox: {
    width: "90%",
    maxWidth: 400,
    maxHeight: height * 0.7,
    backgroundColor: "rgba(15,23,42,0.98)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "rgba(254,154,0,0.3)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  timeModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f9fafb",
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modalItemSelected: {
    backgroundColor: "rgba(254,154,0,0.15)",
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
  },
  topSection: {
    marginHorizontal: 14,
    marginBottom: 12,
  },
  summaryCard: {
    marginTop: 10,
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.2)",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCol: {
    flex: 1,
    gap: 8,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(254,154,0,0.2)",
  },
  summaryItemCompact: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  summaryIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(254,154,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabelCompact: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValueCompact: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f9fafb",
  },
  summaryTimeText: {
    fontSize: 12,
    fontWeight: "600",
    color: ACCENT,
    marginTop: 2,
  },
  fixedBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(2,6,23,0.94)",
    borderTopWidth: 2,
    borderTopColor: "rgba(3, 254, 20, 0.8)",
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  priceBreakdown: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(231, 9, 9, 0.1)",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9ca3af",
  },
  breakdownValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#e5e7eb",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#efefefff",
  },
  priceValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#22c55e",
  },
  termsContainer: {
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox2: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 18,
  },
  gearSelector: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(15,23,42,0.36)",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  gearOption: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  gearOptionSelected: {
    backgroundColor: "rgba(254,154,0,0.14)",
    borderColor: "rgba(254,154,0,0.55)",
  },
  gearIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  gearIconSelected: {
    backgroundColor: "rgba(254,154,0,0.16)",
  },
  gearCopy: {
    flex: 1,
    minWidth: 0,
  },
  gearTitle: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "900",
  },
  gearTitleSelected: {
    color: ACCENT,
  },
  gearMeta: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  gearPricePill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginTop: 2,
  },
  gearPriceText: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "800",
  },
  termsLink: {
    color: ACCENT,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  termsHint: {
    fontSize: 11,
    color: "#ef4444",
    marginTop: 8,
    marginLeft: 36,
  },
  timePickerOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 22,
    backgroundColor: "rgba(0,4,10,0.8)",
  },

  timePickerSheet: {
    width: "100%",
    maxWidth: 370,
    maxHeight: "88%",
    minHeight: 530,
    paddingTop: 11,
    paddingHorizontal: 15,
    paddingBottom: 12,
    overflow: "hidden",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.42)",
    backgroundColor: "#0b1421",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 18,
  },

  timePickerSheetReturn: {
    borderColor: "rgba(56,189,248,0.5)",
    shadowColor: "#38bdf8",
  },

  timePickerGlow: {
    position: "absolute",
    top: -92,
    left: 26,
    right: 26,
    height: 140,
    borderRadius: 90,
    backgroundColor: "rgba(254,154,0,0.065)",
  },

  timePickerGlowReturn: {
    backgroundColor: "rgba(56,189,248,0.095)",
  },

  timePickerHandle: {
    width: 50,
    height: 4,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 12,
    backgroundColor: "rgba(203,213,225,0.62)",
  },

  timePickerHeader: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  timePickerHeaderCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },

  timePickerTitle: {
    color: "#f8fafc",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: 0,
  },

  timePickerSubtitle: {
    color: "rgba(203,213,225,0.58)",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: 3,
  },

  timePickerClose: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.075)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.34)",
  },

  timePickerCloseReturn: {
    borderColor: "rgba(56,189,248,0.36)",
  },

  timePickerPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.95 }],
  },

  timePickerPhaseRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 12,
  },

  timePickerPhasePill: {
    flex: 1,
    minWidth: 0,
    minHeight: 34,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.052)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
  },

  timePickerPhasePillActive: {
    backgroundColor: "rgba(254,154,0,0.13)",
    borderColor: "rgba(254,154,0,0.46)",
  },

  timePickerPhasePillReturnActive: {
    backgroundColor: "rgba(56,189,248,0.14)",
    borderColor: "rgba(56,189,248,0.52)",
  },

  timePickerPhaseText: {
    color: "rgba(226,232,240,0.58)",
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "900",
  },

  timePickerPhaseTextActive: {
    color: "#fed7aa",
  },

  timePickerPhaseTextReturn: {
    color: "#bae6fd",
  },

  timePickerPhaseConnector: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.84)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },

  timePickerAnimatedPane: {
    flexShrink: 1,
  },

  timePickerEmpty: {
    minHeight: 350,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  timePickerEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
    backgroundColor: "rgba(254,154,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.2)",
  },

  timePickerEmptyTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
  },

  timePickerEmptyText: {
    color: "rgba(203,213,225,0.5)",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    fontWeight: "600",
    marginTop: 5,
  },

  timePickerContextRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  timePickerContextCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(130,157,190,0.13)",
  },

  timePickerContextIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.13)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.18)",
  },

  timePickerContextIconReturn: {
    backgroundColor: "rgba(56,189,248,0.13)",
    borderColor: "rgba(56,189,248,0.2)",
  },

  timePickerContextCopy: {
    flex: 1,
    minWidth: 0,
  },

  timePickerContextValue: {
    color: "#eef2f7",
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "800",
  },

  timePickerContextLabel: {
    color: "rgba(203,213,225,0.45)",
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: "600",
    marginTop: 2,
  },

  timePickerLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 9,
    paddingLeft: 2,
  },

  timePickerLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22d37f",
    shadowColor: "#22d37f",
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },

  timePickerLegendText: {
    color: "rgba(226,232,240,0.58)",
    fontSize: 9,
    fontWeight: "700",
  },

  timePickerScroll: {
    flexGrow: 0,
    maxHeight: 330,
  },

  timePickerScrollContent: {
    paddingBottom: 6,
  },

  timePickerGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  timePickerCell: {
    width: "31.8%",
    minHeight: 42,
    marginBottom: 7,
  },

  timePickerSlot: {
    minHeight: 37,
    paddingHorizontal: 6,
    overflow: "hidden",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(137,159,188,0.15)",
  },

  timePickerSlotSelected: {
    borderColor: "rgba(255,209,117,0.78)",
    shadowColor: ACCENT,
    shadowOpacity: 0.34,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },

  timePickerSlotReturnSelected: {
    borderColor: "rgba(125,211,252,0.82)",
    shadowColor: "#38bdf8",
  },

  timePickerSlotDisabled: {
    opacity: 0.34,
  },

  timePickerSlotPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.97 }],
  },

  timePickerSlotDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  timePickerSlotText: {
    color: "#dce3ed",
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "800",
  },

  timePickerSlotTextSelected: {
    color: "#101723",
  },

  timePickerExtensionPrice: {
    color: "#fbbf24",
    fontSize: 7.5,
    lineHeight: 10,
    textAlign: "center",
    fontWeight: "800",
    marginTop: 2,
  },

  timePickerExtensionPriceSelected: {
    color: "#ffe9b5",
  },

  timePickerConfirm: {
    overflow: "hidden",
    borderRadius: 10,
    marginTop: 4,
    shadowColor: ACCENT,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },

  timePickerConfirmReturn: {
    shadowColor: "#38bdf8",
  },

  timePickerConfirmPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },

  timePickerConfirmGradient: {
    minHeight: 43,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  timePickerConfirmText: {
    color: "#101723",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
  },

  timePickerConfirmArrow: {
    position: "absolute",
    right: 8,
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#142033",
  },

  timePickerSecureRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingTop: 7,
  },

  timePickerSecureText: {
    color: "rgba(203,213,225,0.42)",
    fontSize: 7.5,
    fontWeight: "700",
  },
});

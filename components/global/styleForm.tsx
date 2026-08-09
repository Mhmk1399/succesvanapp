import { Dimensions, Platform, StyleSheet } from "react-native";
const ACCENT = "#fe9a00";
const DARK = "#0f172a";

const { height, width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  mainButton: {
     borderRadius: 22,
     overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,184,61,0.56)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.42,
        shadowRadius: 18,
      },
      android: {
        elevation: 9,
      },
    }),
  },
  mainButtonPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  mainButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 62,
    paddingVertical: 7,
    paddingLeft: 12,
    paddingRight: 10,
    position: "relative",
    overflow: "hidden",
  },
  shineEffect: {
    position: "absolute",
    top: -50,
    left: -200,
    width: 300,
    height: 200,
    zIndex: 1,
    transform: [{ rotate: "25deg" }],
  },
  mainButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  mainButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  mainButtonText: {
    color: DARK,
    fontSize: 17,
    fontWeight: "900",
  },
  mainButtonRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,23,42,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  mainButtonSubText: {
    color: DARK,
    fontSize: 10,
    fontWeight: "800",
  },

  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.9,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
    borderBottomWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  blurContainer: {
    flex: 1,
    backgroundColor: "rgba(2, 10, 46, 0.96)",
  },
  handleArea: {
    paddingVertical: 7,
    alignItems: "center",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.7)",
  },
});

export const sheetStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 26,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 2,
  },
  sheetTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "900",
  },
  sheetSubtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    }),
  },

  /* Voice button */
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  voiceButtonActive: {
    borderColor: ACCENT,
    backgroundColor: "rgba(254,154,0,0.12)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
    inlineAlertContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      elevation: 99999,
      alignItems: "center",
      justifyContent: "center",
    },
    inlineAlertBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    inlineAlertBox: {
      width: "92%",
      maxWidth: 520,
      backgroundColor: "#0b1220",
      borderRadius: 12,
      padding: 18,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
    },
    inlineAlertTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },
    inlineAlertMessage: { color: "#cbd5e1", marginBottom: 14 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  voiceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  voiceIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceTitle: {
    color: "#f9fafb",
    fontSize: 13,
    fontWeight: "800",
  },
  voiceSubtitle: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
  },
  waveWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    paddingLeft: 12,
  },
  waveBar: {
    width: 3,
    borderRadius: 999,
    backgroundColor: ACCENT,
  },

  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoText: {
    color: "#fbbf24",
    fontSize: 11,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  half: {
    flex: 1,
  },

  inputGroup: {
    marginBottom: 8,
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
  inputWrapperFocused: {
    borderColor: ACCENT,
    backgroundColor: "rgba(254,154,0,0.08)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  inputIcon: {
    marginLeft: 2,
  },
  input: {
    flex: 1,
    color: "#f9fafb",
    fontSize: 13,
    paddingVertical: 7,
    fontWeight: "500",
  },

  buttonsRow: {
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
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
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitGradient: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitText: {
    color: DARK,
    fontSize: 14,
    fontWeight: "800",
  },

  /* Select modals */
  selectOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 22,
  },
  selectBox: {
    width: width - 60,
    maxHeight: height * 0.6,
    backgroundColor: "rgba(15,23,42,0.98)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  selectTitle: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  selectItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  selectItemActive: {
    backgroundColor: "rgba(254,154,0,0.18)",
  },
  selectItemText: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
  },
  timeModalBox: {
    width: width - 40,
    maxHeight: height * 0.7,
    backgroundColor: "rgba(15,23,42,0.98)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  calendarModalBox: {
    width: Math.min(width - 28, 430),
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
  timeModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  dateRangeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 13,
    padding: 12,
    gap: 10,
  },

   timeOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 24,
    backgroundColor: "rgba(1,5,11,0.78)",
  },

  timeSheet: {
    width: "100%",
    maxWidth: 370,
    minHeight: 520,
    paddingTop: 11,
    paddingHorizontal: 15,
    paddingBottom: 12,
    borderRadius: 23,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.42)",
    backgroundColor: "#0b1421",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 18,
  },

  timeSheetReturn: {
    borderColor: "rgba(56,189,248,0.5)",
    shadowColor: "#38bdf8",
  },

  timeSheetTopGlow: {
    position: "absolute",
    top: -90,
    left: 20,
    right: 20,
    height: 130,
    borderRadius: 90,
    backgroundColor: "rgba(254,154,0,0.07)",
  },

  timeSheetTopGlowReturn: {
    backgroundColor: "rgba(56,189,248,0.095)",
  },

  timeHandle: {
    width: 50,
    height: 4,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 12,
    backgroundColor: "rgba(203,213,225,0.62)",
  },

  timeHeader: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  timeHeaderCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },

  timeTitle: {
    color: "#f8fafc",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: 0,
  },

  timeSubtitle: {
    color: "rgba(203,213,225,0.58)",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: 3,
  },

  timeCloseButton: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.075)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.34)",
  },

  timeCloseButtonReturn: {
    borderColor: "rgba(56,189,248,0.36)",
  },

  timePressed: {
    opacity: 0.72,
    transform: [{ scale: 0.95 }],
  },

  timePhaseRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 12,
  },

  timePhasePill: {
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

  timePhasePillActive: {
    backgroundColor: "rgba(254,154,0,0.13)",
    borderColor: "rgba(254,154,0,0.46)",
  },

  timePhasePillReturnActive: {
    backgroundColor: "rgba(56,189,248,0.14)",
    borderColor: "rgba(56,189,248,0.52)",
  },

  timePhaseText: {
    color: "rgba(226,232,240,0.58)",
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "900",
  },

  timePhaseTextActive: {
    color: "#fed7aa",
  },

  timePhaseTextReturn: {
    color: "#bae6fd",
  },

  timePhaseConnector: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.84)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },

  timeAnimatedPane: {
    flexShrink: 1,
  },

  timeLoading: {
    minHeight: 330,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  timeLoadingText: {
    color: "rgba(226,232,240,0.62)",
    fontSize: 12,
    fontWeight: "700",
  },

  timeContextRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  timeContextCard: {
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

  timeContextIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.13)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.18)",
  },

  timeContextIconReturn: {
    backgroundColor: "rgba(56,189,248,0.13)",
    borderColor: "rgba(56,189,248,0.2)",
  },

  timeContextCopy: {
    flex: 1,
    minWidth: 0,
  },

  timeContextValue: {
    color: "#eef2f7",
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "800",
  },

  timeContextLabel: {
    color: "rgba(203,213,225,0.45)",
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: "600",
    marginTop: 2,
  },

  timeLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 9,
    paddingLeft: 2,
  },

  timeAvailableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22d37f",
    shadowColor: "#22d37f",
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },

  timeLegendText: {
    color: "rgba(226,232,240,0.58)",
    fontSize: 9,
    fontWeight: "700",
  },

  timeSlotsScroll: {
    flexGrow: 0,
    maxHeight: 320,
  },

  timeSlotsContent: {
    paddingBottom: 6,
  },

  timeGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  timeCell: {
    width: "31.8%",
    minHeight: 42,
    marginBottom: 7,
  },

  timeSlot: {
    minHeight: 37,
    paddingHorizontal: 6,
    borderRadius: 10,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(137,159,188,0.15)",
  },

  timeSlotSelected: {
    borderColor: "rgba(255,209,117,0.78)",
    shadowColor: ACCENT,
    shadowOpacity: 0.34,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },

  timeSlotReturnSelected: {
    borderColor: "rgba(125,211,252,0.82)",
    shadowColor: "#38bdf8",
  },

  timeSlotDisabled: {
    opacity: 0.34,
  },

  timeSlotPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.97 }],
  },

  timeSlotDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  timeSlotText: {
    color: "#dce3ed",
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "800",
  },

  timeSlotTextSelected: {
    color: "#101723",
  },

  timeExtensionPrice: {
    color: "#fbbf24",
    fontSize: 7.5,
    lineHeight: 10,
    textAlign: "center",
    fontWeight: "800",
    marginTop: 2,
  },

  timeExtensionPriceSelected: {
    color: "#ffe9b5",
  },

  timeConfirmButton: {
    overflow: "hidden",
    borderRadius: 10,
    marginTop: 4,
    shadowColor: ACCENT,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },

  timeConfirmReturn: {
    shadowColor: "#38bdf8",
  },

  timeConfirmPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },

  timeConfirmGradient: {
    minHeight: 43,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  timeConfirmText: {
    color: "#101723",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
  },

  timeConfirmArrow: {
    position: "absolute",
    right: 8,
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#142033",
  },

  timeSecureRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingTop: 7,
  },

  timeSecureText: {
    color: "rgba(203,213,225,0.42)",
    fontSize: 7.5,
    fontWeight: "700",
  },
});

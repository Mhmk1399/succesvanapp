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
});

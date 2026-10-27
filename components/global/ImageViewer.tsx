import { useToast } from "@/components/global/AppToast";
import { isPdfDocument } from "@/utils/documentPreview";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ImageFile = { uri: string; title: string; mimeType?: string };
type ViewerContextValue = { openImage: (file: ImageFile) => void; openDocument: (file: ImageFile) => void };
const ViewerContext = createContext<ViewerContextValue | null>(null);

export function useImageViewer() {
  const context = useContext(ViewerContext);
  if (!context) throw new Error("useImageViewer requires ImageViewerProvider");
  return context;
}

export function ImageViewerProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [file, setFile] = useState<ImageFile | null>(null);
  const openImage = useCallback((next: ImageFile) => {
    if (next.uri.trim()) setFile(next);
  }, []);
  const openDocument = useCallback((next: ImageFile) => {
    if (isPdfDocument(next.uri, next.mimeType)) {
      void Linking.openURL(next.uri).catch(() => showToast({ type: "error", title: "Could not open file", message: "Please try again later." }));
    } else {
      openImage(next);
    }
  }, [openImage, showToast]);
  const value = useMemo(() => ({ openImage, openDocument }), [openImage, openDocument]);
  return <ViewerContext.Provider value={value}>
    {children}
    <FullScreenImageViewer file={file} onClose={() => setFile(null)} />
  </ViewerContext.Provider>;
}

function FullScreenImageViewer({ file, onClose }: { file: ImageFile | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  React.useEffect(() => {
    setZoom(1);
    setLoading(true);
    setFailed(false);
    setAttempt(0);
  }, [file?.uri]);

  React.useEffect(() => {
    if (Platform.OS !== "web" || !file || typeof document === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopPropagation(); onClose(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [file, onClose]);

  return <Modal visible={Boolean(file)} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
    <View accessibilityViewIsModal style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>DOCUMENT PREVIEW</Text>
          <Text style={styles.title} numberOfLines={2}>{file?.title || "Image"}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close image" onPress={onClose} style={styles.close}>
          <Ionicons name="close" size={23} color="#fff" />
        </Pressable>
      </View>
      <View style={styles.stage} onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((prev) => prev.width === width && prev.height === height ? prev : { width, height });
      }}>
        {file && size.width > 0 && size.height > 0 && !failed ? <ScrollView maximumZoomScale={1} minimumZoomScale={1} contentContainerStyle={styles.center}>
          <ScrollView horizontal contentContainerStyle={styles.center}>
            <Image key={`${file.uri}-${attempt}`} source={{ uri: file.uri }} contentFit="contain" cachePolicy="none" accessibilityLabel={file.title}
              style={{ width: size.width * zoom, height: size.height * zoom }}
              onLoadStart={() => setLoading(true)} onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />
          </ScrollView>
        </ScrollView> : null}
        {loading && !failed ? <View pointerEvents="none" style={styles.overlay}><ActivityIndicator size="large" color="#fe9a00" /><Text style={styles.status}>Loading image...</Text></View> : null}
        {failed ? <View style={styles.overlay}><Ionicons name="image-outline" size={36} color="#94a3b8" /><Text style={styles.errorTitle}>Image unavailable</Text><Text style={styles.status}>Check your connection and try again.</Text><Pressable accessibilityRole="button" onPress={() => { setFailed(false); setLoading(true); setAttempt((value) => value + 1); }} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable></View> : null}
      </View>
      <View style={styles.toolbar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" disabled={zoom <= 1 || failed} onPress={() => setZoom((value) => Math.max(1, value - 0.5))} style={[styles.tool, (zoom <= 1 || failed) && styles.disabled]}><Ionicons name="remove" size={22} color="#fff" /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Reset zoom" onPress={() => setZoom(1)} style={styles.zoomLabel}><Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" disabled={zoom >= 3 || failed} onPress={() => setZoom((value) => Math.min(3, value + 0.5))} style={[styles.tool, (zoom >= 3 || failed) && styles.disabled]}><Ionicons name="add" size={22} color="#fff" /></Pressable>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#080d16" },
  header: { minHeight: 68, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.09)" },
  heading: { flex: 1, minWidth: 0 },
  eyebrow: { color: "#fe9a00", fontSize: 10, fontWeight: "800", marginBottom: 4 },
  title: { color: "#f8fafc", fontSize: 16, lineHeight: 21, fontWeight: "700" },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#222a36", alignItems: "center", justifyContent: "center" },
  stage: { flex: 1, minHeight: 0, backgroundColor: "#03060a" },
  center: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  status: { color: "#a9b5c5", fontSize: 13, textAlign: "center" },
  errorTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  retry: { minHeight: 44, paddingHorizontal: 20, justifyContent: "center", borderRadius: 8, backgroundColor: "#fe9a00" },
  retryText: { color: "#111827", fontWeight: "700" },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 12 },
  tool: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#222a36" },
  disabled: { opacity: 0.4 },
  zoomLabel: { width: 68, height: 44, justifyContent: "center", alignItems: "center" },
  zoomText: { color: "#e2e8f0", fontWeight: "700", fontSize: 13 },
});

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { normalizeUrl } from "@/services/apiClient";
import SecurityCheckView from "./SecurityCheckView";

type Props = { onTokenChange: (token: string | null) => void; resetKey: number };
type Status = "loading" | "ready" | "verified" | "error";

export default function SecurityCheck({ onTokenChange, resetKey }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>("loading");
  const url = useMemo(() => {
    try {
      const authUrl = process.env.EXPO_PUBLIC_AUTH_API;
      if (!authUrl) return null;
      const api = new URL(normalizeUrl(authUrl));
      if (api.protocol !== "http:" && api.protocol !== "https:") return null;
      if (!__DEV__ && api.protocol !== "https:") return null;
      const pageUrl = `${api.origin}/api/mobile/security-check`;
      if (Platform.OS === "web" && typeof window !== "undefined") {
        return `${pageUrl}?parentOrigin=${encodeURIComponent(window.location.origin)}`;
      }
      return pageUrl;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setStatus("loading");
    onTokenChange(null);
    if (!url) {
      setStatus("error");
      return;
    }
    const timer = setTimeout(() => setStatus((current) => current === "loading" ? "error" : current), 20000);
    return () => clearTimeout(timer);
  }, [attempt, onTokenChange, resetKey, url]);

  const handleMessage = useCallback((message: unknown) => {
    if (!message || typeof message !== "object") return;
    const payload = message as { source?: unknown; type?: unknown; token?: unknown };
    if (payload.source !== "svh-security-check") return;
    if (payload.type === "verified" && typeof payload.token === "string" && payload.token.length > 0 && payload.token.length <= 2048) {
      setStatus("verified");
      onTokenChange(payload.token);
    } else if (payload.type === "ready") {
      setStatus((current) => current === "verified" ? current : "ready");
    } else if (payload.type === "expired" || payload.type === "error") {
      setStatus("error");
      onTokenChange(null);
    }
  }, [onTokenChange]);

  const handleError = useCallback(() => {
    setStatus("error");
    onTokenChange(null);
  }, [onTokenChange]);

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#ffb83d" />
        <Text style={styles.title}>Security check</Text>
        {status === "loading" && <ActivityIndicator size="small" color="#ffb83d" />}
        {status === "verified" && <Ionicons name="checkmark-circle" size={16} color="#4ade80" />}
      </View>
      {url && <SecurityCheckView key={`${resetKey}-${attempt}`} url={url} onMessage={handleMessage} onError={handleError} />}
      {status === "error" && (
        <View style={styles.errorRow}>
          <Text style={styles.error}>Security check unavailable. Check your connection and try again.</Text>
          <Pressable accessibilityRole="button" onPress={() => setAttempt((current) => current + 1)} style={styles.retry}>
            <Ionicons name="refresh" size={14} color="#ffb83d" />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14, borderWidth: 1, borderColor: "rgba(148,163,184,0.2)", borderRadius: 8, backgroundColor: "#0b1524", overflow: "hidden" },
  heading: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 10 },
  title: { flex: 1, color: "#e8edf5", fontSize: 12, fontWeight: "700" },
  errorRow: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  error: { color: "#fecaca", fontSize: 12, lineHeight: 17 },
  retry: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 5 },
  retryText: { color: "#ffb83d", fontSize: 12, fontWeight: "700" },
});

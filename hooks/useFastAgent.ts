import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FastPhase =
  | "ask_needs"
  | "show_suggestions"
  | "collect_booking"
  | "select_gear"
  | "select_addons"
  | "show_receipt"
  | "verify_phone"
  | "complete";

export interface CategorySuggestion {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  fuel: string;
  gear:
    | {
        availableTypes: string[];
        automaticExtraCost?: number;
      }
    | string;
  seats: number;
  doors: number;
  pricingTiers: Array<{
    minDays: number;
    maxDays: number;
    pricePerDay: number;
  }>;
  extrahoursRate?: number;
  matchScore: number;
  matchReason: string;
}

export interface AddOnOption {
  _id: string;
  name: string;
  description?: string;
  pricingType: "flat" | "tiered";
  flatPrice?: {
    amount: number;
    isPerDay: boolean;
  };
  tieredPrice?: {
    isPerDay: boolean;
    tiers: Array<{
      minDays: number;
      maxDays: number;
      price: number;
    }>;
  };
}

export interface SelectedAddOn {
  addOnId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface FastAgentState {
  phase: FastPhase;
  needs?: {
    purpose: string;
    description: string;
    size: "small" | "medium" | "large";
  };
  suggestions?: CategorySuggestion[];
  selectedCategory?: CategorySuggestion;
  availableAddOns?: AddOnOption[];
  booking: {
    officeId?: string;
    officeName?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    driverAge?: number;
    phoneNumber?: string;
    gearType?: "manual" | "automatic";
    // Price calculation fields
    totalDays?: number;
    extraHours?: number;
    pricePerDay?: number;
    extraHoursRate?: number;
    totalPrice?: number;
    priceBreakdown?: string;
    // Add-ons
    selectedAddOns?: SelectedAddOn[];
    addOnsTotal?: number;
  };
  userId?: string;
  userToken?: string;
  isNewUser?: boolean;
  verificationSent?: boolean;
  reservationId?: string;
}

export interface Office {
  _id: string;
  name: string;
  address: string;
}

export interface FastAgentResponse {
  message: string;
  audio?: string;
  transcribedText?: string; // The transcribed text from voice input
  state: FastAgentState;
  showSuggestions: boolean;
  needsPhoneInput: boolean;
  needsCodeInput: boolean;
  needsBookingForm: boolean;
  needsAddOns: boolean;
  needsReceipt: boolean;
  isComplete: boolean;
  error?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFastAgent() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [agentState, setAgentState] = useState<FastAgentState>({
    phase: "ask_needs",
    booking: { startTime: "10:00", endTime: "10:00" },
  });
  const [offices, setOffices] = useState<Office[]>([]);

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const stateRef = useRef<FastAgentState>(agentState);

  // Keep ref in sync
  useEffect(() => {
    stateRef.current = agentState;
  }, [agentState]);

  // Fetch offices on mount
  useEffect(() => {
    fetchOffices();
    setupAudio();
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error("Audio setup error:", error);
    }
  };

  const fetchOffices = async () => {
    try {
      const apiUrl =
        process.env.EXPO_PUBLIC_FAST_AGENT_API ||
        "http://192.168.100.3:3000/api/fast-agent";
      
      console.log("📍 Fetching offices from:", apiUrl);
      
      const res = await fetch(apiUrl);
      
      if (!res.ok) {
        console.warn("⚠️ Offices fetch failed:", res.status);
        return;
      }
      
      const textResponse = await res.text();
      
      if (!textResponse) {
        console.warn("⚠️ Empty response when fetching offices");
        return;
      }
      
      const data = JSON.parse(textResponse);
      
      if (data.success && data.data?.offices) {
        setOffices(data.data.offices);
        console.log("✅ Loaded offices:", data.data.offices.length);
      }
    } catch (error) {
      console.error("❌ Failed to fetch offices:", error);
      // Set empty array as fallback
      setOffices([]);
    }
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      console.log("Starting recording...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      console.log("Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Recording Error", "Failed to start recording");
    }
  }, []);

  // Stop recording and get audio data
  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) return null;

      console.log("Stopping recording...");
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (!uri) return null;

      // Read file as base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data:audio/x-m4a;base64, prefix
          const base64Audio = base64.split(",")[1];
          resolve(base64Audio);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Failed to stop recording:", error);
      setIsRecording(false);
      return null;
    }
  }, []);

  // Play audio
  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      // Stop any existing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${base64Audio}` },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsPlaying(false);
    }
  }, []);

  // Stop audio
  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  // Send message to agent (text or voice)
  const sendMessage = useCallback(
    async (
      message: string,
      action?: string,
      audioBase64?: string
    ): Promise<FastAgentResponse | null> => {
      setIsLoading(true);
      await stopAudio();

      // Add user message (except for start and voice_input which will be replaced with transcription)
      if (message !== "start" && message !== "voice_input") {
        setMessages((prev) => [...prev, { role: "user", content: message }]);
      }

      try {
        const apiUrl =
          process.env.EXPO_PUBLIC_FAST_AGENT_API ||
          "http://192.168.100.3:3000/api/fast-agent";

        console.log("📤 Sending to API:", apiUrl);
        console.log("📝 Payload:", { message, action, hasAudio: !!audioBase64 });

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            state: stateRef.current,
            action,
            audio: audioBase64,
            includeAudio: true,
          }),
        });

        console.log("📥 Response status:", res.status);

        // Check if response is OK
        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ API Error Response:", errorText);
          throw new Error(`API Error: ${res.status} - ${errorText || "Unknown error"}`);
        }

        // Check if response has content
        const textResponse = await res.text();
        console.log("📄 Raw response:", textResponse.substring(0, 200));

        if (!textResponse) {
          throw new Error("Empty response from server");
        }

        // Try to parse JSON
        let data;
        try {
          data = JSON.parse(textResponse);
        } catch (parseError) {
          console.error("❌ JSON Parse Error:", parseError);
          console.error("📄 Response text:", textResponse);
          throw new Error("Invalid JSON response from server");
        }

        console.log("✅ Parsed data:", { success: data.success, phase: data.data?.state?.phase });

        if (!data.success) {
          throw new Error(data.error || "Agent failed");
        }

        const response: FastAgentResponse = data.data;

        // If this was a voice input, add the transcribed text as user message
        if (message === "voice_input" && response.transcribedText) {
          console.log("📝 Transcribed text:", response.transcribedText);
          setMessages((prev) => [
            ...prev,
            { role: "user", content: response.transcribedText },
          ]);
        }

        // Update state immediately in ref to prevent loops
        stateRef.current = response.state;
        setAgentState(response.state);

        // Add assistant message
        if (response.message) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: response.message },
          ]);
        }

        // Play audio
        if (response.audio) {
          await playAudio(response.audio);
        }

        return response;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Agent error:", error);
        Alert.alert("Error", message || "Something went wrong");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [playAudio, stopAudio]
  );

  // Send voice message
  const sendVoiceMessage = useCallback(
    async (audioBase64: string, action?: string) => {
      return sendMessage("voice_input", action, audioBase64);
    },
    [sendMessage]
  );

  // Select a category
  const selectCategory = useCallback(
    async (categoryId: string) => {
      return sendMessage(categoryId, "select_category");
    },
    [sendMessage]
  );

  // Submit booking form
  const submitBooking = useCallback(
    async (booking: {
      officeId: string;
      startDate: string;
      endDate: string;
      driverAge: number;
    }) => {
      return sendMessage(JSON.stringify(booking), "submit_booking");
    },
    [sendMessage]
  );

  // Voice booking - parse natural language booking details
  const voiceBooking = useCallback(
    async (voiceInput: string) => {
      return sendMessage(voiceInput, "voice_booking");
    },
    [sendMessage]
  );

  // Confirm add-ons
  const confirmAddOns = useCallback(
    async (selectedAddOns: SelectedAddOn[]) => {
      return sendMessage(JSON.stringify({ selectedAddOns }), "confirm_addons");
    },
    [sendMessage]
  );

  // Skip add-ons
  const skipAddOns = useCallback(async () => {
    return sendMessage("skip", "skip_addons");
  }, [sendMessage]);

  // Select gear type
  const selectGear = useCallback(
    (gearType: "manual" | "automatic", gearExtraCost: number) => {
      setAgentState((prev) => ({
        ...prev,
        phase: "select_addons",
        booking: {
          ...prev.booking,
          gearType,
          totalPrice: (prev.booking.totalPrice || 0) + gearExtraCost,
        },
      }));
    },
    []
  );

  // Confirm receipt
  const confirmReceipt = useCallback(async () => {
    return sendMessage("confirm", "confirm_receipt");
  }, [sendMessage]);

  // Send phone verification code
  const sendCode = useCallback(
    async (phoneNumber: string) => {
      return sendMessage(phoneNumber, "send_code");
    },
    [sendMessage]
  );

  // Verify code
  const verifyCode = useCallback(
    async (code: string) => {
      return sendMessage(code, "verify_code");
    },
    [sendMessage]
  );

  // Reset
  const reset = useCallback(async () => {
    await stopAudio();
    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }
    setIsRecording(false);
    setMessages([]);
    setAgentState({
      phase: "ask_needs",
      booking: { startTime: "10:00", endTime: "10:00" },
    });
  }, [stopAudio]);

  return {
    // State
    isLoading,
    isRecording,
    isPlaying,
    messages,
    agentState,
    offices,

    // Actions
    sendMessage,
    sendVoiceMessage,
    startRecording,
    stopRecording,
    selectCategory,
    submitBooking,
    voiceBooking,
    confirmAddOns,
    skipAddOns,
    selectGear,
    confirmReceipt,
    sendCode,
    verifyCode,
    reset,
    stopAudio,
  };
}

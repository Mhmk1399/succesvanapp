# AI Voice Booking Implementation

## 🎯 Overview
Complete AI-powered voice booking system for your React Native app that allows users to book vans through natural conversation.

## 📁 Files Created

### 1. **`hooks/useFastAgent.ts`**
React Native hook for managing AI agent state and interactions.

**Features:**
- Voice recording with `expo-av`
- Audio playback of AI responses
- State management for 8-phase booking flow
- API communication with your fast-agent endpoint

### 2. **`components/global/AIBookingFlow.tsx`**
Full-screen modal that handles the entire AI booking experience.

**Phases Handled:**
1. **ask_needs** - AI asks about rental requirements
2. **show_suggestions** - Display matched vans using VanList
3. **collect_booking** - Collect dates, office, driver age
4. **select_gear** - Manual vs Automatic transmission
5. **select_addons** - Optional extras
6. **show_receipt** - Price breakdown and confirmation
7. **verify_phone** - SMS verification for new users
8. **complete** - Success confirmation

### 3. **Updated VoiceAIButton**
Now opens the AI Booking Flow instead of just showing animation.

---

## 🔧 Setup Instructions

### Step 1: Install Dependencies

```bash
# If not already installed
npx expo install expo-av
```

### Step 2: Add Environment Variable

Add to your `.env` file:

```env
EXPO_PUBLIC_FAST_AGENT_API=https://yourapp.com/api/fast-agent
```

Or update `app.json`:

```json
{
  "expo": {
    "extra": {
      "FAST_AGENT_API": "https://yourapp.com/api/fast-agent"
    }
  }
}
```

### Step 3: Request Permissions

Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-av",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone for voice booking."
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "We need access to your microphone for voice booking."
      }
    },
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO"
      ]
    }
  }
}
```

---

## 🎬 How It Works

### User Flow

```
1. User taps "Book with AI Assistant" button
   ↓
2. AI Booking Flow modal opens
   ↓
3. AI asks: "What do you need?"
   ↓
4. User can:
   - Tap mic to speak: "I need a large van for moving tomorrow"
   - Or type in chat
   ↓
5. AI suggests matched vans with reasons
   ↓
6. User selects a van
   ↓
7. AI collects: dates, times, office, driver age
   ↓
8. User selects gear type (manual/automatic)
   ↓
9. AI shows add-ons (optional)
   ↓
10. AI displays receipt with price breakdown
    ↓
11. User confirms
    ↓
12. Phone verification (if new user)
    ↓
13. Booking complete! 🎉
```

### API Integration

The hook sends requests to your `/api/fast-agent` endpoint:

```typescript
// POST /api/fast-agent
{
  message: "I need a van for moving",
  state: {
    phase: "ask_needs",
    booking: { ... }
  },
  action: "voice_booking",
  audio: "base64AudioString", // Optional
  includeAudio: true
}

// Response
{
  success: true,
  data: {
    message: "Great! I found 3 vans perfect for moving...",
    audio: "base64Mp3",
    state: {
      phase: "show_suggestions",
      suggestions: [...],
      booking: { ... }
    },
    showSuggestions: true,
    needsPhoneInput: false,
    ...
  }
}
```

---

## 🎨 Customization

### Change Colors

In `AIBookingFlow.tsx`:

```typescript
const ACCENT = "#fe9a00"; // Your brand color
const DARK = "#0f172a";   // Background color
```

### Modify Phases

Add custom phases in `useFastAgent.ts`:

```typescript
export type FastPhase =
  | "ask_needs"
  | "show_suggestions"
  | "collect_booking"
  | "select_gear"
  | "select_addons"
  | "show_receipt"
  | "verify_phone"
  | "complete"
  | "your_custom_phase"; // Add here
```

Then handle it in `AIBookingFlow.tsx`:

```typescript
case "your_custom_phase":
  return (
    <View style={styles.phaseContent}>
      {/* Your custom UI */}
    </View>
  );
```

---

## 🧪 Testing

### Test Voice Recording

```typescript
import { useFastAgent } from "@/hooks/useFastAgent";

function TestScreen() {
  const { startRecording, stopRecording, sendVoiceMessage } = useFastAgent();

  const handleRecord = async () => {
    await startRecording();
    
    // Wait for user to speak
    setTimeout(async () => {
      const audioBase64 = await stopRecording();
      if (audioBase64) {
        await sendVoiceMessage(audioBase64);
      }
    }, 3000);
  };

  return (
    <Button onPress={handleRecord} title="Test Voice" />
  );
}
```

### Test AI Flow Phases

```typescript
const { agentState, selectCategory, submitBooking } = useFastAgent();

// Simulate category selection
await selectCategory("category_id_123");

// Simulate booking submission
await submitBooking({
  officeId: "office_id_123",
  startDate: "2025-12-25",
  endDate: "2025-12-26",
  driverAge: 30,
});
```

---

## 🔍 Debugging

### Enable Logging

In `useFastAgent.ts`, logs are already added:

```typescript
console.log("Starting recording...");
console.log("Agent error:", error);
```

### Check Agent State

```typescript
const { agentState } = useFastAgent();

console.log("Current phase:", agentState.phase);
console.log("Booking data:", agentState.booking);
console.log("Suggestions:", agentState.suggestions);
```

### Test Without Voice

You can test the flow by sending text messages:

```typescript
await sendMessage("I need a van for moving tomorrow");
```

---

## 🚀 Usage Example

### In ReservationForm

The button is already integrated:

```typescript
function ReservationSheetContent() {
  return (
    <>
      {/* Voice + AI button */}
      <VoiceAIButton />
      
      {/* Traditional form fields below */}
    </>
  );
}
```

### Standalone Usage

```typescript
import AIBookingFlow from "@/components/global/AIBookingFlow";

function MyScreen() {
  const [showAI, setShowAI] = useState(false);

  return (
    <>
      <Button onPress={() => setShowAI(true)} title="Book with AI" />
      
      <AIBookingFlow
        visible={showAI}
        onClose={() => setShowAI(false)}
        onComplete={() => {
          setShowAI(false);
          Alert.alert("Success!", "Booking completed");
        }}
      />
    </>
  );
}
```

---

## 🔐 Security Notes

1. **Audio Data**: Base64 audio is sent to your API - ensure HTTPS
2. **Phone Verification**: Implement rate limiting on SMS endpoint
3. **User Authentication**: Store tokens securely with AsyncStorage
4. **Payment Data**: Never store card details in state

---

## 📱 Platform-Specific Notes

### iOS
- Requires microphone permission in Info.plist
- Audio recording uses M4A format

### Android
- Requires RECORD_AUDIO permission
- Audio recording uses 3GP format

Both are converted to base64 and sent to your API.

---

## 🐛 Common Issues

### "Recording failed"
- Check microphone permissions
- Ensure expo-av is installed
- Test on real device (simulator might not work)

### "API connection failed"
- Verify EXPO_PUBLIC_FAST_AGENT_API is set
- Check API endpoint is accessible
- Enable CORS on your backend

### "Audio playback not working"
- Ensure response contains valid base64 MP3
- Check audio format from OpenAI TTS

---

## 🎯 Next Steps

1. **Test the flow**: Tap the AI button and speak
2. **Customize phases**: Add your branding and content
3. **Connect backend**: Ensure your API returns proper responses
4. **Add analytics**: Track which phase users drop off
5. **Enhance UI**: Add animations and better error messages

---

## 📞 Support

The AI booking flow integrates with your existing:
- `VanList` component for van display
- `BookingModal` for final booking
- `officeService` for office data
- `reservationService` for creating bookings

All booking data flows through the same backend APIs! 🚀

# 🚨 QUICK FIX: JSON Parse Error

## The Problem
You're getting: `JSON Parse error: Unexpected end of input`

This means the API is returning an empty or invalid response.

## ✅ Immediate Solutions

### Option 1: Check Your API URL (Most Common)

1. **Create/Update `.env` file in root:**
```env
EXPO_PUBLIC_FAST_AGENT_API=YOUR_ACTUAL_API_URL_HERE
```

2. **Restart Expo:**
```bash
# Stop current server (Ctrl+C)
npx expo start --clear
```

3. **Verify it loaded:**
Add this to your code temporarily:
```typescript
console.log("API URL:", process.env.EXPO_PUBLIC_FAST_AGENT_API);
```

### Option 2: Test Your Backend

Run this in terminal:
```bash
curl -X POST YOUR_API_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"start","state":{"phase":"ask_needs","booking":{}}}'
```

Should return:
```json
{
  "success": true,
  "data": {
    "message": "...",
    "state": {...}
  }
}
```

### Option 3: Use Debug Component

1. **Import the debug component:**
```typescript
import { DebugAPITest } from '@/components/DebugAI';
```

2. **Add to a test screen:**
```typescript
<DebugAPITest />
```

3. **Tap "Test API Connection"** - it will show what's wrong

### Option 4: Use Mock API (No Backend Needed)

**Temporarily replace fetch in `hooks/useFastAgent.ts`:**

```typescript
// Around line 295, replace the fetch call with:
const data = {
  success: true,
  data: {
    message: "Hello! This is a test response.",
    state: {
      phase: "ask_needs",
      booking: {},
    },
    showSuggestions: false,
    needsPhoneInput: false,
    needsCodeInput: false,
    needsBookingForm: false,
    needsAddOns: false,
    needsReceipt: false,
    isComplete: false,
  },
};

// Skip the fetch entirely for testing
// const res = await fetch(...);
// const data = await res.json();
```

## 🔍 Check These:

- [ ] `.env` file exists in root
- [ ] `EXPO_PUBLIC_FAST_AGENT_API` is set
- [ ] API URL is correct (no typos)
- [ ] Backend is running and accessible
- [ ] Backend returns JSON (not HTML)
- [ ] Restarted Expo after .env changes

## 📱 Console Output

With the fixes I added, you should now see:
```
📤 Sending to API: https://...
📝 Payload: { message: 'start', action: undefined, hasAudio: false }
📥 Response status: 200
📄 Raw response: {"success":true...
✅ Parsed data: { success: true, phase: 'ask_needs' }
```

If you see errors here, they'll tell you exactly what's wrong!

## 🆘 Still Not Working?

Share the console output from these logs and I'll help you fix it.

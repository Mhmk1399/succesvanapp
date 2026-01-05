# 📱 Build Guide - Success Van Hire App

## Prerequisites

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```
If you don't have an Expo account, create one at https://expo.dev/signup

### 3. Configure the project
```bash
eas build:configure
```

---

## 🤖 Build Android APK

### Option 1: Using EAS Build (Recommended)
```bash
npm run build:android
```
Or directly:
```bash
eas build --platform android --profile preview
```

**What happens:**
- Builds on Expo's cloud servers
- Takes 10-20 minutes
- You'll get a download link when complete
- APK can be installed on any Android device

### Option 2: Local Build (Requires Android Studio)
```bash
npx expo run:android --variant release
```

---

## 🍎 Build iOS

### For iOS Simulator (Testing on Mac)
```bash
eas build --platform ios --profile preview
```

### For Real iOS Devices (Requires Apple Developer Account - $99/year)
```bash
npm run build:ios:prod
```
Or:
```bash
eas build --platform ios --profile production
```

**Important for iOS:**
- You need a Mac computer for local builds
- Apple Developer account required for distribution
- Must configure signing certificates
- For TestFlight distribution, use production profile

---

## 🚀 Build Both Platforms
```bash
npm run build:all
```

---

## 📋 Step-by-Step Instructions

### First Time Setup

1. **Install dependencies** (if not already done):
```bash
npm install
```

2. **Check your environment variables**:
Make sure `.env` file exists with:
```env
EXPO_PUBLIC_FAST_AGENT_API=https://your-api-url.com/api/fast-agent
```

3. **Login to EAS**:
```bash
eas login
```

4. **Start the build**:

For Android APK:
```bash
npm run build:android
```

For iOS:
```bash
npm run build:ios
```

### Build Process

1. **Answer the prompts**:
   - Select your project
   - Choose build profile (preview for APK, production for store)
   - Accept defaults for most options

2. **Wait for build**:
   - Monitor progress: https://expo.dev/accounts/[your-account]/projects/succesvanapp/builds
   - You'll get email notification when complete
   - Build takes 10-30 minutes

3. **Download your app**:
   - Click the download link in email
   - Or get it from: `eas build:list`

---

## 📦 Build Profiles

### Preview Profile (Testing)
- Creates APK for Android (easy install)
- Creates simulator build for iOS
- Not optimized for production
- Use for testing with team

### Production Profile (Store Release)
- Creates AAB for Google Play Store
- Creates IPA for Apple App Store
- Fully optimized and signed
- Use for store submission

---

## 🔧 Troubleshooting

### "eas: command not found"
```bash
npm install -g eas-cli
```

### Build fails with credentials error
```bash
eas credentials
```
Follow prompts to configure signing

### Android build fails
1. Check `app.json` has correct `package` name
2. Ensure all required permissions are listed
3. Try clearing cache:
```bash
eas build --platform android --clear-cache
```

### iOS build fails
1. Ensure bundle identifier is unique
2. Check Apple Developer account status
3. Verify certificates:
```bash
eas credentials
```

---

## 📲 Installing Built Apps

### Android APK
1. Download APK to phone
2. Enable "Install from Unknown Sources" in Settings
3. Tap APK file to install

### iOS (TestFlight)
1. Upload IPA to App Store Connect
2. Add testers via TestFlight
3. Testers install via TestFlight app

---

## 🎯 Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm run build:android` | Build Android APK |
| `npm run build:ios` | Build iOS app |
| `npm run build:all` | Build both platforms |
| `npm run build:android:prod` | Build for Play Store (AAB) |
| `npm run build:ios:prod` | Build for App Store (IPA) |
| `eas build:list` | List all builds |
| `eas build:cancel` | Cancel running build |

---

## 📝 Before Building

✅ Test the app thoroughly locally:
```bash
npm start
```

✅ Update version in `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "1.0.1"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

✅ Ensure all environment variables are set

✅ Check all images exist:
- `./assets/images/logo.png`
- `./assets/images/splash-icon.png`
- `./assets/images/android-icon-*.png`

---

## 🌐 Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Application Services](https://expo.dev/eas)
- [App Store Submission](https://docs.expo.dev/submit/ios/)
- [Play Store Submission](https://docs.expo.dev/submit/android/)

---

## 💡 Tips

- **First build is slow** - subsequent builds are faster
- **Use preview profile** for testing (creates APK)
- **Use production profile** for store submission (creates AAB/IPA)
- **Monitor builds** at https://expo.dev
- **Free tier** includes limited builds per month
- **Paid plans** available for unlimited builds

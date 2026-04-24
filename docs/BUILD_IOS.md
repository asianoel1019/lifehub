# Building LifeHub for iOS

## Overview
LifeHub is a **React + Vite** progressive web app (PWA). To distribute it as a native iOS application you can use **Capacitor** – the official native runtime from the Ionic team. Capacitor wraps your web code in a native container, gives you access to native APIs, and produces an Xcode project that can be built and submitted to the App Store.

---

## Prerequisites
1. **Apple Developer Account** – required for code signing and App Store distribution.
2. **Xcode (latest stable)** – install from the Mac App Store.
3. **Node.js (>=18)** and **npm** – already used for the project.
4. **Capacitor CLI** – will be installed as a dev dependency.
5. A **macOS** machine (or a CI service that provides macOS) – iOS builds cannot be performed on Windows.

---

## Step‑by‑Step Guide
### 1. Prepare the web app for production
```bash
# From the project root
npm run build   # Generates the `dist/` folder (static assets)
```
Make sure the PWA works offline and all assets are correctly referenced (relative paths are recommended).

### 2. Add Capacitor to the project
```bash
# Install Capacitor packages
npm i @capacitor/core @capacitor/cli --save-dev
```
Initialize Capacitor (this creates `capacitor.config.ts` and the `android/` & `ios/` native folders):
```bash
npx cap init "LifeHub" com.noel.lifehub
```
- **App name**: `LifeHub`
- **App ID**: `com.noel.lifehub` (use your own reverse‑domain identifier).

### 3. Configure the web assets
Edit `capacitor.config.ts` (or `capacitor.config.json`) to point to the built web folder:
```ts
export default {
  appId: "com.noel.lifehub",
  appName: "LifeHub",
  webDir: "dist",   // Vite output directory
  bundledWebRuntime: false,
};
```

### 4. Add the iOS platform
```bash
npx cap add ios
```
This creates an Xcode workspace at `ios/App/App.xcworkspace`.

### 5. Sync the latest web assets to the native project
Whenever you rebuild the web app, run:
```bash
npx cap copy ios   # copies `dist/` into the iOS native project
```
You can also run `npx cap sync ios` to update plugins and config.

### 6. Open the Xcode project
```bash
npx cap open ios
```
Xcode will launch. Perform the following inside Xcode:
- **Signing & Capabilities** → select your Apple Development Team.
- **Bundle Identifier** → ensure it matches the one in `capacitor.config.ts`.
- **App Icons & Launch Screens** → replace the placeholder assets in `ios/App/Assets.xcassets` with your own 1024 × 1024 icon and appropriate launch screen images. You can generate the required sizes using the `generate_image` tool or an online generator.
- **Deployment Target** → set to iOS 14.0 (or higher) to support most devices.
- **Enable “Background Modes”** → if you need background fetch for the PWA.

### 7. Test on a device / simulator
Select a simulator (e.g., iPhone 14) or a connected iPhone and press **Run** (⌘R). The app should load the bundled web assets and behave like the original PWA.

### 8. Optional: Add native plugins
If you need native features (e.g., Camera, Geolocation, Secure Storage), install the corresponding Capacitor plugins:
```bash
npm i @capacitor/geolocation @capacitor/camera
npx cap sync ios
```
Then use the plugin APIs in your React code.

### 9. Build for distribution
1. In Xcode, select **Product → Archive**.
2. After the archive finishes, the **Organizer** window opens. Click **Distribute App** → **App Store Connect** → follow the prompts.
3. Ensure you have a valid **App Store Connect** record (App ID, provisioning profile, etc.).

### 10. Submit to the App Store
Follow Apple’s review guidelines. The PWA‑wrapped app must:
- Provide a clear purpose and description.
- Not simply embed a website without native value.
- Include a privacy policy if you collect user data.

---

## Common Pitfalls & Tips
- **Running on Windows?** You can develop the web part on Windows, but the iOS build must be performed on macOS. Use a remote Mac or CI service (e.g., GitHub Actions with `macos-latest`).
- **Service Workers** – ensure they are correctly configured for the `file://` scheme used by Capacitor. In `vite.config.js` set `base: "./"` if needed.
- **Splash Screen** – Capacitor provides a default white screen; replace `SplashScreen.storyboard` for a branded experience.
- **App Size** – the bundled web assets are compressed; enable `vite-plugin-compress` if you want additional gzip/brotli.
- **Testing OTA Updates** – Capacitor supports `@capacitor/updates` for over‑the‑air updates without re‑submitting to the Store.

---

## Quick Reference Commands
```bash
# Build web assets
npm run build

# Copy assets to iOS project
npx cap copy ios

# Open Xcode
npx cap open ios

# Sync plugins / config
npx cap sync ios
```

---

**Happy building!** 🎉

*If you need help generating the required icon set, let me know and I can create the images for you.*

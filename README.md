# DSMS Parent (mobile)

Expo / React Native parent app for Digital School Management System. It reuses the existing NestJS API (`nestjs-be`) and follows the navy card-based parent design.

## Run

1. Start the API: `cd nestjs-be && yarn start:dev`
2. Start the app: `cd mobile && npx expo start`
3. Open in iOS Simulator, Android Emulator, or Expo Go

### API URL

`EXPO_PUBLIC_API_URL` in `.env`:

- iOS Simulator: `http://localhost:3000`
- Android Emulator: `http://10.0.2.2:3000`
- Physical device: `http://YOUR_LAN_IP:3000`

Seed login: `parent@school.com` / `Password123!`

## EAS Build (installable APK)

Preview builds talk to `https://backend.dsmspk.com` (not localhost).

```bash
cd mobile
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

When the build finishes, Expo gives a download URL. Install that APK on an Android phone or emulator.

Store / Play upload (AAB):

```bash
npx eas-cli build --platform android --profile production
```

## Included (matches web parent portal)

- Login + onboarding
- Home dashboard, child switcher
- Diary + homework detail
- Academics (tests + attendance calendar)
- Report card
- Chat with class teachers (Firestore, same as web)
- Fees (outstanding invoices + receipt upload)
- Leave requests
- Announcements
- Profile

## Skipped (not in the web app yet)

- JazzCash / EasyPaisa / card checkout
- Class activities social feed
- Apple / Google social login
- Self-serve forgot-password email
- Co-curricular / titles modules

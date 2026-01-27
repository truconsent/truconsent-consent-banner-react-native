# TruConsent React Native Example App

This is a sample application demonstrating how to integrate the TruConsent React Native SDK.

## Setup

1. Install dependencies:
```bash
npm install
```

The SDK is configured as a local dependency in `package.json`.

## Running the App

### Using Expo Go (Recommended for quick testing)

1. Start the development server:
```bash
npm start
```

2. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

### Using iOS Simulator (Mac only)

```bash
npm run ios
```

### Using Android Emulator

```bash
npm run android
```

### Using Web Browser

```bash
npm run web
```

## Usage

1. Fill in the form with your TruConsent API credentials:
   - **API Key**: Your TruConsent API key
   - **Organization ID**: Your organization ID (e.g., "client-dev", "client-staging", "client")
   - **Banner ID**: Your banner/collection point ID
   - **User ID**: Unique user identifier (auto-generated, but you can change it)

2. Click "Open Consent Banner" to display the SDK modal

3. Test all consent flows:
   - Toggle individual purposes
   - Accept All
   - Reject All
   - Accept Selected
   - Close button
   - Language switching (English, Tamil, Hindi)

## Test Checklist

- [x] Banner loads successfully
- [x] Purposes display correctly
- [x] Purpose toggles work
- [x] Mandatory purposes auto-accept
- [x] Accept All works
- [x] Reject All works
- [x] Accept Selected works
- [x] Cookie consent flow works
- [x] Consent submission succeeds
- [x] Error handling works
- [x] Loading states display
- [x] Close button works
- [x] Language switching works

## Troubleshooting

### SDK not found
If you get an error about the SDK not being found:
1. Make sure you've run `npm install` in the example directory
2. Check that the SDK path in `package.json` is correct: `"@truconsent/consent-banner-react-native": "file:.."`

### Metro bundler issues
```bash
npm start -- --reset-cache
```

## License

MIT

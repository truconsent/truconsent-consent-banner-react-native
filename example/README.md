# TruConsent React Native Example App

This is a test application for validating the TruConsent React Native SDK.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Link the local SDK:
```bash
npm install ../ --save
```

3. Run the app:
```bash
# iOS
npm run ios

# Android
npm run android
```

## Testing

Fill in the form with your API credentials:
- API Key: Your TruConsent API key
- Organization ID: e.g., "client-dev", "client-staging", or "client"
- Banner ID: Your banner/collection point ID
- User ID: Unique user identifier (auto-generated)

Click "Open Consent Banner" to test the SDK.

## Test Checklist

- [ ] Banner loads successfully
- [ ] Purposes display correctly
- [ ] Purpose toggles work
- [ ] Mandatory purposes auto-accept
- [ ] Accept All works
- [ ] Reject All works
- [ ] Accept Selected works
- [ ] Cookie consent flow works
- [ ] Consent submission succeeds
- [ ] Error handling works
- [ ] Loading states display
- [ ] Close button works
- [ ] Language switching works (en, ta, hi)


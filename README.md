# @truconsent/consent-notice-react-native

React Native SDK for TruConsent consent banner. This package provides native mobile UI components for displaying and managing consent banners in React Native applications.

## 📚 Documentation

**👉 [Complete Integration Guide](INTEGRATION_GUIDE.md)** - Step-by-step guide with real-world examples from the Mars Money React Native app.

The integration guide includes:
- Detailed installation instructions
- Configuration setup (Expo & React Native CLI)
- Consent Modal integration with hook consistency patterns
- Rights Center implementation
- Complete code examples
- Troubleshooting guide (including React Native-specific issues)
- Best practices

## Installation

```bash
npm install @truconsent/consent-notice-react-native
# or
yarn add @truconsent/consent-notice-react-native
```

## Peer Dependencies

This package requires the following peer dependencies:

- `react` >= 18.0.0
- `react-native` >= 0.70.0
- `react-i18next` >= 16.2.3
- `i18next` >= 25.6.0

## Usage

```tsx
import { TruConsentModal } from '@truconsent/consent-notice-react-native';

function App() {
  return (
    <TruConsentModal
      apiKey="your-api-key"
      organizationId="your-org-id"
      bannerId="your-banner-id"
      userId="user-id"
      onClose={(action) => console.log('Consent action:', action)}
    />
  );
}
```

## API

### TruConsentModal

Main component for displaying the consent banner modal.

#### Props

- `apiKey` (string, required): API key for authentication
- `organizationId` (string, required): Organization ID
- `bannerId` (string, required): Banner/Collection Point ID
- `userId` (string, required): User ID for consent tracking
- `apiBaseUrl` (string, optional): Base URL for API
- `logoUrl` (string, optional): Company logo URL
- `companyName` (string, optional): Company name
- `onClose` (function, optional): Callback when modal closes

## License

MIT


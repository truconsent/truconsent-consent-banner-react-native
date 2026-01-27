# TruConsent React Native SDK Integration Guide

## Installation

```bash
npm install @truconsent/consent-banner-react-native
```

## Basic Usage

```tsx
import TruConsentModal from '@truconsent/consent-banner-react-native';

function App() {
  return (
    <TruConsentModal
      apiKey="your-api-key"
      organizationId="your-org-id"
      bannerId="your-banner-id"
      userId="user-id"
      onClose={(action) => {
        console.log('Consent action:', action);
      }}
    />
  );
}
```

## Configuration

### Required Props

- `apiKey` (string): Your TruConsent API key
- `organizationId` (string): Organization ID (e.g., "client-dev", "client-staging", "client")
- `bannerId` (string): Banner/Collection Point ID
- `userId` (string): Unique user identifier for consent tracking

### Optional Props

- `apiBaseUrl` (string): Custom API base URL (defaults to production)
- `logoUrl` (string): Company logo URL
- `companyName` (string): Company name (defaults to "Mars Company")
- `onClose` (function): Callback when modal closes with consent action

## Testing Checklist

### Setup
- [ ] Install SDK package
- [ ] Configure API credentials
- [ ] Test with valid banner ID

### Functionality
- [ ] Banner loads successfully
- [ ] Purposes display correctly
- [ ] Purpose toggles work
- [ ] Accept All works
- [ ] Reject All works
- [ ] Accept Selected works
- [ ] Cookie consent flow works
- [ ] Error handling works

### UI/UX
- [ ] Modal displays correctly
- [ ] Responsive on different screen sizes
- [ ] Touch interactions work smoothly
- [ ] Language switching works

## Common Issues

### Banner Not Loading
- Check API credentials
- Verify banner ID exists
- Check network connectivity
- Review error messages in console

### Consent Not Submitting
- Verify API endpoint is accessible
- Check request format
- Review error responses

## Support

For issues or questions, refer to TESTING_ISSUES.md or contact the development team.


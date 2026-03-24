# TruConsent React Native SDK - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
4. [API Reference](#api-reference)
5. [Components](#components)
6. [Hooks](#hooks)
7. [Core Services](#core-services)
8. [Type Definitions](#type-definitions)
9. [Internationalization](#internationalization)
10. [Utilities](#utilities)
11. [Usage Examples](#usage-examples)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)
14. [Architecture](#architecture)

---

## Overview

The TruConsent React Native SDK is a comprehensive solution for displaying and managing consent banners in React Native applications. It provides a native mobile UI for collecting user consent, supporting GDPR, CCPA, and other privacy regulations.

### Key Features

- **Native React Native Components**: Built specifically for mobile applications
- **Multiple Consent Types**: Supports standard consent, cookie consent, and general consent
- **Flexible Purpose Management**: Users can accept/decline individual purposes or use bulk actions
- **Internationalization**: Built-in support for multiple languages (English, Hindi, Tamil)
- **TypeScript Support**: Full TypeScript definitions for type safety
- **Customizable UI**: Modern, mobile-friendly interface with customizable branding
- **Consent Tracking**: Automatic logging of consent actions to the TruConsent API
- **Rights Center**: Comprehensive rights management interface (RightCenter component) with WebView integration
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **React Hooks**: Custom hooks (useBanner, useConsent) for flexible integration

### Supported Platforms

- React Native 0.70.0+
- iOS
- Android
- Expo (with compatible versions)

---

## Installation

### Prerequisites

- React >= 18.0.0
- React Native >= 0.70.0
- Node.js >= 16.0.0

### Install the Package

```bash
npm install @truconsent/consent-banner-react-native
# or
yarn add @truconsent/consent-banner-react-native
```

### Install Peer Dependencies

```bash
npm install react react-native react-i18next i18next
# or
yarn add react react-native react-i18next i18next
```

### For Expo Projects

If you're using Expo, ensure your `app.json` includes the necessary configuration:

```json
{
  "expo": {
    "extra": {
      "truConsentApiKey": "your-api-key",
      "truConsentOrganizationId": "your-org-id"
    }
  }
}
```

---

## Getting Started

### Basic Usage

```tsx
import React from 'react';
import { TruConsentModal } from '@truconsent/consent-banner-react-native';

function App() {
  const handleConsentClose = (action) => {
    console.log('User consent action:', action);
    // Handle consent action (approved, declined, partial_consent, etc.)
  };

  return (
    <TruConsentModal
      apiKey="your-api-key"
      organizationId="your-org-id"
      bannerId="your-banner-id"
      userId="user-123"
      onClose={handleConsentClose}
      companyName="Your Company"
      logoUrl="https://example.com/logo.png"
    />
  );
}
```

### Conditional Rendering

```tsx
import React, { useState } from 'react';
import { TruConsentModal } from '@truconsent/consent-banner-react-native';

function MyForm() {
  const [showConsent, setShowConsent] = useState(false);

  const handleConsentClose = (action) => {
    if (action === 'approved') {
      // Proceed with form submission
      console.log('Consent approved, submitting form...');
    } else {
      // Show error or prevent submission
      console.log('Consent not provided');
    }
    setShowConsent(false);
  };

  const handleSubmit = () => {
    // Show consent modal before submitting
    setShowConsent(true);
  };

  return (
    <>
      <button onPress={handleSubmit}>Submit Form</button>
      {showConsent && (
        <TruConsentModal
          apiKey="your-api-key"
          organizationId="your-org-id"
          bannerId="your-banner-id"
          userId="user-123"
          onClose={handleConsentClose}
        />
      )}
    </>
  );
}
```

---

## API Reference

### Exports

The SDK exports the following:

```typescript
// Main Components
export { TruConsentModal } from './components/TruConsentModal';
export { TruConsent } from './components/TruConsent';
export { BannerUI } from './components/BannerUI';
export { CookieBannerUI } from './components/CookieBannerUI';
export { RightCenter } from './components/RightCenter';

// Hooks
export { useBanner } from './hooks/useBanner';
export { useConsent } from './hooks/useConsent';

// Core Services
export { fetchBanner, submitConsent } from './core/BannerService';
export * from './core/ConsentManager';

// Types
export * from './core/types';

// Utilities
export { generateRequestId, isValidUUID } from './utils/RequestIdGenerator';
```

---

## Components

### TruConsentModal

The main component for displaying consent banners in a modal overlay.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `apiKey` | `string` | Yes | - | API key for authentication with TruConsent API |
| `organizationId` | `string` | Yes | - | Organization identifier |
| `bannerId` | `string` | Yes | - | Banner/Collection Point ID to display |
| `userId` | `string` | Yes | - | Unique user identifier for consent tracking |
| `apiUrl` | `string` | No  | TruAPI root URL for consent + banners endpoints |
| `logoUrl` | `string` | No | - | URL of the company logo to display in the banner |
| `companyName` | `string` | No | `'Mars Company'` | Company name to display in the banner |
| `onClose` | `(action: ConsentAction) => void` | No | - | Callback function called when the modal closes. Receives the consent action type. |

#### ConsentAction Types

- `'approved'`: User accepted all purposes
- `'declined'`: User declined all purposes
- `'partial_consent'`: User accepted some but not all purposes
- `'revoked'`: User revoked previously given consent
- `'no_action'`: User closed the modal without taking action

#### Example

```tsx
<TruConsentModal
  apiKey="abc123xyz"
  organizationId="org-123"
  bannerId="banner-456"
  userId="user-789"
  companyName="Acme Corp"
  logoUrl="https://acme.com/logo.png"
  onClose={(action) => {
    console.log('Consent action:', action);
  }}
/>
```

#### Internal Behavior

- Automatically fetches banner configuration from the API on mount
- Manages consent state internally using React hooks
- Automatically submits consent to the API when user takes action
- Handles loading states and error conditions
- Supports both standard consent and cookie consent types

### TruConsent

A wrapper component that provides web SDK parity. It's an alias for `TruConsentModal`.

```tsx
import { TruConsent } from '@truconsent/consent-banner-react-native';

// Same props as TruConsentModal
<TruConsent {...props} />
```

### BannerUI

Internal component for rendering standard consent banners. Typically used internally by `TruConsentModal`, but can be used directly for custom implementations.

### CookieBannerUI

Internal component for rendering cookie consent banners. Used when `banner.consent_type === 'cookie_consent'`.

### RightCenter

Internal component for rendering right center positioning. Used for specific banner layouts.

---

## Hooks

### useBanner

Custom hook for fetching banner data from the API.

#### Signature

```typescript
function useBanner(config: FetchBannerConfig | null): UseBannerResult
```

#### Parameters

```typescript
interface FetchBannerConfig {
  bannerId: string;
  apiKey: string;
  organizationId: string;
  apiUrl?: string;
}
```

#### Returns

```typescript
interface UseBannerResult {
  banner: Banner | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
```

#### Example

```tsx
import { useBanner } from '@truconsent/consent-banner-react-native';

function MyComponent() {
  const { banner, isLoading, error, refetch } = useBanner({
    bannerId: 'banner-123',
    apiKey: 'api-key',
    organizationId: 'org-123',
  });

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  if (!banner) return <Text>No banner found</Text>;

  return <Text>Banner: {banner.title}</Text>;
}
```

### useConsent

Custom hook for managing consent state for purposes.

#### Signature

```typescript
function useConsent(initialPurposes: Purpose[]): UseConsentResult
```

#### Parameters

- `initialPurposes`: Array of `Purpose` objects to initialize the consent state

#### Returns

```typescript
interface UseConsentResult {
  purposes: Purpose[];
  updatePurpose: (purposeId: string, status: 'accepted' | 'declined') => void;
  acceptAll: () => void;
  rejectAll: () => void;
  acceptSelected: () => Purpose[];
  setPurposes: (purposes: Purpose[]) => void;
}
```

#### Methods

- `updatePurpose(purposeId, status)`: Update a single purpose's consent status
- `acceptAll()`: Accept all purposes
- `rejectAll()`: Reject all optional purposes (mandatory purposes remain accepted)
- `acceptSelected()`: Accept only selected purposes and all mandatory purposes. Returns the updated purposes array.
- `setPurposes(purposes)`: Replace the entire purposes array

#### Example

```tsx
import { useConsent } from '@truconsent/consent-banner-react-native';

function ConsentManager({ initialPurposes }) {
  const {
    purposes,
    updatePurpose,
    acceptAll,
    rejectAll,
    acceptSelected,
  } = useConsent(initialPurposes);

  return (
    <View>
      {purposes.map((purpose) => (
        <TouchableOpacity
          key={purpose.id}
          onPress={() =>
            updatePurpose(
              purpose.id,
              purpose.consented === 'accepted' ? 'declined' : 'accepted'
            )
          }
        >
          <Text>{purpose.name}</Text>
        </TouchableOpacity>
      ))}
      <Button onPress={acceptAll} title="Accept All" />
      <Button onPress={rejectAll} title="Reject All" />
    </View>
  );
}
```

---

## Core Services

### BannerService

Service for making API calls to the TruConsent backend.

#### fetchBanner

Fetches banner configuration from the API.

```typescript
async function fetchBanner(config: FetchBannerConfig): Promise<Banner>
```

**Parameters:**
- `config.bannerId`: Banner ID to fetch
- `config.apiKey`: API key for authentication
- `config.organizationId`: Organization ID
- `config.apiUrl`: TruAPI root URL (e.g. `https://api-dev.truconsent.io`)

**Returns:** Promise resolving to a `Banner` object

**Throws:**
- `Error('Missing bannerId')` if bannerId is not provided
- `Error('Missing apiKey')` if apiKey is not provided
- `Error('Missing organizationId')` if organizationId is not provided
- `Error('Authentication required')` on 401 status
- `Error('Access forbidden')` on 403 status
- `Error('Banner not found')` on 404 status
- Other errors for other HTTP failures

**Example:**

```tsx
import { fetchBanner } from '@truconsent/consent-banner-react-native';

try {
  const banner = await fetchBanner({
    bannerId: 'banner-123',
    apiKey: 'api-key',
    organizationId: 'org-123',
  });
  console.log('Banner loaded:', banner);
} catch (error) {
  console.error('Failed to load banner:', error.message);
}
```

#### submitConsent

Submits user consent to the API.

```typescript
async function submitConsent(config: SubmitConsentConfig): Promise<any>
```

**Parameters:**
- `config.collectionPointId`: Collection point ID from the banner
- `config.userId`: User identifier
- `config.purposes`: Array of purpose objects with consent status
- `config.action`: Consent action type (`'approved'`, `'declined'`, etc.)
- `config.apiKey`: API key for authentication
- `config.organizationId`: Organization ID
- `config.requestId`: Optional request ID for tracking
- `config.apiUrl`: TruAPI root URL

**Returns:** Promise resolving to API response

**Throws:**
- `Error('Missing collectionPointId')` if collectionPointId is not provided
- `Error('Missing apiKey')` if apiKey is not provided
- `Error('Missing organizationId')` if organizationId is not provided
- `Error('Failed to submit consent')` on HTTP failure

**Example:**

```tsx
import { submitConsent } from '@truconsent/consent-banner-react-native';

try {
  await submitConsent({
    collectionPointId: 'cp-123',
    userId: 'user-456',
    purposes: [
      { id: 'p1', consented: 'accepted', ... },
      { id: 'p2', consented: 'declined', ... },
    ],
    action: 'approved',
    apiKey: 'api-key',
    organizationId: 'org-123',
  });
  console.log('Consent submitted successfully');
} catch (error) {
  console.error('Failed to submit consent:', error.message);
}
```

### ConsentManager

Utility functions for managing consent state.

#### updatePurposeStatus

Updates a single purpose's consent status in an array.

```typescript
function updatePurposeStatus(
  purposes: Purpose[],
  purposeId: string,
  newStatus: 'accepted' | 'declined'
): Purpose[]
```

#### acceptMandatoryPurposes

Automatically accepts all mandatory purposes while preserving user selections for optional ones.

```typescript
function acceptMandatoryPurposes(purposes: Purpose[]): Purpose[]
```

#### determineConsentAction

Determines the overall consent action based on purpose states.

```typescript
function determineConsentAction(
  purposes: Purpose[],
  previousPurposes?: Purpose[] | null
): ConsentAction
```

**Returns:**
- `'approved'`: All purposes accepted
- `'declined'`: All purposes declined
- `'partial_consent'`: Mixed consent (some accepted, some declined)
- `'revoked'`: Previously accepted purposes were declined

#### getAcceptedPurposes

Returns all purposes with accepted consent.

```typescript
function getAcceptedPurposes(purposes: Purpose[]): Purpose[]
```

#### getDeclinedPurposes

Returns all purposes with declined consent.

```typescript
function getDeclinedPurposes(purposes: Purpose[]): Purpose[]
```

#### hasOptionalAccepted

Checks if any optional (non-mandatory) purposes are accepted.

```typescript
function hasOptionalAccepted(purposes: Purpose[]): boolean
```

#### hasMandatoryPurposes

Checks if there are any mandatory purposes.

```typescript
function hasMandatoryPurposes(purposes: Purpose[]): boolean
```

---

## Type Definitions

### Banner

Main banner configuration object returned from the API.

```typescript
interface Banner {
  banner_id: string;
  collection_point: string;
  version?: string;
  title: string;
  name?: string; // Alternative field name from API
  expiry_type?: string;
  asset?: Asset;
  purposes: Purpose[];
  data_elements?: DataElement[];
  legal_entities?: LegalEntity[];
  tools?: Tool[];
  processing_activities?: ProcessingActivity[];
  consent_type?: 'standard_consent' | 'cookie_consent' | 'general';
  cookie_config?: CookieConfig;
  banner_settings?: BannerSettings;
  organization?: Organization;
  organization_name?: string;
  cookie_data_elements?: DataElement[];
  show_purposes?: boolean;
}
```

### Purpose

Represents a consent purpose that users can accept or decline.

```typescript
interface Purpose {
  id: string;
  name: string;
  description: string;
  is_mandatory: boolean;
  consented: 'accepted' | 'declined' | 'pending';
  expiry_period: string;
  expiry_label?: string;
  data_elements?: DataElement[];
  processing_activities?: ProcessingActivity[];
  legal_entities?: LegalEntity[];
  tools?: Tool[];
}
```

### DataElement

Represents a data element associated with a purpose.

```typescript
interface DataElement {
  id: string;
  name: string;
  description?: string;
  display_id?: string;
}
```

### LegalEntity

Represents a legal entity involved in data processing.

```typescript
interface LegalEntity {
  id: string;
  name: string;
  description?: string;
  display_id?: string;
}
```

### Tool

Represents a tool used for data processing.

```typescript
interface Tool {
  id: string;
  name: string;
  description?: string;
  display_id?: string;
}
```

### ProcessingActivity

Represents a processing activity.

```typescript
interface ProcessingActivity {
  id: string;
  name: string;
  description?: string;
  display_id?: string;
}
```

### Asset

Represents an asset associated with the banner.

```typescript
interface Asset {
  id: string;
  name: string;
  description?: string;
  asset_type?: string;
}
```

### CookieConfig

Configuration for cookie consent banners.

```typescript
interface CookieConfig {
  cookies?: Cookie[];
  selected_data_element_ids?: string[];
  selected_processing_activity_ids?: string[];
}
```

### Cookie

Cookie information for cookie consent.

```typescript
interface Cookie {
  id?: string;
  name?: string;
  category?: string;
  domain?: string;
  expiry?: string;
}
```

### BannerSettings

UI customization settings for the banner.

```typescript
interface BannerSettings {
  font_type?: string;
  font_size?: string;
  primary_color?: string;
  secondary_color?: string;
  action_button_text?: string;
  warning_text?: string;
  logo_url?: string;
  banner_title?: string;
  disclaimer_text?: string;
  footer_text?: string;
  show_purposes?: boolean;
}
```

### Organization

Organization information.

```typescript
interface Organization {
  name: string;
  legal_name?: string;
  trade_name?: string;
  logo_url?: string;
}
```

### ConsentAction

Type representing possible consent actions.

```typescript
type ConsentAction = 
  | 'approved' 
  | 'declined' 
  | 'no_action' 
  | 'revoked' 
  | 'partial_consent';
```

### ConsentRequest

Request object for submitting consent.

```typescript
interface ConsentRequest {
  userId: string;
  purposes: Purpose[];
  action: ConsentAction;
  requestId?: string;
}
```

### TruConsentConfig

Configuration object for TruConsent components.

```typescript
interface TruConsentConfig {
  apiKey: string;
  organizationId: string;
  bannerId: string;
  userId: string;
  apiUrl?: string;
  logoUrl?: string;
  companyName?: string;
  onClose?: (action: ConsentAction) => void;
}
```

---

## Internationalization

The SDK includes built-in internationalization support using `i18next` and `react-i18next`.

### Supported Languages

- English (`en`) - Default
- Hindi (`hi`)
- Tamil (`ta`)

### Translation Keys

The SDK uses the following translation keys:

```json
{
  "consent_by": "Consent by {{companyName}}",
  "decline_rights": "You have the right to decline consents which you feel are not required by {{companyName}}",
  "expiry_type": "Expiry Type: {{expiry}}",
  "accept": "Accept",
  "reject_all": "Reject All",
  "accept_all": "Accept All",
  "accept_only_necessary": "Accept Only Necessary",
  "accept_selected": "Accept Selected",
  "i_consent": "I Consent",
  "mandatory": "Mandatory",
  "data_elements": "Data Elements",
  "legal_entities": "Legal Entities",
  "tools": "Tools",
  "processing_activities": "Processing Activities",
  "data_processors": "Data Processors"
}
```

### Customizing Translations

To add custom translations or modify existing ones, you can extend the i18n configuration:

```tsx
import i18n from '@truconsent/consent-banner-react-native/utils/i18n';

// Add custom translations
i18n.addResourceBundle('en', 'translation', {
  'custom_key': 'Custom Value',
}, true, true);

// Change language
i18n.changeLanguage('hi'); // Switch to Hindi
```

### Locale Files Location

Translation files are located at:
- `src/utils/locales/en.json`
- `src/utils/locales/hi.json`
- `src/utils/locales/ta.json`

---

## Utilities

### RequestIdGenerator

Utility for generating unique request IDs for consent tracking.

#### generateRequestId

Generates a unique UUID v4 request ID.

```typescript
function generateRequestId(): string
```

**Returns:** A UUID v4 string (e.g., `"550e8400-e29b-41d4-a716-446655440000"`)

**Implementation:**
- Uses `crypto.randomUUID()` if available (React Native 0.70+)
- Falls back to manual UUID v4 generation for older versions

**Example:**

```tsx
import { generateRequestId } from '@truconsent/consent-banner-react-native';

const requestId = generateRequestId();
console.log(requestId); // "550e8400-e29b-41d4-a716-446655440000"
```

#### isValidUUID

Validates if a string is a valid UUID format.

```typescript
function isValidUUID(str: string): boolean
```

**Example:**

```tsx
import { isValidUUID } from '@truconsent/consent-banner-react-native';

isValidUUID('550e8400-e29b-41d4-a716-446655440000'); // true
isValidUUID('invalid-id'); // false
```

---

## Usage Examples

### Example 1: Basic Integration

```tsx
import React, { useState } from 'react';
import { View, Button } from 'react-native';
import { TruConsentModal } from '@truconsent/consent-banner-react-native';

function App() {
  const [showConsent, setShowConsent] = useState(false);

  const handleConsentClose = (action) => {
    console.log('Consent action:', action);
    setShowConsent(false);
    
    if (action === 'approved') {
      // Proceed with application logic
      console.log('User consented, proceeding...');
    } else {
      // Handle declined consent
      console.log('User declined consent');
    }
  };

  return (
    <View>
      <Button 
        title="Show Consent" 
        onPress={() => setShowConsent(true)} 
      />
      {showConsent && (
        <TruConsentModal
          apiKey="your-api-key"
          organizationId="your-org-id"
          bannerId="your-banner-id"
          userId="user-123"
          onClose={handleConsentClose}
        />
      )}
    </View>
  );
}
```

### Example 2: Form Submission with Consent

```tsx
import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import { TruConsentModal } from '@truconsent/consent-banner-react-native';
import type { ConsentAction } from '@truconsent/consent-banner-react-native';

function RegistrationForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [showConsent, setShowConsent] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  const handleSubmit = () => {
    // Show consent before submitting
    setShowConsent(true);
  };

  const handleConsentClose = async (action: ConsentAction) => {
    setShowConsent(false);
    
    if (action === 'approved') {
      // Submit form after consent
      try {
        await submitForm(formData);
        console.log('Form submitted successfully');
        setCanSubmit(true);
      } catch (error) {
        console.error('Form submission failed:', error);
      }
    } else {
      alert('Please provide consent to proceed');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Name"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />
      <TextInput
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
      />
      <Button title="Submit" onPress={handleSubmit} />
      
      {showConsent && (
        <TruConsentModal
          apiKey="your-api-key"
          organizationId="your-org-id"
          bannerId="your-banner-id"
          userId="user-123"
          onClose={handleConsentClose}
        />
      )}
    </View>
  );
}
```

### Example 3: Using Hooks Directly

```tsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useBanner, useConsent } from '@truconsent/consent-banner-react-native';

function CustomConsentBanner() {
  const { banner, isLoading, error } = useBanner({
    bannerId: 'banner-123',
    apiKey: 'api-key',
    organizationId: 'org-123',
  });

  const { purposes, acceptAll, rejectAll, updatePurpose } = useConsent(
    banner?.purposes || []
  );

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  if (!banner) {
    return <Text>No banner found</Text>;
  }

  return (
    <View>
      <Text>{banner.title}</Text>
      {purposes.map((purpose) => (
        <View key={purpose.id}>
          <Text>{purpose.name}</Text>
          <Button
            title={purpose.consented === 'accepted' ? 'Decline' : 'Accept'}
            onPress={() =>
              updatePurpose(
                purpose.id,
                purpose.consented === 'accepted' ? 'declined' : 'accepted'
              )
            }
          />
        </View>
      ))}
      <Button title="Accept All" onPress={acceptAll} />
      <Button title="Reject All" onPress={rejectAll} />
    </View>
  );
}
```

### Example 4: Handling Different Consent Actions

```tsx
import React, { useState } from 'react';
import { TruConsentModal } from '@truconsent/consent-banner-react-native';
import type { ConsentAction } from '@truconsent/consent-banner-react-native';

function ConsentHandler() {
  const [showConsent, setShowConsent] = useState(false);

  const handleConsentClose = (action: ConsentAction) => {
    setShowConsent(false);

    switch (action) {
      case 'approved':
        console.log('Full consent granted');
        // Enable all features
        break;
      
      case 'declined':
        console.log('Consent declined');
        // Disable features requiring consent
        break;
      
      case 'partial_consent':
        console.log('Partial consent granted');
        // Enable only features for accepted purposes
        break;
      
      case 'revoked':
        console.log('Consent revoked');
        // Disable all features
        break;
      
      case 'no_action':
        console.log('No action taken');
        // Keep current state
        break;
      
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <>
      <Button title="Show Consent" onPress={() => setShowConsent(true)} />
      {showConsent && (
        <TruConsentModal
          apiKey="your-api-key"
          organizationId="your-org-id"
          bannerId="your-banner-id"
          userId="user-123"
          onClose={handleConsentClose}
        />
      )}
    </>
  );
}
```

### Example 5: Custom API Base URL

```tsx
import { TruConsentModal } from '@truconsent/consent-banner-react-native';

function App() {
  return (
    <TruConsentModal
      apiKey="your-api-key"
      organizationId="your-org-id"
      bannerId="your-banner-id"
      userId="user-123"
      apiUrl="https://custom-api.example.com"
      onClose={(action) => console.log(action)}
    />
  );
}
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```tsx
const handleConsentClose = (action: ConsentAction) => {
  try {
    if (action === 'approved') {
      // Proceed with logic
    }
  } catch (error) {
    console.error('Error handling consent:', error);
    // Show user-friendly error message
  }
};
```

### 2. User ID Management

Use consistent user IDs for proper consent tracking:

```tsx
// Good: Use consistent user ID
const userId = user?.id || guestId || 'anonymous';

// Bad: Using random IDs each time
const userId = Math.random().toString();
```

### 3. Conditional Rendering

Only show the consent modal when needed:

```tsx
// Good: Conditional rendering
{showConsent && (
  <TruConsentModal {...props} />
)}

// Bad: Always rendering (wastes resources)
<TruConsentModal {...props} visible={showConsent} />
```

### 4. Loading States

Show loading indicators while consent is being processed:

```tsx
const [isProcessing, setIsProcessing] = useState(false);

const handleConsentClose = async (action: ConsentAction) => {
  setIsProcessing(true);
  try {
    // Process consent
    await processConsent(action);
  } finally {
    setIsProcessing(false);
  }
};
```

### 5. Consent Persistence

Store consent status locally to avoid showing the banner repeatedly:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = 'user_consent_status';

// Check if consent already given
const hasConsent = await AsyncStorage.getItem(CONSENT_KEY);
if (!hasConsent) {
  setShowConsent(true);
}

// Store consent after approval
const handleConsentClose = async (action: ConsentAction) => {
  if (action === 'approved') {
    await AsyncStorage.setItem(CONSENT_KEY, 'true');
  }
};
```

### 6. React Hooks Rules

**CRITICAL**: When wrapping `TruConsentModal` in your own component, ensure all hooks are called before any conditional returns:

```tsx
// Good: All hooks before conditional return
function MyConsentWrapper({ visible }) {
  const [state, setState] = useState(false);
  const memoized = useMemo(() => compute(), []);
  
  if (!visible) return null; // OK: hooks already called
  
  return <TruConsentModal {...props} />;
}

// Bad: Conditional return before hooks
function MyConsentWrapper({ visible }) {
  if (!visible) return null; // BAD: hooks not called yet
  
  const [state, setState] = useState(false); // This will cause errors
  return <TruConsentModal {...props} />;
}
```

### 7. API Key Security

Never hardcode API keys in your source code. Use environment variables or secure storage:

```tsx
// Good: Using environment variables
const apiKey = process.env.TRU_CONSENT_API_KEY;

// Bad: Hardcoded keys
const apiKey = 'abc123xyz'; // Never do this
```

---

## Troubleshooting

### Common Issues

#### 1. "Rendered fewer hooks than expected" Error

**Cause:** Conditional rendering of `TruConsentModal` or hooks called after conditional returns.

**Solution:** Ensure all hooks are called before any conditional returns in your wrapper component.

```tsx
// Fix: Call all hooks first
function Wrapper({ visible }) {
  const [state, setState] = useState(false); // Hook called first
  
  if (!visible) return null; // Conditional return after hooks
  
  return <TruConsentModal {...props} />;
}
```

#### 2. "Banner not found" Error

**Cause:** Invalid banner ID or API credentials.

**Solutions:**
- Verify the `bannerId` is correct
- Check that the `apiKey` and `organizationId` are valid
- Ensure the banner exists in your TruConsent dashboard
- Verify API base URL is correct

#### 3. "Authentication required" Error

**Cause:** Invalid or missing API key.

**Solutions:**
- Verify your API key is correct
- Check that the API key hasn't expired
- Ensure the API key has proper permissions
- Verify the `organizationId` matches the API key

#### 4. Modal Not Showing

**Cause:** Component not mounted or `visible` state issue.

**Solutions:**
- Ensure the component is conditionally rendered correctly
- Check that all required props are provided
- Verify the component is in the component tree
- Check for console errors

#### 5. Consent Not Submitting

**Cause:** Network issues or API errors.

**Solutions:**
- Check network connectivity
- Verify API endpoint is accessible
- Check console for error messages
- Verify request payload is correct

#### 6. TypeScript Errors

**Cause:** Missing type definitions or incorrect types.

**Solutions:**
- Ensure TypeScript is properly configured
- Import types from the SDK: `import type { ConsentAction } from '@truconsent/consent-banner-react-native'`
- Check that all required props have correct types

### Debug Mode

Enable debug logging by checking console output. The SDK logs:
- Banner loading state
- API requests and responses
- Consent actions
- Errors

### Getting Help

1. Check console logs for error messages
2. Verify all required props are provided
3. Test with a simple example first
4. Check the API credentials in TruConsent dashboard
5. Review the network requests in React Native debugger

---

## Architecture

### Component Structure

```
TruConsentModal (Main Component)
├── useBanner (Hook) - Fetches banner data
├── useConsent (Hook) - Manages consent state
├── BannerUI (Component) - Renders standard consent
├── CookieBannerUI (Component) - Renders cookie consent
└── Modal (React Native) - Provides modal overlay
```

### Data Flow

```
1. Component Mounts
   ↓
2. useBanner fetches banner configuration
   ↓
3. Banner data loaded → useConsent initializes
   ↓
4. User interacts with banner
   ↓
5. useConsent updates purpose states
   ↓
6. User clicks action button
   ↓
7. submitConsent sends data to API
   ↓
8. onClose callback fired with action type
   ↓
9. Component unmounts or hides
```

### Hook Dependencies

```
TruConsentModal
├── useState (visible, actionLoading, error, requestId)
├── useRef (actionTakenRef, actionRunningRef, closeButtonClickedRef)
├── useBanner (banner, isLoading, bannerError)
├── useConsent (purposes, updatePurpose, acceptAll, rejectAll, acceptSelected)
└── useEffect (4 hooks for logging, cleanup, and state management)
```

### File Structure

```
src/
├── components/
│   ├── TruConsentModal.tsx    # Main modal component
│   ├── TruConsent.tsx         # Web parity wrapper
│   ├── BannerUI.tsx           # Standard consent UI
│   ├── CookieBannerUI.tsx    # Cookie consent UI
│   └── ...                    # Supporting components
├── hooks/
│   ├── useBanner.ts           # Banner fetching hook
│   └── useConsent.ts          # Consent state hook
├── core/
│   ├── BannerService.ts       # API client
│   ├── ConsentManager.ts     # Consent utilities
│   └── types.ts               # TypeScript definitions
└── utils/
    ├── i18n.ts                # Internationalization
    ├── RequestIdGenerator.ts  # UUID generation
    └── locales/               # Translation files
```

### State Management

The SDK uses React hooks for state management:
- **Local State**: `useState` for component-specific state
- **Custom Hooks**: `useBanner` and `useConsent` for complex state logic
- **Refs**: `useRef` for values that don't trigger re-renders

### API Integration

The SDK communicates with the TruConsent API using:
- **fetch API**: Native React Native fetch for HTTP requests
- **Headers**: API key and organization ID in request headers
- **Error Handling**: Comprehensive error messages for different HTTP status codes

---

## License

MIT

---

## Support

For issues, questions, or contributions, please refer to the project repository or contact support.

---

**Version:** 0.1.0  
**Last Updated:** January 2026



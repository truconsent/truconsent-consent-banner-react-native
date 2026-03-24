# TruConsent React Native SDK - Complete Integration Guide

This comprehensive guide will help you integrate the TruConsent React Native SDK into your React Native application. We'll use real-world examples from the Mars Money React Native app to demonstrate best practices, including critical React Native-specific patterns.

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Basic Usage - Consent Modal](#basic-usage---consent-modal)
6. [Rights Center Integration](#rights-center-integration)
7. [Complete Examples](#complete-examples)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Introduction

The TruConsent React Native SDK provides native mobile UI components for displaying consent banners and managing user privacy rights. It helps you comply with GDPR and other privacy regulations by:

- Displaying consent banners with customizable purposes
- Collecting and tracking user consent
- Providing a Rights Center for users to manage their data
- Supporting multiple languages (English, Hindi, Tamil)

**Published Package**: [@truconsent/consent-notice-react-native on npm](https://www.npmjs.com/package/@truconsent/consent-notice-react-native)

**GitHub Repository**: [truconsent-consent-banner-react-native](https://github.com/truconsent/truconsent-consent-banner-react-native)

## Prerequisites

Before you begin, ensure you have:

- React Native 0.70.0 or higher
- React 18.0.0 or higher
- Node.js 16.0 or higher
- A TruConsent account with:
  - API Key
  - Organization ID
  - Banner/Collection Point IDs configured
- Basic understanding of React hooks and React Native components

## Installation

### Step 1: Install the Package

Install the TruConsent SDK using npm or yarn:

```bash
npm install @truconsent/consent-notice-react-native
# or
yarn add @truconsent/consent-notice-react-native
```

### Step 2: Install Peer Dependencies

The SDK requires the following peer dependencies. Install them if not already present:

```bash
npm install react react-native react-i18next i18next
# or
yarn add react react-native react-i18next i18next
```

### Step 3: Install Additional Dependencies (for guest ID management)

For managing guest IDs, you'll need AsyncStorage:

```bash
npm install @react-native-async-storage/async-storage
# or
yarn add @react-native-async-storage/async-storage
```

### Step 4: Verify Installation

You can verify the installation by checking your `package.json`:

```json
{
  "dependencies": {
    "@truconsent/consent-notice-react-native": "^0.1.0"
  }
}
```

Or by importing it in a TypeScript/JavaScript file:

```typescript
import TruConsentModal from '@truconsent/consent-notice-react-native';
import { NativeRightCenter } from '@truconsent/consent-notice-react-native';
import type { ConsentAction } from '@truconsent/consent-notice-react-native';
```

If the imports work without errors, the installation is successful.

## Configuration

### Step 1: Configure API Credentials (Expo)

If you're using Expo, add your TruConsent credentials to `app.json`:

**File**: `app.json`

```json
{
  "expo": {
    "extra": {
      "truConsentApiKey": "your-api-key-here",
      "truConsentOrganizationId": "your-organization-id",
      "truConsentApiUrl": "https://your-api-url.com"
    }
  }
}
```

### Step 2: Configure API Credentials (React Native CLI)

If you're using React Native CLI (not Expo), you can use environment variables or a config file:

**Option A: Environment Variables**

Create a `.env` file:

```env
TRUCONSENT_API_KEY=your-api-key-here
TRUCONSENT_ORG_ID=your-organization-id
TRUCONSENT_API_URL=https://your-api-url.com
```

Install `react-native-dotenv`:

```bash
npm install react-native-dotenv
```

**Option B: Config File**

Create a config file:

**File**: `src/config/truconsent.ts`

```typescript
export const TruConsentConfig = {
  apiKey: 'your-api-key-here',
  organizationId: 'your-organization-id',
  apiUrl: 'https://your-api-url.com',
  companyName: 'Your Company Name',
  logoUrl: undefined, // Optional
};
```

**Important**: Replace the placeholder values with your actual credentials from your TruConsent dashboard.

### Step 3: Create a Guest ID Utility

For unauthenticated users, you'll need to generate and persist a guest ID. Create a utility file:

**File**: `src/utils/guestId.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_ID_KEY = "guest_id";

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function getOrCreateGuestId(): Promise<string> {
  try {
    // Return existing ID if present
    const existing = await AsyncStorage.getItem(GUEST_ID_KEY);
    if (existing) return existing;

    // Generate new UUID
    const guestId = generateUUID();

    // Persist in AsyncStorage
    await AsyncStorage.setItem(GUEST_ID_KEY, guestId);

    return guestId;
  } catch (error) {
    console.error('Error managing guest ID:', error);
    // Fallback to a random UUID if storage fails
    return generateUUID();
  }
}

export async function getGuestIdFromStorage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(GUEST_ID_KEY);
  } catch (error) {
    console.error('Error getting guest ID:', error);
    return null;
  }
}
```

## Basic Usage - Consent Modal

The `TruConsentModal` component displays a consent banner that users interact with before submitting forms or accessing features.

### ⚠️ CRITICAL: React Native Hook Consistency

**IMPORTANT**: React Native has strict rules about hook usage. The SDK uses hooks internally, so you **MUST** follow these patterns to avoid "Rendered fewer hooks" errors:

1. **All hooks must be called unconditionally** - Never call hooks inside conditions, loops, or nested functions
2. **Hook order must be consistent** - Hooks must be called in the same order on every render
3. **Use a wrapper component** - Create a wrapper component that handles hook consistency

### Step 1: Create a Consent Modal Wrapper Component

Create a wrapper component that ensures proper hook usage:

**File**: `src/components/consent/ConsentModal.tsx`

```typescript
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import TruConsentModal from '@truconsent/consent-notice-react-native';
import Constants from 'expo-constants'; // If using Expo
// import { TruConsentConfig } from '../config/truconsent'; // If using config file
import type { ConsentAction } from '@truconsent/consent-notice-react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  truConsentApiKey?: string;
  truConsentOrganizationId?: string;
};

interface ConsentModalProps {
  bannerId: string;
  userId: string;
  logoUrl?: string;
  companyName?: string;
  onClose?: (type: ConsentAction) => void;
  visible?: boolean;
}

export function ConsentModal({
  bannerId,
  userId,
  logoUrl,
  companyName,
  onClose,
  visible = false,
}: ConsentModalProps) {
  // ============================================
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY
  // ============================================
  // All hooks are declared at the top level and called in the same order
  // on every render, regardless of any conditions or early returns below.
  
  const apiKey = extra.truConsentApiKey ?? '';
  const organizationId = extra.truConsentOrganizationId ?? 'your-org-id';
  
  // State hooks - always called
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasBeenMounted, setHasBeenMounted] = useState(false);
  
  // Memoized values - always called
  const isReady = useMemo(() => {
    const hasApiKey = !!apiKey;
    const hasUserId = !!userId;
    
    if (!hasApiKey) {
      console.warn('TruConsent API key not configured');
    }
    if (!hasUserId) {
      console.warn('User ID is required for ConsentModal');
    }
    
    return hasApiKey && hasUserId;
  }, [apiKey, userId]);

  // Effect hooks - always called
  // Mark as mounted when visible becomes true
  useEffect(() => {
    if (visible && isReady) {
      setHasBeenMounted((prev) => prev || true);
    }
  }, [visible, isReady]);

  // Keep component mounted during processing
  useEffect(() => {
    if (isProcessing) {
      setHasBeenMounted((prev) => prev || true);
    }
  }, [isProcessing]);
  
  // CRITICAL: Once mounted, never unmount to maintain hook consistency
  useEffect(() => {
    if (hasBeenMounted) {
      // Keep it mounted - don't reset hasBeenMounted
      // This prevents hook order issues when SDK's internal state changes
    }
  }, [hasBeenMounted]);

  // Callback hooks - always called
  const handleClose = useCallback((type: ConsentAction) => {
    // CRITICAL: Set both states immediately and synchronously
    setIsProcessing(true);
    setHasBeenMounted((prev) => {
      // Always set to true - never allow it to be false once it's been true
      return true;
    });
    
    const actionType = String(type);
    console.log('Consent action received:', actionType);

    // Call parent onClose handler with delay to ensure SDK operations complete
    if (onClose) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            onClose(type);
          } finally {
            // Reset processing after delay to allow all operations to complete
            setTimeout(() => {
              setIsProcessing(false);
            }, 1500);
          }
        }, 100);
      });
    } else {
      setTimeout(() => {
        setIsProcessing(false);
      }, 1500);
    }
  }, [bannerId, userId, organizationId, onClose]);

  // ============================================
  // CONDITIONAL LOGIC BELOW ALL HOOKS
  // ============================================
  // All hooks have been called above. Now we can safely return early
  // or conditionally render without affecting hook order.

  // Early return only if not ready - after all hooks have been called
  if (!isReady) {
    return null;
  }

  // CRITICAL: Always render TruConsentModal when ready to maintain hook consistency
  // Once hasBeenMounted is true, we ALWAYS render it, regardless of visible state.
  if (!visible && !hasBeenMounted) {
    return null;
  }

  // Always render TruConsentModal with stable key to prevent unnecessary remounts
  return (
    <TruConsentModal
      key={`consent-${bannerId}-${userId}`}
      apiKey={apiKey}
      organizationId={organizationId}
      bannerId={bannerId}
      userId={userId}
      logoUrl={logoUrl}
      companyName={companyName || 'Your Company'}
      onClose={handleClose}
    />
  );
}
```

### Step 2: Integrate Consent Modal in Your Form

Here's how to integrate the consent modal in a form screen:

```typescript
import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { ConsentModal } from '@/components/consent/ConsentModal';
import { useAuth } from '@/contexts/AuthContext'; // Your auth context
import { getOrCreateGuestId } from '@/utils/guestId';
import type { ConsentAction } from '@truconsent/consent-notice-react-native';

export function SavingsAccountForm({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [guestId, setGuestId] = useState<string | null>(null);

  const onSubmit = async (data: any) => {
    console.log('Form submitted with data:', data);
    setFormData(data);
    
    // Get or create guest ID if user is not authenticated
    if (!user) {
      const id = await getOrCreateGuestId();
      setGuestId(id);
      console.log('Guest ID created:', id);
    }
    
    // Show consent banner
    setTimeout(() => {
      setShowBanner(true);
    }, 100);
  };

  const onConsentClose = async (type: ConsentAction) => {
    console.log('Consent action received:', type);
    
    // Delay state updates to ensure SDK operations complete
    setTimeout(async () => {
      if (type === "approved" && formData) {
        // Only save application when consent is fully approved
        console.log('Consent approved, saving application...');
        await handleSaveApplication(formData);
        
        // Delay before closing banner
        setTimeout(() => {
          setShowBanner(false);
          setTimeout(() => onBack(), 500);
        }, 300);
      } else if (type === "declined" || type === "rejected") {
        // User rejected consent
        console.log('Consent rejected by user');
        setTimeout(() => {
          setShowBanner(false);
        }, 300);
      } else {
        // Handle partial consent or other actions
        console.log('Consent partially accepted or other action:', type);
        setTimeout(() => {
          setShowBanner(false);
        }, 300);
      }
    }, 300);
  };

  return (
    <ScrollView>
      <ConsentModal
        bannerId="CP003"
        userId={user?.id || guestId || ''}
        onClose={onConsentClose}
        visible={showBanner}
        companyName="Your Company"
      />
      
      {/* Your form content */}
      <View>
        {/* Form fields */}
        <Button onPress={onSubmit}>Submit</Button>
      </View>
    </ScrollView>
  );
}
```

### Understanding Consent Actions

The `onClose` callback receives a `ConsentAction` string value:

- **`"approved"`**: User accepted all purposes - proceed with submission
- **`"declined"`** or **`"rejected"`**: User rejected all purposes - block submission
- **`"partialConsent"`** or **`"partial_consent"`**: User accepted some purposes - proceed with limitations
- **`"revoked"`**: User revoked previously given consent - block submission
- **`"noAction"`**: User closed the banner without action - handle appropriately

## Rights Center Integration

The `NativeRightCenter` component provides a complete Rights Center interface where users can:

- View and manage consent records
- Exercise data rights (deletion, download)
- View transparency information
- Contact the Data Protection Officer (DPO)
- Manage nominees
- Submit and view grievance tickets

### Step 1: Create a Rights Center Screen

**File**: `app/rights-center.tsx` (for Expo Router) or `src/screens/RightsCenterScreen.tsx`

```typescript
import { View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeRightCenter } from '@truconsent/consent-notice-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateGuestId } from '@/utils/guestId';
import { useEffect, useState } from 'react';
import Constants from 'expo-constants'; // If using Expo

const extra = (Constants.expoConfig?.extra ?? {}) as {
  truConsentApiKey?: string;
  truConsentOrganizationId?: string;
  truConsentApiUrl?: string;
};

const TRUCONSENT_API_KEY = extra.truConsentApiKey ?? 'your-api-key';
const TRUCONSENT_ORG_ID = extra.truConsentOrganizationId ?? 'your-org-id';
const TRUCONSENT_API_URL = extra.truConsentApiUrl ?? 'https://your-api-url.com';

export default function RightsCenterScreen() {
  const { user } = useAuth();
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log('[RightsCenterScreen] Screen opened');
    const loadUserId = async () => {
      setIsLoading(true);
      try {
        if (user) {
          console.log('[RightsCenterScreen] Using authenticated user ID:', user.id);
          setUserId(user.id);
        } else {
          const guestId = await getOrCreateGuestId();
          console.log('[RightsCenterScreen] Using guest ID:', guestId);
          setUserId(guestId);
        }
      } catch (error) {
        console.error('[RightsCenterScreen] Error loading user ID:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserId();
  }, [user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#9333ea" />
        <Text style={{ color: '#666', marginTop: 16 }}>Loading Rights Center...</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 8 }}>
          Unable to load Rights Center
        </Text>
        <Text style={{ color: '#666', textAlign: 'center' }}>
          Please try again later
        </Text>
      </View>
    );
  }

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: 'white',
        paddingTop: insets.top 
      }}
    >
      <NativeRightCenter
        userId={userId}
        apiKey={TRUCONSENT_API_KEY}
        organizationId={TRUCONSENT_ORG_ID}
        apiUrl={TRUCONSENT_API_URL}
      />
    </View>
  );
}
```

### Step 2: Add Navigation to Rights Center

Add a button or menu item to navigate to the Rights Center:

```typescript
import { useRouter } from 'expo-router'; // For Expo Router
// or
import { NavigationContainer, useNavigation } from '@react-navigation/native'; // For React Navigation

// In your component:
const router = useRouter(); // Expo Router
// or
const navigation = useNavigation(); // React Navigation

// Navigate:
router.push('/rights-center'); // Expo Router
// or
navigation.navigate('RightsCenter'); // React Navigation
```

## Complete Examples

### Example 1: Complete Form with Consent Modal

This example shows a complete form integration pattern from the Mars Money app:

```typescript
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { View, Text, ScrollView } from "react-native";
import { Button } from "@/components/ui/button";
import { ConsentModal } from "@/components/consent/ConsentModal";
import { useAuth } from "@/contexts/AuthContext";
import { getOrCreateGuestId } from "@/utils/guestId";
import type { ConsentAction } from '@truconsent/consent-notice-react-native';

export const SavingsAccountForm = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const form = useForm();

  const onSubmit = async (data: any) => {
    console.log('Form submitted with data:', data);
    setFormData(data);
    
    if (!user) {
      const id = await getOrCreateGuestId();
      setGuestId(id);
      console.log('Guest ID created:', id);
    }
    
    // Show consent banner
    setTimeout(() => {
      setShowBanner(true);
    }, 100);
  };

  const onConsentClose = async (type: ConsentAction) => {
    console.log('Consent action received:', type);
    
    setTimeout(async () => {
      if (type === "approved" && formData) {
        console.log('Consent approved, saving application...');
        await handleSaveApplication(formData);
        
        setTimeout(() => {
          setShowBanner(false);
          setTimeout(() => onBack(), 500);
        }, 300);
      } else if (type === "declined" || type === "rejected") {
        console.log('Consent rejected by user');
        setTimeout(() => {
          setShowBanner(false);
        }, 300);
      } else {
        console.log('Consent partially accepted or other action:', type);
        setTimeout(() => {
          setShowBanner(false);
        }, 300);
      }
    }, 300);
  };

  return (
    <ScrollView>
      <ConsentModal
        bannerId="CP003"
        userId={user?.id || guestId || ''}
        onClose={onConsentClose}
        visible={showBanner}
        companyName="Mars Money"
      />
      
      <View>
        <Controller
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <Input
              placeholder="Full Name"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        
        {/* More form fields */}
        
        <Button onPress={form.handleSubmit(onSubmit)}>
          Submit Application
        </Button>
      </View>
    </ScrollView>
  );
};
```

## Troubleshooting

### Issue: "Rendered fewer hooks than expected" Error

**Symptoms**: App crashes with "Rendered fewer hooks than expected" error.

**Cause**: This happens when hooks are called conditionally or in different orders between renders.

**Solutions**:
1. **Use the wrapper component pattern**: Always use the `ConsentModal` wrapper component shown in this guide
2. **Call all hooks unconditionally**: Never call hooks inside `if` statements, loops, or callbacks
3. **Keep component mounted**: Once `hasBeenMounted` is true, always render the component
4. **Use stable keys**: Provide a stable `key` prop to prevent remounting

**Example Fix**:
```typescript
// ❌ WRONG - Conditional hook call
if (visible) {
  const [state, setState] = useState(false); // ERROR!
}

// ✅ CORRECT - Unconditional hook call
const [state, setState] = useState(false);
if (!visible) return null; // Early return AFTER hooks
```

### Issue: Banner Not Loading

**Symptoms**: The consent modal shows a loading spinner indefinitely or displays an error.

**Solutions**:
1. **Check API Credentials**: Verify your `apiKey` and `organizationId` in `app.json` or config
2. **Verify Banner ID**: Ensure the banner ID exists in your TruConsent dashboard
3. **Check Network**: Ensure the device has internet connectivity
4. **Check API Base URL**: If using a custom API base URL, verify it's correct
5. **Check Console Logs**: Look for error messages in the React Native debugger

### Issue: User ID Not Available

**Symptoms**: Rights Center or consent modal doesn't load.

**Solutions**:
1. **Ensure Guest ID is Generated**: Call `getOrCreateGuestId()` before showing the modal
2. **Check User Authentication**: If using authenticated users, verify the user ID is available
3. **Add Loading State**: Show a loading indicator while fetching user/guest ID
4. **Check AsyncStorage**: Ensure AsyncStorage is properly configured

### Issue: Consent Not Submitting

**Symptoms**: User interacts with banner but consent isn't recorded.

**Solutions**:
1. **Check API Endpoint**: Verify the API base URL is accessible
2. **Check Network**: Ensure device has internet connectivity
3. **Verify User ID**: Ensure a valid user ID is being passed
4. **Check Console Logs**: Look for API error responses
5. **Add Delays**: Use `setTimeout` to ensure SDK operations complete before state updates

### Issue: Modal Not Displaying

**Symptoms**: `showBanner` is true but modal doesn't appear.

**Solutions**:
1. **Check User ID**: Ensure `userId` is not empty
2. **Check Hook Consistency**: Ensure all hooks are called unconditionally
3. **Check Component Mounting**: Verify `hasBeenMounted` state is managed correctly
4. **Check Visible Prop**: Ensure `visible` prop is being passed correctly

## Best Practices

### 1. Hook Consistency (CRITICAL for React Native)

- **Always call hooks unconditionally**: Never call hooks inside conditions, loops, or nested functions
- **Use wrapper components**: Create wrapper components that handle hook consistency
- **Keep components mounted**: Once a component with hooks is mounted, keep it mounted to maintain hook order
- **Use stable keys**: Provide stable `key` props to prevent unnecessary remounts

### 2. User ID Management

- **Always use authenticated user ID when available**: This ensures consent is properly tracked per user
- **Generate guest ID early**: Call `getOrCreateGuestId()` before showing the modal
- **Persist guest ID**: Use AsyncStorage to maintain the same guest ID across app sessions
- **Handle loading states**: Show loading indicators while fetching user/guest ID

### 3. Consent Modal Timing

- **Show before form submission**: Display the consent modal when the user clicks submit, not before
- **Handle loading states**: Show a loading indicator while the guest ID is being generated
- **Add delays for state updates**: Use `setTimeout` to ensure SDK operations complete before updating state
- **Provide user feedback**: Use toasts or alerts to inform users about consent actions

### 4. Error Handling

- **Always check for empty user ID**: Don't show the modal if user ID is empty
- **Handle network errors gracefully**: Show user-friendly error messages
- **Log errors for debugging**: Use `console.log` or logging libraries to track issues
- **Add retry mechanisms**: Allow users to retry failed operations

### 5. Configuration Management

- **Use app.json for Expo**: Store credentials in `app.json` for Expo apps
- **Use environment variables for React Native CLI**: Consider using `.env` files for React Native CLI apps
- **Don't hardcode credentials**: Never commit API keys to version control
- **Map banner IDs**: Create a mapping system for different services to banner IDs

### 6. State Management

- **Use proper state management**: If using Redux, Zustand, or Context, integrate TruConsent widgets properly
- **Avoid unnecessary re-renders**: Use `useMemo` and `useCallback` where appropriate
- **Clean up resources**: Remove listeners and cancel operations in cleanup functions

### 7. User Experience

- **Show consent at the right time**: Don't show consent banners too early or too late in the user flow
- **Provide clear feedback**: Inform users about what happens after they give consent
- **Handle all consent actions**: Don't ignore `partialConsent` or `noAction` cases
- **Add loading indicators**: Show loading states during async operations

### 8. Performance

- **Lazy load components**: Only load consent components when needed
- **Optimize re-renders**: Use React.memo and useMemo where appropriate
- **Minimize API calls**: Cache banner data when possible
- **Use stable references**: Avoid creating new object/array references in render

## Additional Resources

- **SDK Documentation**: [npm package page](https://www.npmjs.com/package/@truconsent/consent-notice-react-native)
- **GitHub Repository**: [truconsent-consent-banner-react-native](https://github.com/truconsent/truconsent-consent-banner-react-native)
- **Example App**: [mars-money-app-react-native](https://github.com/truconsent/mars-money-app-react-native)

## Support

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/truconsent/truconsent-consent-banner-react-native/issues)
2. Review the SDK source code for implementation details
3. Contact TruConsent support with:
   - SDK version
   - React Native version
   - React version
   - Error messages/logs
   - Steps to reproduce

---

**Last Updated**: Based on SDK version 0.1.0

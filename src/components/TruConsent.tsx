/**
 * TruConsent - Web parity wrapper (auto-showing modal)
 *
 * The web SDK exports a `TruConsent` component which simply renders `TruConsentModal`.
 * We keep the same API shape for React Native.
 */
import React from 'react';
import TruConsentModal from './TruConsentModal';
import type { TruConsentConfig } from '../core/types';

export default function TruConsent(props: TruConsentConfig) {
  return <TruConsentModal {...props} />;
}



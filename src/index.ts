/**
 * TruConsent React Native SDK - Main entry point
 */
export { default as TruConsentModal } from './components/TruConsentModal';
export { default as BannerUI } from './components/BannerUI';
export { default as CookieBannerUI } from './components/CookieBannerUI';

export * from './core/types';
export * from './core/BannerService';
export * from './core/ConsentManager';
export * from './hooks/useBanner';
export * from './hooks/useConsent';
export * from './utils/RequestIdGenerator';

// Default export
export { default } from './components/TruConsentModal';


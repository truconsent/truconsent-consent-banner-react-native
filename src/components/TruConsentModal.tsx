/**
 * TruConsentModal - Main React Native component for displaying consent banner
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { I18nextProvider } from 'react-i18next';
import i18n from '../utils/i18n';
import { TruConsentConfig, ConsentAction, Banner, Purpose } from '../core/types';
import { useBanner } from '../hooks/useBanner';
import { useConsent } from '../hooks/useConsent';
import { submitConsent } from '../core/BannerService';
import { generateRequestId } from '../utils/RequestIdGenerator';
import BannerUI from './BannerUI';
import CookieBannerUI from './CookieBannerUI';

export default function TruConsentModal(props: TruConsentConfig) {
  const {
    apiKey,
    organizationId,
    bannerId,
    userId,
    apiBaseUrl = 'https://rdwcymn5poo6zbzg5fa5xzjsqy0zzcpm.lambda-url.ap-south-1.on.aws/banners',
    logoUrl,
    companyName = 'Mars Company',
    onClose,
  } = props;

  const [visible, setVisible] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionTakenRef = useRef(false);
  const actionRunningRef = useRef(false);
  const closeButtonClickedRef = useRef(false);
  const [requestId] = useState(() => generateRequestId());

  const bannerConfig = bannerId && apiKey && organizationId
    ? { bannerId, apiKey, organizationId, apiBaseUrl }
    : null;

  const { banner, isLoading, error: bannerError } = useBanner(bannerConfig);

  // Log banner state for debugging
  useEffect(() => {
    console.log('TruConsentModal - Banner state:', {
      isLoading,
      hasBanner: !!banner,
      error: bannerError,
      bannerId,
      purposesCount: banner?.purposes?.length || 0,
    });
  }, [isLoading, banner, bannerError, bannerId]);

  const { purposes, updatePurpose, acceptAll, rejectAll, acceptSelected, setPurposes } =
    useConsent(banner?.purposes || []);

  // Update purposes when banner loads
  useEffect(() => {
    if (banner?.purposes) {
      setPurposes(banner.purposes);
    }
  }, [banner?.purposes, setPurposes]);

  // Derive company / logo from banner.organization when available
  const resolvedCompanyName =
    (banner && (banner.organization_name || banner.organization?.name)) || companyName;
  const resolvedLogoUrl = (banner && banner.organization?.logo_url) || logoUrl;

  const close = (type: ConsentAction) => {
    setVisible(false);
    if (onClose) onClose(type);
  };

  const sendLogEvent = async (action: ConsentAction, purposesToSend?: Purpose[]) => {
    if (!banner || actionRunningRef.current) return;

    if (action !== 'no_action') {
      actionTakenRef.current = true;
    }

    actionRunningRef.current = true;
    try {
      await submitConsent({
        collectionPointId: banner.collection_point,
        userId,
        purposes: purposesToSend || purposes,
        action,
        apiKey,
        organizationId,
        requestId,
        apiBaseUrl,
      });
    } catch (e: any) {
      console.error('Failed to log consent event:', e);
      throw e;
    } finally {
      actionRunningRef.current = false;
    }
  };

  // Cleanup effect to record "no_action" ONLY if close button was clicked
  useEffect(() => {
    return () => {
      if (
        closeButtonClickedRef.current &&
        !actionTakenRef.current &&
        banner &&
        !actionRunningRef.current
      ) {
        sendLogEvent('no_action');
      }
    };
  }, [banner]);

  // Debug logging - MUST be before any conditional returns
  useEffect(() => {
    if (banner) {
      console.log('Banner loaded in modal:', {
        bannerId: banner.banner_id,
        title: banner.title || banner.name,
        purposesCount: banner.purposes?.length || 0,
        consentType: banner.consent_type,
        hasSettings: !!banner.banner_settings,
      });
    }
  }, [banner]);

  const handleAction = async (action: ConsentAction) => {
    if (!banner) return;
    setActionLoading(true);
    setError(null);

    try {
      await sendLogEvent(action);
      close(action);
    } catch (e: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptSelected = async () => {
    if (!banner) return;
    setActionLoading(true);
    setError(null);

    try {
      const updatedPurposes = acceptSelected();
      await sendLogEvent('approved', updatedPurposes);
      close('approved');
    } catch (e: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseClick = () => {
    closeButtonClickedRef.current = true;

    if (!actionTakenRef.current) {
      sendLogEvent('no_action');
      actionTakenRef.current = true;
    }
    close('no_action');
  };

  // Conditional return - must be AFTER all hooks
  if (!visible) return null;

  const displayError = error || bannerError;

  return (
    <I18nextProvider i18n={i18n}>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseClick}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseClick}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading banner...</Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                bounces={false}
              >
                {displayError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                      {displayError.includes('Banner not found') 
                        ? 'Banner not found. Please check the Banner ID and try again.'
                        : displayError.includes('Authentication') || displayError.includes('Invalid')
                        ? 'Authentication failed. Please check your API key and Organization ID.'
                        : displayError.includes('forbidden')
                        ? 'Access denied. Your API key does not have permission to access this banner.'
                        : `Error: ${displayError}`}
                    </Text>
                    <Text style={styles.errorSubtext}>
                      Please check your API credentials and banner ID, then try again.
                    </Text>
                  </View>
                )}

                {!displayError && !banner && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No banner data available</Text>
                  </View>
                )}

                {!displayError && banner && (
                  <>
                    {banner.consent_type === 'cookie_consent' ? (
                      <CookieBannerUI
                        banner={banner}
                        companyName={resolvedCompanyName}
                        logoUrl={resolvedLogoUrl}
                        onRejectAll={() => handleAction('declined')}
                        onConsentAll={() => handleAction('approved')}
                      />
                    ) : (
                      <BannerUI
                        banner={{ ...banner, purposes }}
                        companyName={resolvedCompanyName}
                        logoUrl={resolvedLogoUrl}
                        onChangePurpose={updatePurpose}
                        onRejectAll={() => handleAction('declined')}
                        onConsentAll={() => handleAction('approved')}
                        onAcceptSelected={handleAcceptSelected}
                      />
                    )}
                    {(!banner.purposes || banner.purposes.length === 0) && (
                      <View style={styles.warningContainer}>
                        <Text style={styles.warningText}>
                          Warning: No purposes found in banner data
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </I18nextProvider>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isMobile = SCREEN_WIDTH < 768;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 12 : 20,
    paddingTop: isMobile ? 20 : 28,
    paddingBottom: isMobile ? 20 : 28,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: isMobile ? '96%' : '90%',
    maxWidth: 720,
    height: isMobile ? SCREEN_HEIGHT - 80 : undefined,
    maxHeight: isMobile ? SCREEN_HEIGHT - 80 : SCREEN_HEIGHT * 0.9,
    padding: isMobile ? 20 : 24,
    minHeight: isMobile ? SCREEN_HEIGHT * 0.75 : 200,
    position: 'relative',
    // Card popup styling
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // For Android
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '600',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 32,
    flexGrow: 1,
    minHeight: '100%',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  errorSubtext: {
    color: '#991b1b',
    fontSize: 12,
    marginTop: 4,
  },
  warningContainer: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  warningText: {
    color: '#92400e',
    fontSize: 12,
  },
});


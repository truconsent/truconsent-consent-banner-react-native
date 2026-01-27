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
} from 'react-native';
import { I18nextProvider } from 'react-i18next';
import i18n from '../utils/i18n';
import { TruConsentConfig, ConsentAction, Banner } from '../core/types';
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

  const { banner, isLoading, error: bannerError } = useBanner(
    bannerId && apiKey && organizationId
      ? { bannerId, apiKey, organizationId, apiBaseUrl }
      : null
  );

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
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {displayError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{displayError}</Text>
                  </View>
                )}

                {banner &&
                  (banner.consent_type === 'cookie_consent' ? (
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
                  ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
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
  },
  scrollContent: {
    paddingBottom: 20,
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
  },
});


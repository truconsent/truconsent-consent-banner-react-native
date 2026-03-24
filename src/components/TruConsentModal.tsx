/**
 * TruConsentModal - Main React Native component for displaying consent banner
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import ModernBannerHeader from './ModernBannerHeader';
import ModernBannerFooter from './ModernBannerFooter';

export default function TruConsentModal(props: TruConsentConfig) {
  const {
    apiKey,
    organizationId,
    bannerId,
    userId,
    apiUrl,
    assetId,
    token,
    authToken,
    logoUrl,
    companyName = 'Mars Company',
    onClose,
  } = props;

  const apiKeyValue = apiKey ?? '';

  const [visible, setVisible] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionTakenRef = useRef(false);
  const actionRunningRef = useRef(false);
  const closeButtonClickedRef = useRef(false);
  const [requestId] = useState(() => generateRequestId());

  const bannerConfig = bannerId && apiKeyValue && organizationId && apiUrl
    ? {
        bannerId,
        apiKey: apiKeyValue,
        organizationId,
        apiUrl,
        assetId,
        userId,
        token,
        authToken,
      }
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

  const defaultSelection = (banner?.banner_settings as any)?.default_selection ?? 'mandatory_only';

  const isNoticePurpose = (p: any) => {
    const isLegitimate =
      Boolean(p?.is_legitimate ?? p?.isLegitimate) ||
      String(p?.purpose_type ?? p?.purposeType ?? '').toLowerCase().includes('legitimate');
    return isLegitimate;
  };

  const normalizedPurposes = React.useMemo(() => {
    const rawPurposes: any[] = Array.isArray(banner?.purposes) ? (banner?.purposes as any[]) : [];
    return rawPurposes.map((p) => {
      const notice = isNoticePurpose(p);
      const isMandatory = Boolean(p?.is_mandatory);

      const checked =
        notice || isMandatory
          ? 'accepted'
          : defaultSelection === 'all'
          ? 'accepted'
          : defaultSelection === 'none'
          ? 'declined'
          : // mandatory_only
            'declined';

      return {
        ...p,
        consented: checked,
      } as Purpose;
    });
  }, [banner?.purposes, defaultSelection]);

  // Memoize filtered arrays to avoid creating new references on every render.
  // This prevents the sync effect below from re-triggering infinitely.
  const noticePurposes = useMemo(
    () => normalizedPurposes.filter((p) => isNoticePurpose(p)),
    [normalizedPurposes]
  );
  const consentPurposes = useMemo(
    () => normalizedPurposes.filter((p) => !isNoticePurpose(p)),
    [normalizedPurposes]
  );

  const { purposes, updatePurpose, setPurposes } = useConsent(consentPurposes);
  const syncedPurposesKeyRef = useRef('');

  // Update purposes when banner loads
  useEffect(() => {
    // Guard against repeated state writes when payload has not changed.
    const syncKey = JSON.stringify(
      consentPurposes.map((p) => ({
        id: p.id,
        consented: p.consented,
        is_mandatory: p.is_mandatory,
      }))
    );

    if (syncedPurposesKeyRef.current !== syncKey) {
      syncedPurposesKeyRef.current = syncKey;
      setPurposes(consentPurposes);
    }
  }, [consentPurposes, setPurposes]);

  // Derive company / logo from banner.organization when available
  const resolvedCompanyName =
    (banner && (banner.organization_name || banner.organization?.name)) || companyName;
  const resolvedLogoUrl = (banner && banner.organization?.logo_url) || logoUrl;

  const templateKey = (banner?.banner_settings as any)?.general_notice_template || 'center_modal';

  const close = (type: ConsentAction) => {
    setVisible(false);
    if (onClose) onClose(type);
  };

  const noticePurposesPayload: Purpose[] = noticePurposes.map((p) => ({
    ...p,
    consented: 'accepted',
  }));

  const buildAllPurposesPayload = (consentPurposesPayload: Purpose[]) => [
    ...noticePurposesPayload,
    ...consentPurposesPayload,
  ];

  const submitPurposes = async (
    action: ConsentAction,
    purposesPayload: Purpose[],
    metadata?: Record<string, any>
  ) => {
    if (!banner || actionRunningRef.current) return;

    if (action !== 'no_action') {
      actionTakenRef.current = true;
    }

    actionRunningRef.current = true;
    try {
      await submitConsent({
        collectionPointId: banner.collection_point,
        userId,
        purposes: purposesPayload,
        action,
        apiKey: apiKeyValue,
        organizationId,
        requestId,
        apiUrl,
        assetId,
        metadata,
      });
    } catch (e: any) {
      console.error('Failed to log consent event:', e);
      throw e;
    } finally {
      actionRunningRef.current = false;
    }
  };

  const sendNoticeShown = async (buttonUsed: string) => {
    if (!noticePurposesPayload.length) return;

    await submitPurposes('notice_shown', noticePurposesPayload, {
      button_used: buttonUsed,
      event_type: 'notice_shown',
      collection_point_version: banner?.version ?? 1,
    });
  };

  const sendConsentAction = async (
    action: ConsentAction,
    consentPurposesPayload: Purpose[],
    buttonUsed?: string
  ) => {
    const metadata = buttonUsed
      ? {
          button_used: buttonUsed,
          collection_point_version: banner?.version ?? 1,
        }
      : undefined;

    await submitPurposes(action, buildAllPurposesPayload(consentPurposesPayload), metadata);
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
        void submitPurposes('no_action', buildAllPurposesPayload(purposes));
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

  const handleRejectAll = async () => {
    if (!banner) return;
    setActionLoading(true);
    setError(null);

    try {
      const consentPayload: Purpose[] = purposes.map((p) => ({ ...p, consented: 'declined' }));
      const buttonUsed = 'reject_all';

      await sendNoticeShown(buttonUsed);
      await sendConsentAction('declined', consentPayload, buttonUsed);
      close('declined');
    } catch (e: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConsentAll = async () => {
    if (!banner) return;
    setActionLoading(true);
    setError(null);

    try {
      const consentPayload: Purpose[] = purposes.map((p) => ({ ...p, consented: 'accepted' }));
      const buttonUsed = 'accept_all';

      await sendNoticeShown(buttonUsed);
      await sendConsentAction('approved', consentPayload, buttonUsed);
      close('approved');
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
      // Match web semantics: mandatory purposes are accepted; optional keep the user's selection.
      const consentPayload: Purpose[] = purposes.map((p) =>
        p.is_mandatory ? { ...p, consented: 'accepted' } : p
      );

      const anyOptionalAccepted = consentPayload.some(
        (p) => !p.is_mandatory && p.consented === 'accepted'
      );

      const buttonUsed = anyOptionalAccepted ? 'save_preferences' : 'only_necessary';

      const allAccepted = consentPayload.every((p) => p.consented === 'accepted');
      const allDeclined = consentPayload.every((p) => p.consented === 'declined');

      const consentAction: ConsentAction =
        consentPayload.length === 0
          ? 'no_action'
          : allAccepted
          ? 'approved'
          : allDeclined
          ? 'declined'
          : 'partial_consent';

      await sendNoticeShown(buttonUsed);
      await sendConsentAction(consentAction, consentPayload, buttonUsed);
      close(consentAction);
    } catch (e: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledgeNotice = async () => {
    if (!banner) return;
    setActionLoading(true);
    setError(null);

    try {
      const buttonUsed = 'i_understand';
      await sendNoticeShown(buttonUsed);
      close('notice_shown');
    } catch (e: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseClick = () => {
    closeButtonClickedRef.current = true;

    if (!actionTakenRef.current) {
      void submitPurposes('no_action', buildAllPurposesPayload(purposes));
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
                    {templateKey === 'notice_only' && banner.consent_type !== 'cookie_consent' ? (
                      <View>
                        {noticePurposesPayload.length > 0 ? (
                          <>
                            <ModernBannerHeader
                              logoUrl={(banner?.banner_settings as any)?.logo_url || resolvedLogoUrl}
                              orgName={resolvedCompanyName}
                              bannerTitle={(banner?.banner_settings as any)?.banner_title}
                              disclaimerText={(banner?.banner_settings as any)?.disclaimer_text}
                            />

                            <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
                              {noticePurposesPayload.map((p) => (
                                <View key={p.id} style={styles.noticePurposeCard}>
                                  <Text style={styles.noticePurposeTitle}>{p.name}</Text>
                                  {p.description ? (
                                    <Text style={styles.noticePurposeDescription}>{p.description}</Text>
                                  ) : null}
                                </View>
                              ))}
                            </View>

                            <View style={{ marginTop: 16 }}>
                              <ModernBannerFooter
                                footerText={
                                  (banner?.banner_settings as any)?.footer_text ||
                                  'Review our [Privacy Policy] and [Transparency Centre], [DPO Details]. Use the [Rights Centre] anytime to withdraw consent, delete data, name a nominee, or raise a grievance.'
                                }
                                orgName={resolvedCompanyName}
                              />

                              <TouchableOpacity
                                style={[
                                  styles.noticeAcknowledgeButton,
                                  { opacity: actionLoading ? 0.7 : 1 },
                                ]}
                                onPress={handleAcknowledgeNotice}
                                disabled={actionLoading}
                              >
                                {actionLoading ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  <Text style={styles.noticeAcknowledgeButtonText}>
                                    {(banner?.banner_settings as any)?.action_button_text || 'I Understand'}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          </>
                        ) : (
                          <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>No notice content available</Text>
                          </View>
                        )}
                      </View>
                    ) : banner.consent_type === 'cookie_consent' ? (
                      <CookieBannerUI
                        banner={banner}
                        companyName={resolvedCompanyName}
                        logoUrl={resolvedLogoUrl}
                        onRejectAll={handleRejectAll}
                        onConsentAll={handleConsentAll}
                      />
                    ) : (
                      <BannerUI
                        banner={{ ...banner, purposes }}
                        companyName={resolvedCompanyName}
                        logoUrl={resolvedLogoUrl}
                        onChangePurpose={updatePurpose}
                        onRejectAll={handleRejectAll}
                        onConsentAll={handleConsentAll}
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
  noticePurposeCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  noticePurposeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  noticePurposeDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  noticeAcknowledgeButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 10,
    backgroundColor: '#7030bc',
    paddingVertical: 14,
    alignItems: 'center',
  },
  noticeAcknowledgeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});


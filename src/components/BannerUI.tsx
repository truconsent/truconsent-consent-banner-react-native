/**
 * BannerUI - React Native banner UI component
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
// I18nextProvider removed - using the one from TruConsentModal
import { Banner } from '../core/types';
import ModernBannerHeader from './ModernBannerHeader';
import ModernPurposeCard from './ModernPurposeCard';
import ModernBannerFooter from './ModernBannerFooter';
import ModernBannerActions from './ModernBannerActions';

export interface BannerUIProps {
  banner: Banner;
  companyName: string;
  logoUrl?: string;
  onChangePurpose: (purposeId: string, status: 'accepted' | 'declined') => void;
  onRejectAll: () => void;
  onConsentAll: () => void;
  onAcceptSelected: () => void;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function BannerUI({
  banner,
  companyName,
  logoUrl,
  onChangePurpose,
  onRejectAll,
  onConsentAll,
  onAcceptSelected,
  primaryColor,
  secondaryColor,
}: BannerUIProps) {
  const settings = banner?.banner_settings || {};
  const finalPrimaryColor = settings.primary_color || primaryColor || '#3b82f6';
  const finalSecondaryColor = settings.secondary_color || secondaryColor || '#555';
  const footerText =
    settings.footer_text ||
    'Review our [Privacy Policy] and [Transparency Centre], [DPO Details]. Use the [Rights Centre] anytime to withdraw consent, delete data, name a nominee, or raise a grievance.';
  const bannerTitle = settings.banner_title;
  const disclaimerText = settings.disclaimer_text;
  const actionButtonText = settings.action_button_text || 'I Consent';

  console.log('BannerUI rendering with:', {
    purposesCount: banner?.purposes?.length || 0,
    companyName,
    hasSettings: !!banner?.banner_settings,
  });

  // Remove nested I18nextProvider since TruConsentModal already provides it
  return (
    <View style={styles.container}>
        <ModernBannerHeader
          logoUrl={settings.logo_url || logoUrl}
          orgName={companyName}
          bannerTitle={bannerTitle}
          disclaimerText={disclaimerText}
        />

        <View style={styles.purposesContainer}>
          {banner?.purposes && banner.purposes.length > 0 ? (
            banner.purposes.map((p, index) => (
              <View key={p.id} style={index > 0 && { marginTop: 16 }}>
                <ModernPurposeCard
                  purpose={p}
                  banner={banner}
                  onToggle={onChangePurpose}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No purposes available</Text>
            </View>
          )}
        </View>

        <View style={styles.footerWrapper}>
          <ModernBannerFooter footerText={footerText} orgName={companyName} />
          <ModernBannerActions
            onRejectAll={onRejectAll}
            onConsentAll={onConsentAll}
            onAcceptSelected={onAcceptSelected}
            purposes={banner?.purposes || []}
            actionButtonText={actionButtonText}
            primaryColor={finalPrimaryColor}
          />
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 0,
    overflow: 'hidden',
    width: '100%',
    flex: 1,
  },
  purposesContainer: {
    padding: 16,
  },
  footerWrapper: {
    marginTop: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});


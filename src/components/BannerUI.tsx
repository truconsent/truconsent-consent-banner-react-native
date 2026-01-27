/**
 * BannerUI - React Native banner UI component
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import i18n from '../utils/i18n';
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

  return (
    <I18nextProvider i18n={i18n}>
      <View style={styles.container}>
        <ModernBannerHeader
          logoUrl={settings.logo_url || logoUrl}
          orgName={companyName}
          bannerTitle={bannerTitle}
          disclaimerText={disclaimerText}
        />

        <View style={styles.purposesContainer}>
          {banner?.purposes?.map((p, index) => (
            <View key={p.id} style={index > 0 && { marginTop: 16 }}>
              <ModernPurposeCard
                purpose={p}
                banner={banner}
                onToggle={onChangePurpose}
              />
            </View>
          ))}
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
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  purposesContainer: {
    padding: 16,
  },
  footerWrapper: {
    marginTop: 8,
  },
});


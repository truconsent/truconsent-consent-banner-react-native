/**
 * ModernBannerHeader - React Native banner header component
 */
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export interface ModernBannerHeaderProps {
  logoUrl?: string;
  orgName: string;
  bannerTitle?: string;
  disclaimerText?: string;
}

export default function ModernBannerHeader({
  logoUrl,
  orgName,
  bannerTitle,
  disclaimerText,
}: ModernBannerHeaderProps) {
  const { t, i18n } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangOpen(false);
  };

  const processPlaceholder = (text: string) => (text || '').replace(/\[Organization Name\]/g, orgName);

  const title = processPlaceholder(bannerTitle || '') || t('consent_by', { companyName: orgName });
  const disclaimer =
    processPlaceholder(disclaimerText || '') || t('decline_rights', { companyName: orgName });

  const getLanguageLabel = () => {
    switch (i18n.language) {
      case 'ta':
        return 'தமிழ்';
      case 'hi':
        return 'हिंदी';
      default:
        return 'English';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <View style={styles.headerLeft}>
        {logoUrl && (
          <>
            <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />
            <View style={{ width: 16 }} />
          </>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
        <View style={styles.languageContainer}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setIsLangOpen(!isLangOpen)}
          >
            <Text style={styles.languageText}>{getLanguageLabel()}</Text>
            <View style={{ width: 4 }} />
            <Text style={styles.chevron}>{isLangOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {isLangOpen && (
            <View style={styles.languageDropdown}>
              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => changeLanguage('en')}
              >
                <Text style={styles.languageOptionText}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => changeLanguage('ta')}
              >
                <Text style={styles.languageOptionText}>தமிழ்</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => changeLanguage('hi')}
              >
                <Text style={styles.languageOptionText}>हिंदी</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>{disclaimer}</Text>
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 32,
    height: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  languageContainer: {
    position: 'relative',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  languageText: {
    fontSize: 14,
    color: '#4b5563',
  },
  chevron: {
    fontSize: 12,
    color: '#4b5563',
  },
  languageDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 160,
    zIndex: 10,
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  languageOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  disclaimer: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    padding: 16,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#1e40af',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
});


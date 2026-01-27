/**
 * ModernBannerActions - React Native banner actions component
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Purpose } from '../core/types';
import { hasOptionalAccepted, hasMandatoryPurposes } from '../core/ConsentManager';

export interface ModernBannerActionsProps {
  onRejectAll: () => void;
  onConsentAll: () => void;
  onAcceptSelected: () => void;
  purposes: Purpose[];
  actionButtonText?: string;
  primaryColor?: string;
}

export default function ModernBannerActions({
  onRejectAll,
  onConsentAll,
  onAcceptSelected,
  purposes = [],
  actionButtonText,
  primaryColor = '#7030bc',
}: ModernBannerActionsProps) {
  const { t } = useTranslation();

  const anyOptionalAccepted = hasOptionalAccepted(purposes);
  const hasMandatory = hasMandatoryPurposes(purposes);

  const dynamicButtonLabel = anyOptionalAccepted
    ? t('accept_selected')
    : t('accept_only_necessary');

  const isDisabled = !anyOptionalAccepted && !hasMandatory;

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.rejectButton} onPress={onRejectAll}>
          <Text style={styles.rejectButtonText}>{t('reject_all')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={onConsentAll}
        >
          <Text style={styles.primaryButtonText}>
            {actionButtonText || t('accept_all')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptSelectedButton, isDisabled && styles.disabledButton]}
          onPress={onAcceptSelected}
          disabled={isDisabled}
        >
          <Text
            style={[
              styles.acceptSelectedButtonText,
              isDisabled && styles.disabledButtonText,
            ]}
          >
            {dynamicButtonLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  rejectButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#fb923c',
    borderRadius: 8,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ea580c',
  },
  primaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  acceptSelectedButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    backgroundColor: '#16a34a',
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  acceptSelectedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  disabledButtonText: {
    color: '#f3f4f6',
  },
});


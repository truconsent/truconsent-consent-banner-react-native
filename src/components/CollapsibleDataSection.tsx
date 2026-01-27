/**
 * CollapsibleDataSection - React Native collapsible section component
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DataElement, ProcessingActivity } from '../core/types';

const dynamicTranslations: Record<string, Record<string, string>> = {
  ta: {
    Gender: 'பாலினம்',
    'Email Address': 'மின்னஞ்சல் முகவரி',
    'Date of Birth': 'பிறந்த தேதி',
    'PAN Number': 'பான் எண்',
    'Mobile Number': 'மொபைல் எண்',
    Name: 'பெயர்',
    'Aadhar Number': 'ஆதார் எண்',
    Address: 'முகவரி',
  },
  hi: {
    Gender: 'लिंग',
    'Email Address': 'ईमेल पता',
    'Date of Birth': 'जन्म की तारीख',
    'PAN Number': 'पैन नंबर',
    'Mobile Number': 'मोबाइल नंबर',
    Name: 'नाम',
    'Aadhar Number': 'आधार संख्या',
    Address: 'पता',
  },
};

const translateDynamic = (text: string, language: string): string => {
  if (dynamicTranslations[language] && dynamicTranslations[language][text]) {
    return dynamicTranslations[language][text];
  }
  return text;
};

export interface CollapsibleDataSectionProps {
  title: string;
  items: (DataElement | ProcessingActivity)[];
  isOpen: boolean;
  onToggle: () => void;
}

export default function CollapsibleDataSection({
  title,
  items,
  isOpen,
  onToggle,
}: CollapsibleDataSectionProps) {
  const { i18n } = useTranslation();

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.header} onPress={onToggle}>
        <Text style={styles.title}>
          {title} ({items.length})
        </Text>
        <Text style={styles.chevron}>{isOpen ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.content}>
          {items.map((item) => (
            <View key={item.id} style={styles.pill}>
              <Text style={styles.pillText}>{translateDynamic(item.name, i18n.language)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  chevron: {
    fontSize: 12,
    color: '#6b7280',
  },
  content: {
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 14,
    color: '#374151',
  },
});


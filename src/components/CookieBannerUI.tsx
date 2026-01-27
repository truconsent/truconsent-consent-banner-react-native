/**
 * CookieBannerUI - React Native cookie consent UI component
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Banner } from '../core/types';

export interface CookieBannerUIProps {
  banner: Banner;
  companyName: string;
  logoUrl?: string;
  onRejectAll: () => void;
  onConsentAll: () => void;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function CookieBannerUI({
  banner,
  companyName,
  logoUrl,
  onRejectAll,
  onConsentAll,
  primaryColor = '#16a34a',
  secondaryColor = '#0f172a',
}: CookieBannerUIProps) {
  const purposes = Array.isArray(banner?.purposes) ? banner.purposes : [];
  const dataElements = Array.isArray(banner?.data_elements) ? banner.data_elements : [];
  const processingActivities = Array.isArray(banner?.processing_activities)
    ? banner.processing_activities
    : [];
  const cfg = (banner && banner.cookie_config) || {};

  const [showPreferences, setShowPreferences] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    purposes: true,
    dataElements: false,
    activities: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const genericOrder = [
    'Strictly Necessary',
    'Performance/Analytics',
    'Functional/Preferences',
    'Marketing/Advertising',
  ];

  const cookiesArr = Array.isArray(cfg?.cookies) ? cfg.cookies : [];
  const detectedCategories = useMemo(() => {
    const out = new Set<string>();
    for (const c of cookiesArr) {
      const base = String(c && c.category ? c.category : '').toLowerCase();
      if (base.includes('necessary')) out.add('Strictly Necessary');
      if (base.includes('preference') || base.includes('functional'))
        out.add('Functional/Preferences');
      if (base.includes('analytic') || base.includes('performance'))
        out.add('Performance/Analytics');
      if (base.includes('marketing') || base.includes('advertis'))
        out.add('Marketing/Advertising');
    }
    if (out.size === 0) out.add('Strictly Necessary');
    return Array.from(out);
  }, [cookiesArr]);

  const displayedCategories = genericOrder.filter((c) => detectedCategories.includes(c));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {banner?.title || banner?.name || 'Cookie Preferences'}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Cookie</Text>
          </View>
        </View>
        {banner?.description && <Text style={styles.description}>{banner.description}</Text>}

        <View style={styles.sections}>
          {purposes.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <AccordionSection
                title="Purposes for Data Collection"
                count={purposes.length}
                isExpanded={expandedSections.purposes}
                onToggle={() => toggleSection('purposes')}
              >
                <View style={styles.purposesList}>
                  {purposes.map((p, index) => (
                    <View key={p.id} style={[styles.purposeItem, index > 0 && { marginTop: 12 }]}>
                      <Text style={styles.purposeName}>{p.name}</Text>
                      {p.description && <Text style={styles.purposeDesc}>{p.description}</Text>}
                    </View>
                  ))}
                </View>
              </AccordionSection>
            </View>
          )}

          {dataElements.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <AccordionSection
                title="Data Elements Collected"
                count={dataElements.length}
                isExpanded={expandedSections.dataElements}
                onToggle={() => toggleSection('dataElements')}
              >
                <View style={styles.pillsContainer}>
                  {dataElements.map((de, index) => (
                    <View key={de.id} style={[styles.pill, index > 0 && { marginLeft: 8, marginTop: 8 }]}>
                      <Text style={styles.pillText}>{de.name}</Text>
                    </View>
                  ))}
                </View>
              </AccordionSection>
            </View>
          )}

          {processingActivities.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <AccordionSection
                title="Processing Activities"
                count={processingActivities.length}
                isExpanded={expandedSections.activities}
                onToggle={() => toggleSection('activities')}
              >
                <View style={styles.activitiesList}>
                  {processingActivities.map((activity, index) => (
                    <View key={activity.id} style={[styles.activityItem, index > 0 && { marginTop: 8 }]}>
                      <View style={styles.activityDot} />
                      <View style={{ width: 8 }} />
                      <Text style={styles.activityText}>{activity.name}</Text>
                    </View>
                  ))}
                </View>
              </AccordionSection>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: primaryColor }]}
            onPress={onConsentAll}
          >
            <Text style={styles.buttonText}>Accept All</Text>
          </TouchableOpacity>
          <View style={{ width: 8 }} />
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onRejectAll}>
            <Text style={styles.secondaryButtonText}>Reject All</Text>
          </TouchableOpacity>
          <View style={{ width: 8 }} />
          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={() => setShowPreferences(true)}
          >
            <Text style={styles.tertiaryButtonText}>Manage Preferences</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function AccordionSection({
  title,
  count,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={accordionStyles.section}>
      <TouchableOpacity style={accordionStyles.header} onPress={onToggle}>
        <View style={accordionStyles.headerContent}>
          <Text style={accordionStyles.title}>{title}</Text>
          {count !== undefined && (
            <>
              <View style={{ width: 8 }} />
              <View style={accordionStyles.badge}>
                <Text style={accordionStyles.badgeText}>{count}</Text>
              </View>
            </>
          )}
        </View>
        <Text style={accordionStyles.chevron}>{isExpanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      {isExpanded && <View style={accordionStyles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e40af',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  sections: {
    marginTop: 24,
  },
  purposesList: {
  },
  purposeItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    paddingLeft: 12,
    paddingVertical: 8,
  },
  purposeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  purposeDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pill: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
  },
  pillText: {
    fontSize: 14,
    color: '#374151',
  },
  activitiesList: {
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a855f7',
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 24,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: '#16a34a',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  tertiaryButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  tertiaryButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

const accordionStyles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  chevron: {
    fontSize: 12,
    color: '#64748b',
  },
  content: {
    padding: 16,
    backgroundColor: 'white',
  },
});


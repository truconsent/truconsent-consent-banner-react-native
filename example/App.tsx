/**
 * TruConsent React Native Example App
 * Test app for validating SDK functionality
 */
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import TruConsentModal from '@truconsent/consent-banner-react-native';

export default function App() {
  const [apiKey, setApiKey] = useState('z7d141o8rbibx2btbcE6yRMXSErL0unLysWs4leu_Hbgn5duU3mqEQ');
  const [organizationId, setOrganizationId] = useState('acme-dev');
  const [bannerId, setBannerId] = useState('CP102');
  const [userId, setUserId] = useState('user-MTQuMTk1LjM2LjEw');
  const [showModal, setShowModal] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleOpenModal = () => {
    if (!apiKey || !organizationId || !bannerId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    console.log('Opening modal with:', { apiKey: apiKey.substring(0, 10) + '...', organizationId, bannerId, userId });
    setShowModal(true);
  };

  const handleClose = (action: string) => {
    setLastAction(action);
    setShowModal(false);
    Alert.alert('Consent Action', `Consent action: ${action}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>TruConsent SDK Test App</Text>
          <Text style={styles.subtitle}>React Native Example</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>API Key *</Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter API key"
            autoCapitalize="none"
            secureTextEntry
          />

          <Text style={styles.label}>Organization ID *</Text>
          <TextInput
            style={styles.input}
            value={organizationId}
            onChangeText={setOrganizationId}
            placeholder="e.g., client-dev, client-staging"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Banner ID *</Text>
          <TextInput
            style={styles.input}
            value={bannerId}
            onChangeText={setBannerId}
            placeholder="Enter banner/collection point ID"
            autoCapitalize="none"
          />

          <Text style={styles.label}>User ID</Text>
          <TextInput
            style={styles.input}
            value={userId}
            onChangeText={setUserId}
            placeholder="User ID for consent tracking"
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.button} onPress={handleOpenModal}>
            <Text style={styles.buttonText}>Open Consent Banner</Text>
          </TouchableOpacity>

          {lastAction && (
            <View style={styles.result}>
              <Text style={styles.resultLabel}>Last Action:</Text>
              <Text style={styles.resultValue}>{lastAction}</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Test Checklist:</Text>
          <Text style={styles.infoItem}>✓ Banner loading</Text>
          <Text style={styles.infoItem}>✓ Purpose toggling</Text>
          <Text style={styles.infoItem}>✓ Accept All</Text>
          <Text style={styles.infoItem}>✓ Reject All</Text>
          <Text style={styles.infoItem}>✓ Accept Selected</Text>
          <Text style={styles.infoItem}>✓ Cookie consent flow</Text>
          <Text style={styles.infoItem}>✓ Error handling</Text>
          <Text style={styles.infoItem}>✓ Internationalization</Text>
        </View>
      </ScrollView>

      {showModal && (
        <TruConsentModal
          apiKey={apiKey}
          organizationId={organizationId}
          bannerId={bannerId}
          userId={userId}
          onClose={handleClose}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  result: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
  },
  info: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

/**
 * RightCenter - React Native implementation
 *
 * For stability and parity with the web demo (iframe embed), we render the hosted
 * Rights Center inside a WebView.
 */
import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export interface RightCenterProps {
  userId: string;
  clientId?: string;
  supabaseProjectUrl?: string; // e.g. https://xxxx.supabase.co
}

export default function RightCenter({
  userId,
  clientId = 'MARS_MONEY_CLIENT_001',
  supabaseProjectUrl = 'https://iwjwpfuaygfojwrrstly.supabase.co',
}: RightCenterProps) {
  const uri = useMemo(() => {
    const base = supabaseProjectUrl.replace(/\/$/, '');
    const url = `${base}/functions/v1/embed-rights-center?client_id=${encodeURIComponent(
      clientId
    )}&data_principal_id=${encodeURIComponent(userId)}`;
    return url;
  }, [clientId, supabaseProjectUrl, userId]);

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});



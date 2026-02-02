/**
 * RightCenter - React Native implementation
 *
 * For stability and parity with the web demo (iframe embed), we render the hosted
 * Rights Center inside a WebView.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Text } from 'react-native';
import { WebView } from 'react-native-webview';

export interface RightCenterProps {
  userId: string;
  clientId?: string;
  supabaseProjectUrl?: string; // e.g. https://xxxx.supabase.co
  apiKey?: string; // TruConsent API key for x-api-key header
  organizationId?: string; // Organization ID for x-org-id header
  supabaseAnonKey?: string; // Supabase anon key for apikey header
}

export default function RightCenter({
  userId,
  clientId = 'mars-money',
  supabaseProjectUrl = 'https://iwjwpfuaygfojwrrstly.supabase.co',
  apiKey,
  organizationId = 'mars-money',
  supabaseAnonKey,
}: RightCenterProps) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const uri = useMemo(() => {
    const base = supabaseProjectUrl.replace(/\/$/, '');
    const url = `${base}/functions/v1/embed-rights-center?client_id=${encodeURIComponent(
      clientId
    )}&data_principal_id=${encodeURIComponent(userId)}`;
    console.log('[RightCenter] URL:', url);
    return url;
  }, [clientId, supabaseProjectUrl, userId]);

  // Fetch content with proper headers before loading in WebView
  useEffect(() => {
    if (Platform.OS === 'web') return; // Skip on web
    
    const fetchContent = async () => {
      setIsFetching(true);
      setFetchError(null);
      
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'text/html',
        };
        
        // Add Supabase anon key as apikey header (required by Supabase edge functions)
        if (supabaseAnonKey) {
          headers['apikey'] = supabaseAnonKey;
          console.log('[RightCenter] Fetching with apikey header');
        } else {
          console.warn('[RightCenter] WARNING: No Supabase anon key - authentication will fail');
        }
        
        // Add TruConsent headers if provided
        if (apiKey) {
          headers['x-api-key'] = apiKey;
        }
        if (organizationId) {
          headers['x-org-id'] = organizationId;
        }
        
        console.log('[RightCenter] Fetching content from:', uri);
        console.log('[RightCenter] Headers:', Object.keys(headers).join(', '));
        
        const response = await fetch(uri, {
          method: 'GET',
          headers: headers,
        });
        
        console.log('[RightCenter] Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[RightCenter] Fetch error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          });
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        console.log('[RightCenter] Content fetched successfully, length:', html.length);
        setHtmlContent(html);
      } catch (error: any) {
        console.error('[RightCenter] Failed to fetch content:', error);
        setFetchError(error.message || 'Failed to load Rights Center');
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchContent();
  }, [uri, supabaseAnonKey, apiKey, organizationId]);

  // WebView doesn't work on web platform - show message instead
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.webMessage]}>
        <Text style={styles.webMessageTitle}>Rights Center</Text>
        <Text style={styles.webMessageText}>
          Rights Center is only available on mobile devices.
        </Text>
        <Text style={styles.webMessageSubtext}>
          Please use the Android or iOS app to access this feature.
        </Text>
      </View>
    );
  }

  // Show loading state while fetching
  if (isFetching) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading Rights Center...</Text>
      </View>
    );
  }

  // Show error state if fetch failed
  if (fetchError) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorTitle}>Failed to Load Rights Center</Text>
        <Text style={styles.errorText}>{fetchError}</Text>
        <Text style={styles.errorSubtext}>
          Please check your internet connection and try again.
        </Text>
      </View>
    );
  }

  // If we have HTML content, load it directly into WebView
  // Otherwise, fall back to loading from URI (with headers as backup)
  return (
    <View style={styles.container}>
      <WebView
        source={htmlContent 
          ? { html: htmlContent, baseUrl: supabaseProjectUrl }
          : { 
              uri,
              headers: (() => {
                const headers: Record<string, string> = {};
                if (supabaseAnonKey) {
                  headers['apikey'] = supabaseAnonKey;
                }
                if (apiKey) {
                  headers['x-api-key'] = apiKey;
                }
                if (organizationId) {
                  headers['x-org-id'] = organizationId;
                }
                return Object.keys(headers).length > 0 ? headers : undefined;
              })(),
            }
        }
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
          </View>
        )}
        onLoadStart={() => {
          console.log('[RightCenter] WebView started loading');
        }}
        onLoadEnd={() => {
          console.log('[RightCenter] WebView finished loading - SUCCESS');
          console.log('[RightCenter] Rights Center should now be visible');
        }}
        onError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[RightCenter] WebView ERROR:', {
            code: nativeEvent.code,
            description: nativeEvent.description,
            domain: nativeEvent.domain,
            url: nativeEvent.url,
          });
        }}
        onHttpError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[RightCenter] WebView HTTP ERROR:', {
            statusCode: nativeEvent.statusCode,
            description: nativeEvent.description,
            url: nativeEvent.url,
            message: nativeEvent.statusCode === 401 
              ? 'Authentication failed. Please check API keys and headers.'
              : nativeEvent.statusCode === 404
              ? 'Rights Center endpoint not found.'
              : `HTTP error ${nativeEvent.statusCode}: ${nativeEvent.description}`,
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  webMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  webMessageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  webMessageText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  webMessageSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});



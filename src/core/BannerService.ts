/**
 * BannerService - HTTP client for banner API calls in React Native
 */
import { Platform } from 'react-native';
import { Banner } from './types';

export interface FetchBannerConfig {
  bannerId: string;
  apiKey?: string;
  organizationId: string;
  /**
   * Web SDK parity:
   * If provided, use `/api/v1/banners` and include `userId` as query param.
   */
  apiUrl?: string;
  assetId?: string;
  userId?: string;
  token?: string;
  authToken?: string;
}

export interface SubmitConsentConfig {
  collectionPointId: string;
  userId: string;
  purposes: any[];
  action: string;
  apiKey?: string;
  organizationId: string;
  requestId?: string;
  /**
   * Web SDK parity:
   * If provided, use `/api/v1/consent/{collectionPointId}/consent`.
   */
  apiUrl?: string;
  assetId?: string;
  token?: string;
  authToken?: string;
  metadata?: Record<string, any>;
}

function withNoTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}

function normalizeMobileLoopback(url: string) {
  if (!url) return url;
  if (Platform.OS === 'android') {
    return url
      .replace('://localhost:', '://10.0.2.2:')
      .replace('://127.0.0.1:', '://10.0.2.2:');
  }
  return url;
}

// Display-ID to title mapping used when a backend stores UUID ids instead of CP display ids.
const CP_TITLE_MAP: Record<string, string> = {
  CP002: 'Expense Tracker',
  CP003: 'KYC Document Upload Form',
  CP004: 'Marketing Consent Banner',
  CP006: 'Account Dashboard',
  CP007: 'Signup Page',
  CP008: 'Credit Card Application Form',
  CP009: 'Fixed Deposit Page',
  CP010: 'Mutual Funds Investment Section',
  CP011: 'Digital Gold Investment Interface',
  CP012: 'Loan Application Page',
  CP013: 'Demat Account Creation',
  CP014: 'Federal Bank Account Opening Form',
};

function appendUserId(url: string, userId?: string) {
  if (!userId) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}userId=${encodeURIComponent(userId)}`;
}

function normalizeBannerArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

/**
 * Fetch banner configuration from API
 */
export async function fetchBanner(config: FetchBannerConfig): Promise<Banner> {
  const {
    bannerId,
    apiKey,
    organizationId,
    apiUrl,
    assetId,
    userId,
    token,
    authToken,
  } = config;

  if (!bannerId) {
    throw new Error('Missing bannerId');
  }
  if (!organizationId) {
    throw new Error('Missing organizationId - Organization ID is required for authentication');
  }

  const effectiveToken = token ?? authToken;
  if (!apiKey && !effectiveToken) {
    throw new Error('Missing apiKey/token - authentication is required');
  }

  if (!apiUrl) {
    throw new Error('Missing apiUrl - TruAPI root URL is required');
  }

  const resolvedApiUrl = normalizeMobileLoopback(apiUrl);
  const base = `${withNoTrailingSlash(resolvedApiUrl)}/api/v1/banners`;
  const encodedBannerId = encodeURIComponent(bannerId);
  const encodedAssetId = assetId ? encodeURIComponent(assetId) : '';

  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'X-API-Key': apiKey } : {}),
    ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
    'X-Org-Id': organizationId,
  };

  const candidateUrls: string[] = [];
  if (assetId) {
    candidateUrls.push(appendUserId(`${base}/${encodedAssetId}/${encodedBannerId}`, userId));
    candidateUrls.push(
      appendUserId(`${base}/${encodedBannerId}?asset_id=${encodeURIComponent(assetId)}`, userId)
    );
  }
  candidateUrls.push(appendUserId(`${base}/${encodedBannerId}`, userId));

  let response: Response | null = null;
  let lastStatus = 0;
  for (const url of candidateUrls) {
    console.log('Fetching banner from:', url);
    response = await fetch(url, { headers });
    lastStatus = response.status;
    console.log('Banner API response status:', response.status, 'for', url);

    if (response.ok || response.status === 401 || response.status === 403) {
      break;
    }
    if (response.status !== 404) {
      break;
    }
  }

  if (!response) {
    throw new Error('Failed to fetch banner: no response from server');
  }

  if (response.status === 401) {
    throw new Error('Authentication required - Invalid or missing API key');
  }
  if (response.status === 403) {
    throw new Error('Access forbidden - API key does not have permission to access this banner');
  }
  if (response.status === 404) {
    // If caller passed display IDs like CP013 but backend stores UUID banner IDs,
    // resolve by known title and retry once with the resolved UUID.
    if (/^CP\d+$/i.test(bannerId)) {
      const cpKey = bannerId.toUpperCase();
      const expectedTitle = CP_TITLE_MAP[cpKey];
      const inventoryUrl = assetId
        ? `${base}?asset_id=${encodeURIComponent(assetId)}`
        : `${base}`;

      try {
        console.log('Fetching banner inventory for CP fallback from:', inventoryUrl);
        const inventoryResp = await fetch(inventoryUrl, { headers });
        if (inventoryResp.ok) {
          const inventoryPayload = await inventoryResp.json();
          const allRows = normalizeBannerArray(inventoryPayload);
          const scopedRows = assetId
            ? allRows.filter(
                (r: any) =>
                  String(r?.asset?.id || r?.asset_id || r?.assetId || '') === String(assetId)
              )
            : allRows;

          let resolved: any = null;
          if (expectedTitle) {
            resolved = scopedRows.find(
              (r: any) =>
                String(r?.title || r?.name || '').trim().toLowerCase() ===
                expectedTitle.toLowerCase()
            );
          }

          // Last-resort fallback: when exactly one banner exists for this asset, use it.
          if (!resolved && scopedRows.length === 1) {
            resolved = scopedRows[0];
          }

          const resolvedBannerId = String(
            resolved?.banner_id || resolved?.collection_point || resolved?.id || ''
          );

          if (resolvedBannerId) {
            const retryUrl = appendUserId(
              `${base}/${encodeURIComponent(resolvedBannerId)}`,
              userId
            );
            console.log(
              `Retrying banner fetch for ${cpKey} using resolved ID ${resolvedBannerId}:`,
              retryUrl
            );
            const retryResp = await fetch(retryUrl, { headers });
            if (retryResp.ok) {
              const retryData = await retryResp.json();
              console.log('Banner resolved via fallback mapping:', resolvedBannerId);
              return retryData as Banner;
            }
            lastStatus = retryResp.status;
          }
        }
      } catch (fallbackError) {
        console.warn('CP fallback resolution failed:', fallbackError);
      }
    }

    throw new Error(
      `Banner not found - Banner ID "${bannerId}" does not exist or is not accessible (tried ${candidateUrls.length} route(s), last status ${lastStatus})`
    );
  }
  if (!response.ok) {
    let errorMessage = `Failed to load banner (${response.status})`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } else {
        const errorText = await response.text();
        // Try to extract meaningful error from HTML response
        const match = errorText.match(/<p>(.*?)<\/p>/i);
        if (match && match[1]) {
          errorMessage = match[1].trim();
        } else if (errorText && errorText.length < 200) {
          errorMessage = errorText;
        }
      }
    } catch (e) {
      console.error('Error parsing error response:', e);
    }
    console.error('Banner API error:', errorMessage);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log('Banner data received:', JSON.stringify(data, null, 2));
  return data;
}

/**
 * Submit consent to the backend
 */
export async function submitConsent(config: SubmitConsentConfig): Promise<any> {
  const {
    collectionPointId,
    userId,
    purposes,
    action,
    apiKey,
    organizationId,
    requestId,
    apiUrl,
    assetId,
    token,
    authToken,
    metadata,
  } = config;

  if (!collectionPointId) {
    throw new Error('Missing collectionPointId');
  }
  if (!organizationId) {
    throw new Error('Missing organizationId');
  }

  const effectiveToken = token ?? authToken;
  if (!apiKey && !effectiveToken) {
    throw new Error('Missing apiKey/token - authentication is required');
  }

  if (!apiUrl) {
    throw new Error('Missing apiUrl - TruAPI root URL is required');
  }

  const resolvedApiUrl = normalizeMobileLoopback(apiUrl);
  const url = `${withNoTrailingSlash(resolvedApiUrl)}/api/v1/consent/${encodeURIComponent(collectionPointId)}/consent`;

  const payload: Record<string, any> = {
    userId,
    purposes,
    action,
  };
  if (requestId) payload.requestId = requestId;
  if (metadata) payload.metadata = metadata;
  if (assetId) payload.assetId = assetId;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
      'X-Org-Id': organizationId,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to submit consent');
  }

  return response.json();
}


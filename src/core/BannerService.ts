/**
 * BannerService - HTTP client for banner API calls in React Native
 */
import { Banner, ConsentRequest } from './types';

const DEFAULT_API_BASE_URL = 'https://rdwcymn5poo6zbzg5fa5xzjsqy0zzcpm.lambda-url.ap-south-1.on.aws/banners';

export interface FetchBannerConfig {
  bannerId: string;
  apiKey: string;
  organizationId: string;
  apiBaseUrl?: string;
}

export interface SubmitConsentConfig {
  collectionPointId: string;
  userId: string;
  purposes: any[];
  action: string;
  apiKey: string;
  organizationId: string;
  requestId?: string;
  apiBaseUrl?: string;
}

/**
 * Fetch banner configuration from API
 */
export async function fetchBanner(config: FetchBannerConfig): Promise<Banner> {
  const { bannerId, apiKey, organizationId, apiBaseUrl = DEFAULT_API_BASE_URL } = config;

  if (!bannerId) {
    throw new Error('Missing bannerId');
  }
  if (!apiKey) {
    throw new Error('Missing apiKey - API key is required for authentication');
  }
  if (!organizationId) {
    throw new Error('Missing organizationId - Organization ID is required for authentication');
  }

  const url = `${apiBaseUrl}/${bannerId}`;
  console.log('Fetching banner from:', url);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-Org-Id': organizationId,
    },
  });

  console.log('Banner API response status:', response.status);

  if (response.status === 401) {
    throw new Error('Authentication required - Invalid or missing API key');
  }
  if (response.status === 403) {
    throw new Error('Access forbidden - API key does not have permission to access this banner');
  }
  if (response.status === 404) {
    throw new Error(`Banner not found - Banner ID "${bannerId}" does not exist or is not accessible`);
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
    apiBaseUrl = DEFAULT_API_BASE_URL,
  } = config;

  if (!collectionPointId) {
    throw new Error('Missing collectionPointId');
  }
  if (!apiKey) {
    throw new Error('Missing apiKey');
  }
  if (!organizationId) {
    throw new Error('Missing organizationId');
  }

  const response = await fetch(`${apiBaseUrl}/${collectionPointId}/consent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-Org-Id': organizationId,
    },
    body: JSON.stringify({
      userId,
      purposes,
      action,
      requestId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit consent');
  }

  return response.json();
}


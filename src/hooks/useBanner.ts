/**
 * useBanner - React hook for fetching banner data
 */
import { useState, useEffect } from 'react';
import { Banner } from '../core/types';
import { fetchBanner, FetchBannerConfig } from '../core/BannerService';

export interface UseBannerResult {
  banner: Banner | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBanner(config: FetchBannerConfig | null): UseBannerResult {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBanner = async () => {
    if (!config) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchBanner(config);
      setBanner(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load banner');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanner();
  }, [config?.bannerId, config?.apiKey, config?.organizationId, config?.apiBaseUrl]);

  return {
    banner,
    isLoading,
    error,
    refetch: loadBanner,
  };
}


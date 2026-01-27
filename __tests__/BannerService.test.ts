/**
 * Unit tests for BannerService
 */
import { fetchBanner, submitConsent } from '../src/core/BannerService';

// Mock fetch globally
global.fetch = jest.fn();

describe('BannerService', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('fetchBanner', () => {
    it('should fetch banner successfully', async () => {
      const mockBanner = {
        banner_id: 'test-banner',
        collection_point: 'test-cp',
        version: '1',
        title: 'Test Banner',
        expiry_type: 'active',
        purposes: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBanner,
      });

      const result = await fetchBanner({
        bannerId: 'test-banner',
        apiKey: 'test-key',
        organizationId: 'test-org',
      });

      expect(result).toEqual(mockBanner);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('test-banner'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-key',
            'X-Org-Id': 'test-org',
          }),
        })
      );
    });

    it('should throw error on 401', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(
        fetchBanner({
          bannerId: 'test-banner',
          apiKey: 'invalid-key',
          organizationId: 'test-org',
        })
      ).rejects.toThrow('Authentication required');
    });

    it('should throw error on 403', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(
        fetchBanner({
          bannerId: 'test-banner',
          apiKey: 'test-key',
          organizationId: 'test-org',
        })
      ).rejects.toThrow('Access forbidden');
    });

    it('should throw error when bannerId is missing', async () => {
      await expect(
        fetchBanner({
          bannerId: '',
          apiKey: 'test-key',
          organizationId: 'test-org',
        })
      ).rejects.toThrow('Missing bannerId');
    });

    it('should throw error when apiKey is missing', async () => {
      await expect(
        fetchBanner({
          bannerId: 'test-banner',
          apiKey: '',
          organizationId: 'test-org',
        })
      ).rejects.toThrow('Missing apiKey');
    });

    it('should throw error when organizationId is missing', async () => {
      await expect(
        fetchBanner({
          bannerId: 'test-banner',
          apiKey: 'test-key',
          organizationId: '',
        })
      ).rejects.toThrow('Missing organizationId');
    });
  });

  describe('submitConsent', () => {
    it('should submit consent successfully', async () => {
      const mockResponse = {
        id: 'consent-123',
        action: 'approved',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await submitConsent({
        collectionPointId: 'test-cp',
        userId: 'test-user',
        purposes: [],
        action: 'approved',
        apiKey: 'test-key',
        organizationId: 'test-org',
      });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('test-cp/consent'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-API-Key': 'test-key',
            'X-Org-Id': 'test-org',
          }),
        })
      );
    });

    it('should throw error when collectionPointId is missing', async () => {
      await expect(
        submitConsent({
          collectionPointId: '',
          userId: 'test-user',
          purposes: [],
          action: 'approved',
          apiKey: 'test-key',
          organizationId: 'test-org',
        })
      ).rejects.toThrow('Missing collectionPointId');
    });
  });
});


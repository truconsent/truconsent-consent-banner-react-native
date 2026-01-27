/**
 * Integration tests for Banner API
 * These tests require a real API endpoint or mock server
 */
import { fetchBanner, submitConsent } from '../../src/core/BannerService';

// Set to true to run against real API (requires valid credentials)
const USE_REAL_API = false;
const TEST_API_KEY = process.env.TEST_API_KEY || '';
const TEST_ORG_ID = process.env.TEST_ORG_ID || '';
const TEST_BANNER_ID = process.env.TEST_BANNER_ID || '';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-' + Date.now();

describe('Banner Integration Tests', () => {
  beforeAll(() => {
    if (USE_REAL_API && (!TEST_API_KEY || !TEST_ORG_ID || !TEST_BANNER_ID)) {
      console.warn('Skipping integration tests - missing test credentials');
    }
  });

  describe('fetchBanner', () => {
    it.skip('should fetch banner from real API', async () => {
      if (!USE_REAL_API) {
        return;
      }

      const banner = await fetchBanner({
        bannerId: TEST_BANNER_ID,
        apiKey: TEST_API_KEY,
        organizationId: TEST_ORG_ID,
      });

      expect(banner).toBeDefined();
      expect(banner.bannerId).toBeDefined();
      expect(banner.purposes).toBeInstanceOf(Array);
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(
        fetchBanner({
          bannerId: 'test-banner',
          apiKey: 'test-key',
          organizationId: 'test-org',
        })
      ).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      // Mock timeout
      global.fetch = jest.fn().mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      await expect(
        fetchBanner({
          bannerId: 'test-banner',
          apiKey: 'test-key',
          organizationId: 'test-org',
        })
      ).rejects.toThrow();
    });
  });

  describe('submitConsent', () => {
    it.skip('should submit consent to real API', async () => {
      if (!USE_REAL_API) {
        return;
      }

      const result = await submitConsent({
        collectionPointId: TEST_BANNER_ID,
        userId: TEST_USER_ID,
        purposes: [
          {
            id: 'test-purpose',
            name: 'Test Purpose',
            description: 'Test',
            isMandatory: false,
            consented: 'accepted',
            expiryPeriod: '1 year',
          },
        ],
        action: 'approved',
        apiKey: TEST_API_KEY,
        organizationId: TEST_ORG_ID,
      });

      expect(result).toBeDefined();
    });

    it('should handle invalid request format', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request' }),
      });

      await expect(
        submitConsent({
          collectionPointId: 'test-cp',
          userId: '',
          purposes: [],
          action: 'approved',
          apiKey: 'test-key',
          organizationId: 'test-org',
        })
      ).rejects.toThrow();
    });
  });
});


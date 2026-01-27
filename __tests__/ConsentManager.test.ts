/**
 * Unit tests for ConsentManager
 */
import {
  updatePurposeStatus,
  acceptMandatoryPurposes,
  determineConsentAction,
  hasOptionalAccepted,
  hasMandatoryPurposes,
} from '../src/core/ConsentManager';
import { Purpose, ConsentAction } from '../src/core/types';

describe('ConsentManager', () => {
  const mockPurposes: Purpose[] = [
    {
      id: '1',
      name: 'Purpose 1',
      description: 'Description 1',
      is_mandatory: true,
      consented: 'declined',
      expiry_period: '1 year',
    },
    {
      id: '2',
      name: 'Purpose 2',
      description: 'Description 2',
      is_mandatory: false,
      consented: 'declined',
      expiry_period: '1 year',
    },
  ];

  describe('updatePurposeStatus', () => {
    it('should update a purpose status', () => {
      const result = updatePurposeStatus(mockPurposes, '1', 'accepted');
      expect(result[0].consented).toBe('accepted');
      expect(result[1].consented).toBe('declined');
    });

    it('should not modify other purposes', () => {
      const result = updatePurposeStatus(mockPurposes, '2', 'accepted');
      expect(result[0].consented).toBe('declined');
      expect(result[1].consented).toBe('accepted');
    });
  });

  describe('acceptMandatoryPurposes', () => {
    it('should accept all mandatory purposes', () => {
      const result = acceptMandatoryPurposes(mockPurposes);
      expect(result[0].consented).toBe('accepted');
      expect(result[1].consented).toBe('declined');
    });

    it('should keep optional purposes unchanged', () => {
      const purposes = [
        ...mockPurposes,
        {
          id: '3',
          name: 'Purpose 3',
          description: 'Description 3',
          is_mandatory: false,
          consented: 'accepted',
          expiry_period: '1 year',
        },
      ];
      const result = acceptMandatoryPurposes(purposes);
      expect(result[0].consented).toBe('accepted');
      expect(result[1].consented).toBe('declined');
      expect(result[2].consented).toBe('accepted');
    });
  });

  describe('determineConsentAction', () => {
    it('should return approved when all purposes are accepted', () => {
      const purposes: Purpose[] = [
        { ...mockPurposes[0], consented: 'accepted' },
        { ...mockPurposes[1], consented: 'accepted' },
      ];
      expect(determineConsentAction(purposes)).toBe('approved' as ConsentAction);
    });

    it('should return declined when all purposes are declined', () => {
      expect(determineConsentAction(mockPurposes)).toBe('declined' as ConsentAction);
    });

    it('should return partial_consent when mixed', () => {
      const purposes: Purpose[] = [
        { ...mockPurposes[0], consented: 'accepted' },
        { ...mockPurposes[1], consented: 'declined' },
      ];
      expect(determineConsentAction(purposes)).toBe('partial_consent' as ConsentAction);
    });

    it('should return revoked when previously accepted purpose is declined', () => {
      const previousPurposes: Purpose[] = [
        { ...mockPurposes[0], consented: 'accepted' },
        { ...mockPurposes[1], consented: 'accepted' },
      ];
      const currentPurposes: Purpose[] = [
        { ...mockPurposes[0], consented: 'declined' },
        { ...mockPurposes[1], consented: 'accepted' },
      ];
      expect(determineConsentAction(currentPurposes, previousPurposes)).toBe('revoked' as ConsentAction);
    });

    it('should return declined for empty purposes', () => {
      expect(determineConsentAction([])).toBe('declined' as ConsentAction);
    });
  });

  describe('hasOptionalAccepted', () => {
    it('should return true when optional purpose is accepted', () => {
      const purposes: Purpose[] = [
        { ...mockPurposes[0], consented: 'declined' },
        { ...mockPurposes[1], consented: 'accepted' },
      ];
      expect(hasOptionalAccepted(purposes)).toBe(true);
    });

    it('should return false when no optional purposes are accepted', () => {
      expect(hasOptionalAccepted(mockPurposes)).toBe(false);
    });
  });

  describe('hasMandatoryPurposes', () => {
    it('should return true when mandatory purposes exist', () => {
      expect(hasMandatoryPurposes(mockPurposes)).toBe(true);
    });

    it('should return false when no mandatory purposes', () => {
      const purposes: Purpose[] = [
        { ...mockPurposes[0], is_mandatory: false },
        { ...mockPurposes[1], is_mandatory: false },
      ];
      expect(hasMandatoryPurposes(purposes)).toBe(false);
    });
  });
});


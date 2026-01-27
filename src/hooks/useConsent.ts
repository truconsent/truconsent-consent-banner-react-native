/**
 * useConsent - React hook for managing consent state
 */
import { useState, useCallback } from 'react';
import { Purpose, ConsentAction } from '../core/types';
import { updatePurposeStatus, acceptMandatoryPurposes } from '../core/ConsentManager';

export interface UseConsentResult {
  purposes: Purpose[];
  updatePurpose: (purposeId: string, status: 'accepted' | 'declined') => void;
  acceptAll: () => void;
  rejectAll: () => void;
  acceptSelected: () => Purpose[];
  setPurposes: (purposes: Purpose[]) => void;
}

export function useConsent(initialPurposes: Purpose[]): UseConsentResult {
  const [purposes, setPurposes] = useState<Purpose[]>(initialPurposes);

  const updatePurpose = useCallback((purposeId: string, status: 'accepted' | 'declined') => {
    setPurposes((prev) => updatePurposeStatus(prev, purposeId, status));
  }, []);

  const acceptAll = useCallback(() => {
    setPurposes((prev) =>
      prev.map((p) => ({ ...p, consented: 'accepted' as const }))
    );
  }, []);

  const rejectAll = useCallback(() => {
    setPurposes((prev) =>
      prev.map((p) => (p.is_mandatory ? p : { ...p, consented: 'declined' as const }))
    );
  }, []);

  const acceptSelected = useCallback(() => {
    const updated = acceptMandatoryPurposes(purposes);
    setPurposes(updated);
    return updated;
  }, [purposes]);

  return {
    purposes,
    updatePurpose,
    acceptAll,
    rejectAll,
    acceptSelected,
    setPurposes,
  };
}


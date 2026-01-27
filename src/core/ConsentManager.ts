/**
 * ConsentManager - Consent state management for React Native
 */
import { Purpose, ConsentAction } from './types';

/**
 * Update a single purpose's consent status in the purposes array
 */
export function updatePurposeStatus(
  purposes: Purpose[],
  purposeId: string,
  newStatus: 'accepted' | 'declined'
): Purpose[] {
  return purposes.map((p) =>
    p.id === purposeId ? { ...p, consented: newStatus } : p
  );
}

/**
 * Automatically accept all mandatory purposes while keeping user's selections for optional ones
 */
export function acceptMandatoryPurposes(purposes: Purpose[]): Purpose[] {
  return purposes.map((p) => ({
    ...p,
    consented: p.is_mandatory ? 'accepted' : p.consented,
  }));
}

/**
 * Determine consent action based on purpose states
 */
export function determineConsentAction(
  purposes: Purpose[],
  previousPurposes: Purpose[] | null = null
): ConsentAction {
  if (!purposes || purposes.length === 0) {
    return 'declined';
  }

  // Check for revocation (previously accepted, now declined)
  if (previousPurposes) {
    const hasRevocation = purposes.some((p) => {
      const previous = previousPurposes.find((prev) => prev.id === p.id);
      return previous && previous.consented === 'accepted' && p.consented === 'declined';
    });
    if (hasRevocation) {
      return 'revoked';
    }
  }

  // Check if all purposes are accepted
  const allAccepted = purposes.every(
    (p) => p.consented === 'accepted' || p.consented === true
  );
  if (allAccepted) {
    return 'approved';
  }

  // Check if all purposes are declined
  const allDeclined = purposes.every(
    (p) => p.consented === 'declined' || p.consented === false
  );
  if (allDeclined) {
    return 'declined';
  }

  // Mixed consent (partial)
  return 'partial_consent';
}

/**
 * Get all accepted purposes
 */
export function getAcceptedPurposes(purposes: Purpose[]): Purpose[] {
  return purposes.filter((p) => p.consented === 'accepted' || p.consented === true);
}

/**
 * Get all declined purposes
 */
export function getDeclinedPurposes(purposes: Purpose[]): Purpose[] {
  return purposes.filter((p) => p.consented === 'declined' || p.consented === false);
}

/**
 * Check if any optional purposes are accepted
 */
export function hasOptionalAccepted(purposes: Purpose[]): boolean {
  return purposes
    .filter((p) => !p.is_mandatory)
    .some((p) => p.consented === 'accepted' || p.consented === true);
}

/**
 * Check if there are any mandatory purposes
 */
export function hasMandatoryPurposes(purposes: Purpose[]): boolean {
  return purposes.some((p) => p.is_mandatory);
}


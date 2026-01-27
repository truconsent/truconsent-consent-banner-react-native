/**
 * Unit tests for RequestIdGenerator
 */
import { generateRequestId, isValidUUID } from '../src/utils/RequestIdGenerator';

describe('RequestIdGenerator', () => {
  describe('generateRequestId', () => {
    it('should generate a valid UUID', () => {
      const id = generateRequestId();
      expect(isValidUUID(id)).toBe(true);
    });

    it('should generate unique IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
    });

    it('should generate UUID v4 format', () => {
      const id = generateRequestId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(id)).toBe(true);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID format', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });
});


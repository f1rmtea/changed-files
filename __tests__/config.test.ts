import { ConfigValidator } from '../src/config/validator';
import { ChangedAreasConfig } from '../src/types';

describe('ConfigValidator', () => {
  describe('Schema Validation', () => {
    it('should validate a correct config', () => {
      const config: ChangedAreasConfig = {
        areas: {
          backend: {
            include: ['src/backend/**']
          }
        }
      };

      const validator = new ConfigValidator(config);
      const result = validator.validate();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing areas field', () => {
      const config = {} as ChangedAreasConfig;

      const validator = new ConfigValidator(config);
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: 'Configuration must contain at least one of: "areas" or "files"'
        })
      );
    });

    it('should reject empty include array', () => {
      const config: ChangedAreasConfig = {
        areas: {
          backend: {
            include: []
          }
        }
      };

      const validator = new ConfigValidator(config);
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject area names with spaces', () => {
      const config: ChangedAreasConfig = {
        areas: {
          'backend api': {
            include: ['src/**']
          }
        }
      };

      const validator = new ConfigValidator(config);
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('cannot contain spaces')
        })
      );
    });
  });

  describe('Pattern Validation', () => {
    it('should warn about absolute paths', () => {
      const config: ChangedAreasConfig = {
        areas: {
          backend: {
            include: ['/home/user/src/**']
          }
        }
      };

      const validator = new ConfigValidator(config);
      const result = validator.validate();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('absolute path');
    });

    it('should warn about overly broad patterns', () => {
      const config: ChangedAreasConfig = {
        areas: {
          everything: {
            include: ['**']
          }
        }
      };

      const validator = new ConfigValidator(config);
      const result = validator.validate();

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
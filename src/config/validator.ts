import { UnifiedConfig, AreaConfig, ValidationResult, ValidationError, ValidationWarning } from '../types';

export class ConfigValidator {
  private config: UnifiedConfig;

  constructor(config: UnifiedConfig) {
    this.config = config;
  }

  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check that we have at least one section
    if (!this.config.areas && !this.config.files) {
      errors.push({
        severity: 'error',
        area: null,
        field: null,
        message: 'Configuration must contain at least one of: "areas" or "files"',
        fix: 'Add either "files:" or "areas:" section to your configuration'
      });
      return { valid: false, errors, warnings };
    }

    // Validate areas section if present
    if (this.config.areas) {
      for (const [areaName, areaConfig] of Object.entries(this.config.areas)) {
        // Check for reserved name
        if (areaName === 'files') {
          errors.push({
            severity: 'error',
            area: areaName,
            field: null,
            message: 'Area name "files" is reserved. Please use a different name.',
            fix: 'Rename this area to something like "file_processor" or "file_checks"'
          });
        }

        // Check for spaces in area names
        if (areaName.includes(' ')) {
          errors.push({
            severity: 'error',
            area: areaName,
            field: null,
            message: `Area name "${areaName}" cannot contain spaces`,
            fix: `Use underscores or hyphens instead, e.g., "${areaName.replace(/ /g, '_')}"`
          });
        }

        // Validate area config
        const areaValidation = this.validateAreaConfig(areaName, areaConfig);
        errors.push(...areaValidation.errors);
        warnings.push(...areaValidation.warnings);
      }
    }

    // Validate files section if present
    if (this.config.files) {
      const filesValidation = this.validateAreaConfig('files', this.config.files);
      errors.push(...filesValidation.errors);
      warnings.push(...filesValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateAreaConfig(name: string, config: AreaConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate include patterns
    if (!config.include || !Array.isArray(config.include) || config.include.length === 0) {
      errors.push({
        severity: 'error',
        area: name,
        field: 'include',
        message: `${name}: "include" must be a non-empty array of patterns`,
        fix: `${name}:\n  include:\n    - "src/**"`
      });
    }

    // Validate patterns
    if (config.include) {
      for (const pattern of config.include) {
        if (typeof pattern !== 'string' || pattern.trim().length === 0) {
          errors.push({
            severity: 'error',
            area: name,
            field: 'include',
            message: `${name}: Invalid pattern: ${pattern}`,
            fix: 'All patterns must be non-empty strings'
          });
        } else {
          // Validate pattern content
          // Check for absolute paths
          if (pattern.startsWith('/')) {
            warnings.push({
              severity: 'warning',
              area: name,
              message: `Pattern "${pattern}" is an absolute path`,
              recommendation: 'Use relative paths like "src/**" instead'
            });
          }

          // Check for backslashes
          if (pattern.includes('\\')) {
            warnings.push({
              severity: 'warning',
              area: name,
              message: `Pattern "${pattern}" contains backslashes`,
              recommendation: 'Use forward slashes for cross-platform compatibility'
            });
          }

          // Check for overly broad patterns
          if (pattern === '**' || pattern === '*') {
            warnings.push({
              severity: 'warning',
              area: name,
              message: `Pattern "${pattern}" matches all files`,
              recommendation: 'Consider being more specific to improve performance'
            });
          }
        }
      }
    }

    // Validate exclude if present
    if (config.exclude && !Array.isArray(config.exclude)) {
      errors.push({
        severity: 'error',
        area: name,
        field: 'exclude',
        message: `${name}: "exclude" must be an array of patterns`
      });
    }

    // Optional: required_extensions
    if (config.required_extensions !== undefined) {
      if (!Array.isArray(config.required_extensions)) {
        errors.push({
          severity: 'error',
          area: name,
          field: 'required_extensions',
          message: '"required_extensions" must be an array of strings'
        });
      } else {
        for (const ext of config.required_extensions) {
          if (!ext.startsWith('.')) {
            warnings.push({
              severity: 'warning',
              area: name,
              message: `Extension "${ext}" should start with a dot (e.g., ".ts")`,
              recommendation: 'Use ".ts" instead of "ts"'
            });
          }
        }
      }
    }

    // Optional: min_changed_files
    if (config.min_changed_files !== undefined) {
      if (typeof config.min_changed_files !== 'number') {
        errors.push({
          severity: 'error',
          area: name,
          field: 'min_changed_files',
          message: '"min_changed_files" must be a number'
        });
      } else if (config.min_changed_files < 1) {
        errors.push({
          severity: 'error',
          area: name,
          field: 'min_changed_files',
          message: '"min_changed_files" must be >= 1'
        });
      }
    }

    // Optional: boolean flags
    const booleanFlags = [
      'exclude_binary_files',
      'ignore_deleted_files',
      'ignore_renamed_files'
    ] as const;

    for (const flag of booleanFlags) {
      const value = config[flag];
      if (value !== undefined && typeof value !== 'boolean') {
        errors.push({
          severity: 'error',
          area: name,
          field: flag,
          message: `"${flag}" must be true or false`
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
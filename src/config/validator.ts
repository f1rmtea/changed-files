import { Minimatch } from 'minimatch';
import { ChangedAreasConfig, ValidationResult, ValidationError, ValidationWarning } from '../types';

export class ConfigValidator {
  private config: ChangedAreasConfig;
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];

  constructor(config: ChangedAreasConfig) {
    this.config = config;
  }

  validate(): ValidationResult {
    this.validateSchema();
    this.validateLogic();
    this.validatePatterns();

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  private validateSchema(): void {
    if (!this.config.areas) {
      this.addError(null, 'areas', 'Missing required "areas" field');
      return;
    }

    if (typeof this.config.areas !== 'object') {
      this.addError(null, 'areas', '"areas" must be an object');
      return;
    }

    if (Object.keys(this.config.areas).length === 0) {
      this.addError(null, 'areas', 'At least one area must be defined');
      return;
    }

    for (const [areaName, areaConfig] of Object.entries(this.config.areas)) {
      this.validateArea(areaName, areaConfig);
    }
  }

  private validateArea(name: string, config: any): void {
    // Check for spaces in area name
    if (/\s/.test(name)) {
      this.addError(
        name,
        null,
        'Area names cannot contain spaces',
        'Use hyphens or underscores: "backend-api" or "backend_api"'
      );
    }

    // Required: include
    if (!config.include) {
      this.addError(name, 'include', 'Missing required "include" field');
      return;
    }

    if (!Array.isArray(config.include)) {
      this.addError(name, 'include', '"include" must be an array of strings');
      return;
    }

    if (config.include.length === 0) {
      this.addError(
        name,
        'include',
        'At least one include pattern is required',
        'Add a pattern like "src/**" to define what files belong to this area'
      );
    }

    // Optional: exclude
    if (config.exclude !== undefined) {
      if (!Array.isArray(config.exclude)) {
        this.addError(name, 'exclude', '"exclude" must be an array of strings');
      }
    }

    // Optional: required_extensions
    if (config.required_extensions !== undefined) {
      if (!Array.isArray(config.required_extensions)) {
        this.addError(
          name,
          'required_extensions',
          '"required_extensions" must be an array of strings'
        );
      } else {
        for (const ext of config.required_extensions) {
          if (!ext.startsWith('.')) {
            this.addWarning(
              name,
              `Extension "${ext}" should start with a dot (e.g., ".ts")`,
              'Use ".ts" instead of "ts"'
            );
          }
        }
      }
    }

    // Optional: min_changed_files
    if (config.min_changed_files !== undefined) {
      if (typeof config.min_changed_files !== 'number') {
        this.addError(name, 'min_changed_files', '"min_changed_files" must be a number');
      } else if (config.min_changed_files < 1) {
        this.addError(name, 'min_changed_files', '"min_changed_files" must be >= 1');
      }
    }

    // Optional: boolean flags
    const booleanFlags = [
      'exclude_binary_files',
      'ignore_deleted_files',
      'ignore_renamed_files'
    ];

    for (const flag of booleanFlags) {
      if (config[flag] !== undefined && typeof config[flag] !== 'boolean') {
        this.addError(name, flag, `"${flag}" must be true or false`);
      }
    }
  }

  private validateLogic(): void {
    for (const [name, config] of Object.entries(this.config.areas)) {
      // Check: only excludes without includes
      if ((config.exclude && config.exclude.length > 0) && (config.include && config.include.length === 0)) {
        this.addError(
          name,
          null,
          'Area has exclude patterns but no include patterns',
          'Add at least one include pattern to define what this area matches'
        );
      }

      // Check: include and exclude contain same pattern
      if (config.include && config.exclude) {
        const duplicates = config.include.filter(p => config.exclude!.includes(p));

        if (duplicates.length > 0) {
          this.addWarning(
            name,
            `Pattern "${duplicates[0]}" appears in both include and exclude`,
            'This pattern will never match. Remove it from one of the lists.'
          );
        }
      }
    }
  }

  private validatePatterns(): void {
    for (const [name, config] of Object.entries(this.config.areas)) {
      // Validate include patterns
      if (config.include) {
        for (const pattern of config.include) {
          this.validatePattern(name, 'include', pattern);
        }
      }

      // Validate exclude patterns
      if (config.exclude) {
        for (const pattern of config.exclude) {
          this.validatePattern(name, 'exclude', pattern);
        }
      }
    }
  }

  private validatePattern(area: string, field: string, pattern: string): void {
    // Check for absolute paths
    if (pattern.startsWith('/')) {
      this.addWarning(
        area,
        `Pattern "${pattern}" is an absolute path`,
        'Use relative paths like "src/**" instead'
      );
    }

    // Check for backslashes
    if (pattern.includes('\\')) {
      this.addWarning(
        area,
        `Pattern "${pattern}" contains backslashes`,
        'Use forward slashes for cross-platform compatibility'
      );
    }

    // Validate glob syntax
    try {
      new Minimatch(pattern);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addError(area, field, `Invalid glob pattern "${pattern}": ${errorMessage}`);
    }

    // Check for multiple consecutive slashes
    if (pattern.includes('//')) {
      this.addError(area, field, `Pattern "${pattern}" contains multiple consecutive slashes`);
    }

    // Check for overly broad patterns
    if (pattern === '**' || pattern === '*') {
      this.addWarning(
        area,
        `Pattern "${pattern}" matches all files`,
        'Consider being more specific to improve performance'
      );
    }
  }

  private addError(
    area: string | null,
    field: string | null,
    message: string,
    fix?: string
  ): void {
    this.errors.push({ severity: 'error', area, field, message, fix });
  }

  private addWarning(area: string | null, message: string, recommendation: string): void {
    this.warnings.push({ severity: 'warning', area, message, recommendation });
  }
}
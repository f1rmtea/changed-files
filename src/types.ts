import { Context } from '@actions/github/lib/context';

export interface AreaConfig {
  include: string[];
  exclude?: string[];
  required_extensions?: string[];
  min_changed_files?: number;
  exclude_binary_files?: boolean;
  ignore_deleted_files?: boolean;
  ignore_renamed_files?: boolean;
}

export interface ChangedAreasConfig {
  areas: Record<string, AreaConfig>;
}

export interface UnifiedConfig {
  areas?: Record<string, AreaConfig>;
  files?: AreaConfig;
}

export interface EdgeCaseConfig {
  merge_commit_strategy: 'first-parent' | 'all-parents';
  force_push_strategy: 'compare-default-branch' | 'all-files' | 'fail';
  empty_commit_behavior: 'none' | 'all';
  ignore_binary_files: boolean;
  strict_validation: boolean;
  debug: boolean;
}

export interface ChangedFile {
  path: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  previous_path?: string;
  binary: boolean;
  additions?: number;
  deletions?: number;
  changes?: number;
}

export interface AreaResult {
  changed: boolean;
  files: string[];
  count: number;
  reason?: string;
}

export interface ValidationError {
  severity: 'error';
  area: string | null;
  field: string | null;
  message: string;
  fix?: string;
}

export interface ValidationWarning {
  severity: 'warning';
  area: string | null;
  message: string;
  recommendation: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ActionInputs {
  config: string;
  config_inline?: string;
  github_token: string;
  edge_cases: EdgeCaseConfig;
}

export type GitHubContext = Context;
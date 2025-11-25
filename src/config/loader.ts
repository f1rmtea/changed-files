import * as core from '@actions/core';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { ChangedAreasConfig, ActionInputs } from '../types';
import { ConfigError } from '../errors';
import { Logger } from '../utils/logger';

export function getActionInputs(): ActionInputs {
  return {
    config: core.getInput('config') || '.github/changed-areas.yml',
    config_inline: core.getInput('config_inline') || undefined,
    github_token: core.getInput('github_token', { required: true }),
    edge_cases: {
      merge_commit_strategy: (core.getInput('merge_commit_strategy') as 'first-parent' | 'all-parents') || 'first-parent',
      force_push_strategy: (core.getInput('force_push_strategy') as 'compare-default-branch' | 'all-files' | 'fail') || 'compare-default-branch',
      empty_commit_behavior: (core.getInput('empty_commit_behavior') as 'none' | 'all') || 'none',
      ignore_binary_files: core.getInput('ignore_binary_files') === 'true',
      strict_validation: core.getInput('strict_validation') === 'true'
    }
  };
}

export async function loadConfig(inputs: ActionInputs): Promise<ChangedAreasConfig> {
  // Priority 1: Inline config
  if (inputs.config_inline) {
    Logger.info('Loading configuration from inline input');
    try {
      const config = yaml.load(inputs.config_inline) as ChangedAreasConfig;
      return config;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ConfigError(`Failed to parse inline configuration: ${errorMessage}`);
    }
  }

  // Priority 2: Config file
  Logger.info(`Loading configuration from file: ${inputs.config}`);
  if (!fs.existsSync(inputs.config)) {
    throw new ConfigError(
      `Configuration file not found: ${inputs.config}\n` +
      `Please create this file or provide inline configuration using the 'config_inline' input.`
    );
  }

  try {
    const fileContents = fs.readFileSync(inputs.config, 'utf8');
    const config = yaml.load(fileContents) as ChangedAreasConfig;
    return config;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new ConfigError(`Failed to parse configuration file: ${errorMessage}`);
  }
}
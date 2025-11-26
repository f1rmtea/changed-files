import * as core from '@actions/core';
import { context } from '@actions/github';
import { getActionInputs, loadConfig, mergeConfigSections } from './config/loader';
import { ConfigValidator } from './config/validator';
import { discoverChangedFiles } from './diff/discovery';
import { classifyFiles } from './classify/matcher';
import { applyConstraintsToAll } from './classify/constraints';
import { generateOutputs } from './output/generator';
import { createSummary } from './output/summary';
import { ConfigError, GitHubAPIError, ValidationError } from './errors';
import { Logger } from './utils/logger';
import { isEmptyCommit, handleEmptyCommit } from './diff/edge-cases';
import { AreaResult } from './types';

async function run(): Promise<void> {
  try {
    Logger.info('Changed Files Action starting...');

    // 1. Load inputs
    const inputs = getActionInputs();

    // 2. Load configuration
    const config = await loadConfig(inputs);

    // 3. Validate configuration
    Logger.startGroup('Validating configuration');
    const validator = new ConfigValidator(config);
    const validation = validator.validate();

    if (!validation.valid) {
      for (const error of validation.errors) {
        const location = error.area ? `[${error.area}]` : '[config]';
        Logger.error(`${location} ${error.message}`);
        if (error.fix) {
          Logger.info(`  Fix: ${error.fix}`);
        }
      }
      throw new ValidationError('Configuration validation failed');
    }

    if (validation.warnings.length > 0) {
      for (const warning of validation.warnings) {
        const location = warning.area ? `[${warning.area}]` : '[config]';
        Logger.warn(`${location} ${warning.message}`);
        Logger.info(`  Recommendation: ${warning.recommendation}`);
      }

      if (inputs.edge_cases.strict_validation) {
        throw new ValidationError(
          `Strict validation failed: ${validation.warnings.length} warning(s) found`
        );
      }
    }

    Logger.info('✅ Configuration valid');
    Logger.endGroup();

    // 4. Merge areas and files sections
    const allAreas = mergeConfigSections(config);
    
    Logger.info(`Processing ${Object.keys(allAreas).length} section(s):`);
    for (const name of Object.keys(allAreas)) {
      Logger.info(`  - ${name}`);
    }

    // 5. Discover changed files
    Logger.startGroup('Discovering changed files');
    const changedFiles = await discoverChangedFiles(context, inputs.github_token, inputs.edge_cases);
    Logger.endGroup();

    // 6. Handle empty commits
    if (isEmptyCommit(changedFiles)) {
      const { triggerAll } = handleEmptyCommit(inputs.edge_cases);

      const emptyResults: Record<string, AreaResult> = {};
      for (const areaName of Object.keys(allAreas)) {
        emptyResults[areaName] = {
          changed: triggerAll,
          files: [],
          count: 0,
          reason: triggerAll ? 'Empty commit configured to trigger all' : 'Empty commit'
        };
      }

      generateOutputs(emptyResults);
      await createSummary(emptyResults);
      Logger.info(`✅ Empty commit - ${triggerAll ? 'all triggered' : 'none triggered'}`);
      return;
    }

    // 7. Classify files (works for both areas and files section)
    Logger.startGroup('Classifying files');
    const classified = classifyFiles(changedFiles, allAreas, inputs.edge_cases.debug);

    for (const [name, files] of Object.entries(classified)) {
      if (files.length > 0) {
        Logger.info(`[${name}] Matched ${files.length} file(s)`);
      }
    }
    Logger.endGroup();

    // 8. Apply constraints
    const results = applyConstraintsToAll(classified, allAreas);

    // Log any constraint rejections
    for (const [name, result] of Object.entries(results)) {
      if (result.reason) {
        Logger.info(`[${name}] ${result.reason}`);
      }
    }

    // 9. Generate outputs (same for all sections)
    generateOutputs(results);

    // 10. Create summary
    await createSummary(results);

    Logger.info(`✅ Successfully analyzed ${changedFiles.length} changed file(s)`);

  } catch (error: unknown) {
    const err = error as Error;

    if (error instanceof ConfigError) {
      Logger.error(`Configuration error: ${err.message}`);
      core.setFailed('Invalid configuration');
    } else if (error instanceof GitHubAPIError) {
      Logger.error(`GitHub API error: ${err.message}`);
      core.setFailed('Failed to fetch changed files from GitHub');
    } else if (error instanceof ValidationError) {
      Logger.error(`Validation error: ${err.message}`);
      core.setFailed('Configuration validation failed');
    } else {
      Logger.error(`Unexpected error: ${err.message}`);
      if (err.stack) {
        Logger.error(err.stack);
      }
      core.setFailed(err.message);
    }
  }
}

run();
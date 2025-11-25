import { GitHubContext, EdgeCaseConfig, ChangedFile } from '../types';
import { Logger } from '../utils/logger';

const ZERO_SHA = '0000000000000000000000000000000000000000';

// Add interface for push event
interface PushEvent {
  before: string;
  after: string;
  forced?: boolean;
}

export function isFirstCommit(event: PushEvent): boolean {
  return event.before === ZERO_SHA || event.before === '0'.repeat(40);
}

export function isForcePush(event: PushEvent): boolean {
  return event.forced === true;
}

export function isEmptyCommit(files: ChangedFile[]): boolean {
  return files.length === 0;
}

export function handleFirstCommit(sha: string): { strategy: string; ref: string } {
  Logger.warn('First commit detected - all files in commit will be marked as changed');
  return {
    strategy: 'first-commit',
    ref: sha
  };
}

export function handleForcePush(
  context: GitHubContext,
  config: EdgeCaseConfig
): { strategy: string; ref: string } {
  Logger.warn(`Force push detected - using strategy: ${config.force_push_strategy}`);

  switch (config.force_push_strategy) {
    case 'compare-default-branch': {
      const defaultBranch = context.payload.repository?.default_branch || 'main';
      return {
        strategy: 'force-push-default-branch',
        ref: `refs/heads/${defaultBranch}`
      };
    }
    case 'all-files':
      return {
        strategy: 'force-push-all-files',
        ref: context.sha
      };
    case 'fail':
      throw new Error(
        'Force push detected and force_push_strategy is set to "fail". ' +
        'Please configure the action to handle force pushes.'
      );
    default:
      throw new Error(`Unknown force push strategy: ${config.force_push_strategy}`);
  }
}

export function handleEmptyCommit(
  config: EdgeCaseConfig
): { strategy: string; triggerAll: boolean } {
  Logger.info('Empty commit detected (no files changed)');

  switch (config.empty_commit_behavior) {
    case 'none':
      return { strategy: 'empty-none', triggerAll: false };
    case 'all':
      Logger.info('Empty commit configured to trigger all areas');
      return { strategy: 'empty-all', triggerAll: true };
    default:
      return { strategy: 'empty-none', triggerAll: false };
  }
}
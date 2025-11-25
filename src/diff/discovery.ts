import { GitHubContext, EdgeCaseConfig, ChangedFile } from '../types';
import { Logger } from '../utils/logger';
import { getChangedFilesFromPR } from './pull-request';
import { getChangedFilesFromPush } from './push';
import {
  isFirstCommit,
  isForcePush,
  handleFirstCommit,
  handleForcePush
} from './edge-cases';

export async function discoverChangedFiles(
  context: GitHubContext,
  token: string,
  config: EdgeCaseConfig
): Promise<ChangedFile[]> {
  const eventName = context.eventName;

  Logger.info(`Event: ${eventName}`);

  // Handle Pull Request events
  if (eventName === 'pull_request' || eventName === 'pull_request_target') {
    return await getChangedFilesFromPR(context, token);
  }

  // Handle Push events
  if (eventName === 'push') {
    const pushEvent = context.payload;
    
    // Check for first commit
    if (isFirstCommit(pushEvent)) {
      // Handle first commit scenario
      handleFirstCommit(pushEvent.after);
      return await getChangedFilesFromPush(context, token, pushEvent.after, pushEvent.after);
    }

    // Check for force push
    if (isForcePush(pushEvent)) {
      const { ref } = handleForcePush(context, config);
      return await getChangedFilesFromPush(context, token, ref, pushEvent.after);
    }

    // Normal push
    return await getChangedFilesFromPush(context, token, pushEvent.before, pushEvent.after);
  }

  throw new Error(`Unsupported event type: ${eventName}`);
}
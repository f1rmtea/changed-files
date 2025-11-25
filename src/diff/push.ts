import { getOctokit } from '@actions/github';
import { GitHubContext, ChangedFile } from '../types';
import { GitHubAPIError } from '../errors';
import { Logger } from '../utils/logger';
import { isBinaryFile } from '../utils/binary-files';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getChangedFilesFromPush(
    context: GitHubContext,
    token: string,
    baseRef: string,
    headRef: string
  ): Promise<ChangedFile[]> {
    const octokit = getOctokit(token);
    const { owner, repo } = context.repo;
  
    Logger.info(`Fetching changed files: ${baseRef}...${headRef}`);
  
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await octokit.rest.repos.compareCommitsWithBasehead({
          owner,
          repo,
          basehead: `${baseRef}...${headRef}`,
          per_page: 300
        });
  
        const files: ChangedFile[] = response.data.files?.map(file => ({
          path: file.filename,
          status: normalizeStatus(file.status),
          previous_path: file.previous_filename,
          binary: isBinaryFile(file.filename)
        })) || [];
  
        Logger.info(`Found ${files.length} changed file(s)`);
        return files;
  
      } catch (error: unknown) {
        if (attempt < MAX_RETRIES - 1) {
          Logger.warn(`API request failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
          await sleep(RETRY_DELAY * (attempt + 1));
        } else {
          const err = error as { message: string; status?: number };
          throw new GitHubAPIError(
            `Failed to compare commits after ${MAX_RETRIES} attempts: ${err.message}`,
            err.status
          );
        }
      }
    }
  
    return [];
  }

function normalizeStatus(status: string): ChangedFile['status'] {
  switch (status) {
    case 'added':
      return 'added';
    case 'modified':
    case 'changed':
      return 'modified';
    case 'removed':
      return 'removed';
    case 'renamed':
      return 'renamed';
    default:
      return 'modified';
  }
}
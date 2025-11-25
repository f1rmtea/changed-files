import { getOctokit } from '@actions/github';
import { GitHubContext, ChangedFile } from '../types';
import { GitHubAPIError } from '../errors';
import { Logger } from '../utils/logger';
import { isBinaryFile } from '../utils/binary-files';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getChangedFilesFromPR(
    context: GitHubContext,
    token: string
    ): Promise<ChangedFile[]> {
    const octokit = getOctokit(token);
    const { owner, repo } = context.repo;
    const pullNumber = context.payload.pull_request?.number;

    if (!pullNumber) {
        throw new GitHubAPIError('Pull request number not found in context');
    }

    Logger.info(`Fetching changed files for PR #${pullNumber}`);

    const allFiles: ChangedFile[] = [];
    let page = 1;
    const perPage = 100;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
        let hasMorePages = true;
        
        // Replace while(true) with while(hasMorePages)
        while (hasMorePages) {
            const response = await octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: pullNumber,
            per_page: perPage,
            page
            });

            const files = response.data.map(file => ({
            path: file.filename,
            status: normalizeStatus(file.status),
            previous_path: file.previous_filename,
            binary: isBinaryFile(file.filename)
            }));

            allFiles.push(...files);

            // Check if there are more pages
            if (response.data.length < perPage) {
            hasMorePages = false;
            } else {
            page++;
            }
        }

        Logger.info(`Found ${allFiles.length} changed file(s) in PR #${pullNumber}`);
        return allFiles;

        } catch (error: unknown) {  // Change any to unknown
        if (attempt < MAX_RETRIES - 1) {
            Logger.warn(`API request failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
            await sleep(RETRY_DELAY * (attempt + 1));
        } else {
            const err = error as { message: string; status?: number };
            throw new GitHubAPIError(
            `Failed to fetch PR files after ${MAX_RETRIES} attempts: ${err.message}`,
            err.status
            );
        }
        }
    }

    return allFiles;
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
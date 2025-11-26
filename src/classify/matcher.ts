import { minimatch } from 'minimatch';
import * as path from 'path';
import { ChangedFile, AreaConfig } from '../types';
import { Logger } from '../utils/logger';

interface DebugContext {
  areaName: string;
  debugEnabled: boolean;
}

function logDebug(ctx: DebugContext, file: ChangedFile, message: string): void {
  if (ctx.debugEnabled) {
    Logger.info(`[${ctx.areaName}] ${file.path} ${message}`);
  }
}

export function classifyFile(file: ChangedFile, areaConfig: AreaConfig, debugCtx?: DebugContext): boolean {
  // Step 1: Check if matches ANY include pattern
  let matchedIncludePattern: string | undefined;
  const matchesInclude = areaConfig.include.some(pattern => {
    const matches = minimatch(file.path, pattern, { dot: true });
    if (matches) {
      matchedIncludePattern = pattern;
    }
    return matches;
  });

  if (!matchesInclude) {
    if (debugCtx) {
      logDebug(debugCtx, file, `did not match any include patterns [${areaConfig.include.join(', ')}]`);
    }
    return false;
  }

  if (debugCtx) {
    logDebug(debugCtx, file, `matched include "${matchedIncludePattern}"`);
  }

  // Step 2: Check if matches ANY exclude pattern
  if (areaConfig.exclude && areaConfig.exclude.length > 0) {
    let matchedExcludePattern: string | undefined;
    const matchesExclude = areaConfig.exclude.some(pattern => {
      const matches = minimatch(file.path, pattern, { dot: true });
      if (matches) {
        matchedExcludePattern = pattern;
      }
      return matches;
    });

    if (matchesExclude) {
      if (debugCtx) {
        logDebug(debugCtx, file, `matched exclude "${matchedExcludePattern}"`);
      }
      return false;
    }

    if (debugCtx) {
      logDebug(debugCtx, file, 'did not match any exclude');
    }
  } else if (debugCtx) {
    logDebug(debugCtx, file, 'no exclude patterns configured');
  }

  // Step 3: Check required_extensions
  if (areaConfig.required_extensions && areaConfig.required_extensions.length > 0) {
    const fileExt = path.extname(file.path);
    if (!areaConfig.required_extensions.includes(fileExt)) {
      if (debugCtx) {
        logDebug(debugCtx, file, `ignored (extension "${fileExt || '(none)'}" not in required_extensions [${areaConfig.required_extensions.join(', ')}])`);
      }
      return false;
    }

    if (debugCtx) {
      logDebug(debugCtx, file, `extension "${fileExt}" is in required_extensions`);
    }
  }

  // Step 4: Check exclude_binary_files
  if (areaConfig.exclude_binary_files && file.binary) {
    if (debugCtx) {
      logDebug(debugCtx, file, 'ignored (binary file and exclude_binary_files is true)');
    }
    return false;
  }

  // Step 5: Check ignore_deleted_files
  if (areaConfig.ignore_deleted_files && file.status === 'removed') {
    if (debugCtx) {
      logDebug(debugCtx, file, 'ignored (deleted file and ignore_deleted_files is true)');
    }
    return false;
  }

  // Step 6: Check ignore_renamed_files
  if (areaConfig.ignore_renamed_files && file.status === 'renamed') {
    if (debugCtx) {
      logDebug(debugCtx, file, 'ignored (renamed file and ignore_renamed_files is true)');
    }
    return false;
  }

  if (debugCtx) {
    logDebug(debugCtx, file, '✓ matched');
  }

  return true;
}

export function classifyFiles(
  files: ChangedFile[],
  areas: Record<string, AreaConfig>,
  debugEnabled: boolean = false
): Record<string, ChangedFile[]> {
  const results: Record<string, ChangedFile[]> = {};

  // Initialize all areas
  for (const areaName of Object.keys(areas)) {
    results[areaName] = [];
  }

  // Classify each file
  for (const file of files) {
    for (const [areaName, areaConfig] of Object.entries(areas)) {
      const debugCtx: DebugContext = { areaName, debugEnabled };
      if (classifyFile(file, areaConfig, debugCtx)) {
        results[areaName].push(file);
      }
    }
  }

  return results;
}
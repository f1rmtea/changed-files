import { minimatch } from 'minimatch';
import * as path from 'path';
import { ChangedFile, AreaConfig } from '../types';
import { Logger } from '../utils/logger';

export function classifyFile(
  file: ChangedFile,
  areaConfig: AreaConfig,
  areaName?: string,
  debug = false
): boolean {
  // Step 1: Check if matches ANY include pattern
  let matchedIncludePattern: string | null = null;
  const matchesInclude = areaConfig.include.some(pattern => {
    const matches = minimatch(file.path, pattern, { dot: true });
    if (matches) {
      matchedIncludePattern = pattern;
    }
    return matches;
  });

  if (!matchesInclude) {
    if (debug && areaName) {
      Logger.info(`[${areaName}] ${file.path} did not match any include patterns`);
    }
    return false;
  }

  if (debug && areaName && matchedIncludePattern) {
    Logger.info(`[${areaName}] ${file.path} matched include "${matchedIncludePattern}"`);
  }

  // Step 2: Check if matches ANY exclude pattern
  if (areaConfig.exclude && areaConfig.exclude.length > 0) {
    let matchedExcludePattern: string | null = null;
    const matchesExclude = areaConfig.exclude.some(pattern => {
      const matches = minimatch(file.path, pattern, { dot: true });
      if (matches) {
        matchedExcludePattern = pattern;
      }
      return matches;
    });

    if (matchesExclude) {
      if (debug && areaName && matchedExcludePattern) {
        Logger.info(`[${areaName}] ${file.path} excluded by "${matchedExcludePattern}"`);
      }
      return false;
    }
  }

  if (debug && areaName) {
    Logger.info(`[${areaName}] ${file.path} did not match any exclude patterns`);
  }

  // Step 3: Check required_extensions
  if (areaConfig.required_extensions && areaConfig.required_extensions.length > 0) {
    const fileExt = path.extname(file.path);
    if (!areaConfig.required_extensions.includes(fileExt)) {
      if (debug && areaName) {
        Logger.info(
          `[${areaName}] ${file.path} ignored (extension "${fileExt || '(none)'}" not in required_extensions)`
        );
      }
      return false;
    }
  }

  // Step 4: Check exclude_binary_files
  if (areaConfig.exclude_binary_files && file.binary) {
    if (debug && areaName) {
      Logger.info(`[${areaName}] ${file.path} ignored (binary file)`);
    }
    return false;
  }

  // Step 5: Check ignore_deleted_files
  if (areaConfig.ignore_deleted_files && file.status === 'removed') {
    if (debug && areaName) {
      Logger.info(`[${areaName}] ${file.path} ignored (deleted file)`);
    }
    return false;
  }

  // Step 6: Check ignore_renamed_files
  // Only ignore renamed files that have no content changes (pure renames)
  if (areaConfig.ignore_renamed_files && file.status === 'renamed') {
    const hasContentChanges = (file.additions ?? 0) > 0 || (file.deletions ?? 0) > 0;
    if (!hasContentChanges) {
      if (debug && areaName) {
        Logger.info(`[${areaName}] ${file.path} ignored (pure rename, no content changes)`);
      }
      return false;
    }
  }

  return true;
}

export function classifyFiles(
  files: ChangedFile[],
  areas: Record<string, AreaConfig>,
  debug = false
): Record<string, ChangedFile[]> {
  const results: Record<string, ChangedFile[]> = {};

  // Initialize all areas
  for (const areaName of Object.keys(areas)) {
    results[areaName] = [];
  }

  // Classify each file
  for (const file of files) {
    for (const [areaName, areaConfig] of Object.entries(areas)) {
      if (classifyFile(file, areaConfig, areaName, debug)) {
        results[areaName].push(file);
      }
    }
  }

  return results;
}
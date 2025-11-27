import { minimatch } from 'minimatch';
import * as path from 'path';
import { ChangedFile, AreaConfig, DebugMode } from '../types';
import { Logger } from '../utils/logger';

interface FileMatchResult {
  areaName: string;
  matched: boolean;
  reason: string;
}

interface FileDebugInfo {
  filePath: string;
  matches: FileMatchResult[];
}

export function classifyFile(
  file: ChangedFile,
  areaConfig: AreaConfig,
  areaName?: string,
  debug: DebugMode = false
): { matched: boolean; reason: string } {
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
    const reason = 'did not match any include patterns';
    if (debug === 'verbose' && areaName) {
      Logger.info(`[${areaName}] ${file.path} ${reason}`);
    }
    return { matched: false, reason };
  }

  if (debug === 'verbose' && areaName && matchedIncludePattern) {
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
      const reason = `excluded by "${matchedExcludePattern}"`;
      if (debug === 'verbose' && areaName) {
        Logger.info(`[${areaName}] ${file.path} ${reason}`);
      }
      return { matched: false, reason };
    }
  }

  if (debug === 'verbose' && areaName) {
    Logger.info(`[${areaName}] ${file.path} did not match any exclude patterns`);
  }

  // Step 3: Check required_extensions
  if (areaConfig.required_extensions && areaConfig.required_extensions.length > 0) {
    const fileExt = path.extname(file.path);
    if (!areaConfig.required_extensions.includes(fileExt)) {
      const reason = `extension "${fileExt || '(none)'}" not in required_extensions`;
      if (debug === 'verbose' && areaName) {
        Logger.info(`[${areaName}] ${file.path} ignored (${reason})`);
      }
      return { matched: false, reason };
    }
  }

  // Step 4: Check exclude_binary_files
  if (areaConfig.exclude_binary_files && file.binary) {
    const reason = 'binary file excluded';
    if (debug === 'verbose' && areaName) {
      Logger.info(`[${areaName}] ${file.path} ignored (binary file)`);
    }
    return { matched: false, reason };
  }

  // Step 5: Check ignore_deleted_files
  if (areaConfig.ignore_deleted_files && file.status === 'removed') {
    const reason = 'deleted file ignored';
    if (debug === 'verbose' && areaName) {
      Logger.info(`[${areaName}] ${file.path} ignored (deleted file)`);
    }
    return { matched: false, reason };
  }

  // Step 6: Check ignore_renamed_files
  // Only ignore renamed files that have no content changes (pure renames)
  if (areaConfig.ignore_renamed_files && file.status === 'renamed') {
    const hasContentChanges = (file.additions ?? 0) > 0 || (file.deletions ?? 0) > 0;
    if (!hasContentChanges) {
      const reason = 'pure rename, no content changes';
      if (debug === 'verbose' && areaName) {
        Logger.info(`[${areaName}] ${file.path} ignored (pure rename, no content changes)`);
      }
      return { matched: false, reason };
    }
  }

  return { matched: true, reason: matchedIncludePattern ? `matched include "${matchedIncludePattern}"` : 'matched' };
}

function logGroupedDebugInfo(debugInfo: FileDebugInfo[]): void {
  for (const fileInfo of debugInfo) {
    const matched = fileInfo.matches.filter(m => m.matched);
    const notMatched = fileInfo.matches.filter(m => !m.matched);

    Logger.info(`File: ${fileInfo.filePath}`);

    if (matched.length > 0) {
      const matchedList = matched.map(m => `${m.areaName} (${m.reason})`).join(', ');
      Logger.info(`  -> Matches: ${matchedList}`);
    }

    if (notMatched.length > 0) {
      const notMatchedList = notMatched.map(m => m.areaName).join(', ');
      Logger.info(`  -> Not matched: ${notMatchedList}`);
    }
  }
}

export function classifyFiles(
  files: ChangedFile[],
  areas: Record<string, AreaConfig>,
  debug: DebugMode = false
): { results: Record<string, ChangedFile[]>; debugInfo: FileDebugInfo[] } {
  const results: Record<string, ChangedFile[]> = {};
  const debugInfoByFile: FileDebugInfo[] = [];

  // Initialize all areas
  for (const areaName of Object.keys(areas)) {
    results[areaName] = [];
  }

  // Classify each file
  for (const file of files) {
    const fileDebugInfo: FileDebugInfo = {
      filePath: file.path,
      matches: []
    };

    for (const [areaName, areaConfig] of Object.entries(areas)) {
      const result = classifyFile(file, areaConfig, areaName, debug);

      if (result.matched) {
        results[areaName].push(file);
      }

      // Collect debug info for grouped output
      if (debug === true) {
        fileDebugInfo.matches.push({
          areaName,
          matched: result.matched,
          reason: result.reason
        });
      }
    }

    if (debug === true) {
      debugInfoByFile.push(fileDebugInfo);
    }
  }

  return { results, debugInfo: debugInfoByFile };
}

export function logDebugInfo(debugInfo: FileDebugInfo[]): void {
  if (debugInfo.length > 0) {
    logGroupedDebugInfo(debugInfo);
  }
}
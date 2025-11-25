import { minimatch } from 'minimatch';
import * as path from 'path';
import { ChangedFile, AreaConfig } from '../types';
// Logger is not currently used

export function classifyFile(file: ChangedFile, areaConfig: AreaConfig): boolean {
  // Step 1: Check if matches ANY include pattern
  const matchesInclude = areaConfig.include.some(pattern =>
    minimatch(file.path, pattern, { dot: true })
  );

  if (!matchesInclude) {
    return false;
  }

  // Step 2: Check if matches ANY exclude pattern
  if (areaConfig.exclude && areaConfig.exclude.length > 0) {
    const matchesExclude = areaConfig.exclude.some(pattern =>
      minimatch(file.path, pattern, { dot: true })
    );

    if (matchesExclude) {
      return false;
    }
  }

  // Step 3: Check required_extensions
  if (areaConfig.required_extensions && areaConfig.required_extensions.length > 0) {
    const fileExt = path.extname(file.path);
    if (!areaConfig.required_extensions.includes(fileExt)) {
      return false;
    }
  }

  // Step 4: Check exclude_binary_files
  if (areaConfig.exclude_binary_files && file.binary) {
    return false;
  }

  // Step 5: Check ignore_deleted_files
  if (areaConfig.ignore_deleted_files && file.status === 'removed') {
    return false;
  }

  // Step 6: Check ignore_renamed_files
  if (areaConfig.ignore_renamed_files && file.status === 'renamed') {
    return false;
  }

  return true;
}

export function classifyFiles(
  files: ChangedFile[],
  areas: Record<string, AreaConfig>
): Record<string, ChangedFile[]> {
  const results: Record<string, ChangedFile[]> = {};

  // Initialize all areas
  for (const areaName of Object.keys(areas)) {
    results[areaName] = [];
  }

  // Classify each file
  for (const file of files) {
    for (const [areaName, areaConfig] of Object.entries(areas)) {
      if (classifyFile(file, areaConfig)) {
        results[areaName].push(file);
      }
    }
  }

  return results;
}